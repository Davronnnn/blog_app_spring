 # Blog API — Backend Walkthrough (Spring Boot 4, Java 21)

This guide explains **every layer** of the backend, in the order a request flows through it.
Read it top to bottom once, then keep it open while you read the code.

---

## 0. The big picture

```
HTTP request
   │
   ▼
JwtAuthenticationFilter   ── reads "Authorization: Bearer ..." → authenticates the request
   │
   ▼
SecurityFilterChain rules ── is this URL public? authenticated? → 401 if not allowed
   │
   ▼
Controller                ── binds JSON → DTO, calls service, returns DTO → JSON
   │
   ▼
Service                   ── business logic, transactions, ownership checks
   │
   ▼
Repository                ── Spring Data JPA generates the SQL
   │
   ▼
PostgreSQL                ── schema created by Flyway migrations
```

The package layout is **by feature**, not by layer — everything about posts lives in
`post/`, everything about auth in `auth/`, etc. This scales much better than
`controllers/`, `services/`, `models/` folders:

```
com.blog.api
├── auth/        login, register, refresh + DTOs
├── comment/     Comment entity, repo, service, controller + DTOs
├── common/      BaseEntity, exceptions, global error handler
├── config/      Security, beans, JWT properties, JPA auditing
├── post/        Post entity, repo, service, controller + DTOs
├── security/    JwtService, JwtAuthenticationFilter
└── user/        User entity, Role, repo + DTOs
```

---

## 1. Build & configuration

### `pom.xml`
Maven's build file. Key ideas:
- **`spring-boot-starter-parent`** pins compatible versions of ~200 libraries, so most
  dependencies need no `<version>` tag.
- **Starters** (`spring-boot-starter-webmvc`, `-data-jpa`, `-security`, `-validation`)
  are bundles: each pulls in everything needed for that capability.
- We added **JJWT** (JWT creation/verification, in 3 artifacts: api/impl/jackson) and
  **Flyway** (DB migrations).
- **Lombok** is a compile-time code generator (`@Getter`, `@Builder`, ...) wired into the
  compiler via `annotationProcessorPaths`.

### `application.yml`
All runtime config. Two best practices to notice:
- **`${ENV_VAR:default}`** — secrets and connection strings come from environment
  variables in production; the defaults are for local dev only.
- **`ddl-auto: validate`** — Hibernate never touches the schema; it only verifies the
  entities match it. The schema is owned by...

### `db/migration/V1__init.sql` (Flyway)
Versioned SQL migrations. Flyway runs each `V<n>__*.sql` exactly once and records it in
the `flyway_schema_history` table. Need a new column next month? Add `V2__add_x.sql` —
never edit V1. This is how real teams evolve databases safely.

Also note `open-in-view: false`: it forces all DB access to happen inside the
service/transaction layer (see §5), which surfaces lazy-loading bugs early.

---

## 2. Entities (the `@Entity` classes)

An entity = a Java class mapped to a table. Hibernate reads/writes rows through it.

### `common/BaseEntity.java`
- `@MappedSuperclass`: not a table — its fields (`createdAt`, `updatedAt`) are inherited
  by every entity.
- `@CreatedDate` / `@LastModifiedDate` + `AuditingEntityListener`: Spring fills these
  timestamps automatically (enabled by `@EnableJpaAuditing` in `JpaAuditingConfig`).

### `user/User.java`
Does two jobs:
1. JPA entity for the `users` table.
2. Implements Spring Security's **`UserDetails`**, so the entity itself can be the
   authenticated principal — controllers receive it via `@AuthenticationPrincipal`.

Details worth noticing:
- Table is `users` because `user` is a reserved word in PostgreSQL.
- `@Enumerated(EnumType.STRING)` stores `"USER"`/`"ADMIN"` text. Never use the default
  (ORDINAL) — reordering the enum would silently corrupt data.
- `getAuthorities()` returns `ROLE_USER`/`ROLE_ADMIN` — Spring Security's convention.
- The `password` field holds a **BCrypt hash**, never plain text.

### `post/Post.java`, `comment/Comment.java`
The key concept is the relation:

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "author_id", nullable = false)
private User author;
```

- `@ManyToOne` = many posts → one user; the FK column is `author_id`.
- **`FetchType.LAZY` is the single most important JPA habit**: don't load the author
  until `getAuthor()` is called. The default for `@ManyToOne` is EAGER, which joins the
  users table on *every* post query whether you need it or not.

---

## 3. Repositories (Spring Data JPA)

You write an **interface**; Spring generates the implementation and SQL at startup.

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username); // SQL derived from the method name
    boolean existsByEmail(String email);
}
```

Three techniques shown in `PostRepository`:

1. **Derived queries** — `findByAuthorUsername(...)` walks the `author` relation and
   generates the JOIN itself.
2. **`@Query` with JPQL** — for anything complex (our `search`). JPQL queries *entities
   and fields*, not tables and columns; Hibernate translates to SQL.
3. **`@EntityGraph(attributePaths = "author")`** — solves the **N+1 problem**: without
   it, mapping a page of 10 posts to DTOs would run 1 query for posts + 10 for authors.
   With it: 1 query with a JOIN. This is the classic JPA performance trap — learn to
   spot it in the SQL log (`org.hibernate.SQL: debug`).

---

## 4. DTOs — the API contract

Entities **never** cross the API boundary. Every request/response has a dedicated
`record`:

| DTO | Why it exists |
|---|---|
| `RegisterRequest`, `LoginRequest`, `PostRequest`, `CommentRequest` | input + validation rules |
| `UserResponse` | the current user — has email, **never the password hash** |
| `AuthorResponse` | public author info — no email, no role |
| `PostSummaryResponse` | list view — no `content` (don't ship article bodies in lists) |
| `PostResponse` | detail view — everything |

Why not return entities directly? Because you'd leak fields (password hash!), trigger
lazy-loading during JSON serialization, and couple your DB schema to your public API —
any column rename would break clients.

**Validation** lives on the request DTOs as annotations (`@NotBlank`, `@Size`,
`@Email`, `@Pattern`). They run when a controller parameter is marked `@Valid`; failures
become HTTP 400 with per-field messages (see §7). Fun detail: password max is 72 because
BCrypt ignores everything past 72 bytes.

Each response DTO has a `static from(Entity)` factory — the one place mapping happens.
(Big projects often use MapStruct instead; same idea, generated.)

---

## 5. Services — business logic + transactions

Rules of the layer:
- All business decisions live here (controllers stay dumb).
- Every public method is `@Transactional` (or `readOnly = true` for queries).
- Throw exceptions; never return nulls or error codes.

Things to study in `PostService`:

- **Dirty checking** — `update()` never calls `save()`. Inside a transaction, Hibernate
  tracks loaded entities and flushes any setter changes automatically on commit.
- **Ownership checks** (`assertCanModify`) — authorization that depends on *data*
  ("is this user the author of this row?") can't be expressed in URL rules, so it
  belongs in the service. Admins bypass it.
- **Slug generation** — `"My First Pöst!"` → `"my-first-post"`, with `-2`, `-3`
  suffixes on collision. Slugs never change on update (don't break shared URLs).
- **Clamping page size** — never trust client paging params (`size=100000`).

`AuthService` is the auth flow:
- `register`: duplicate checks → friendly 409s; BCrypt-hash the password; save; return tokens.
- `login`: delegate to `AuthenticationManager` — *we never compare passwords ourselves*.
- `refresh`: verify the token is a *refresh* token (an access token must not work here),
  then issue a fresh pair.

---

## 6. Security — the JWT machinery

The mental model: **stateless auth**. No sessions on the server. The signed token *is*
the proof of identity, presented on every request.

### `security/JwtService.java`
A JWT is `header.payload.signature` (each base64). The payload carries the username
(`sub`), expiry (`exp`), and our custom `type` claim. The signature is an HMAC-SHA256 of
header+payload using our secret key — anyone can *read* a JWT, but nobody can *forge*
one without the key.

Two tokens per login:
| | lifetime | used for |
|---|---|---|
| access token | 15 min | every API call |
| refresh token | 7 days | only `POST /api/auth/refresh` |

Short access tokens limit damage if one leaks; the refresh token lets users stay logged
in without re-typing passwords.

### `security/JwtAuthenticationFilter.java`
Runs once per request, before any controller:
1. No `Bearer` header → pass through (maybe the URL is public).
2. Parse + verify the token (signature and expiry checked together).
3. Load the user, reject refresh tokens, then the key line:
   `SecurityContextHolder.getContext().setAuthentication(...)` — "this request is
   authenticated as this user".
4. Invalid token → **don't throw**, just continue unauthenticated; the URL rules decide
   whether that's a problem.

### `config/SecurityConfig.java`
The rulebook:
- `csrf.disable()` — CSRF attacks ride on cookies; we use headers, so it doesn't apply.
- `SessionCreationPolicy.STATELESS` — never create an HTTP session.
- URL rules: `register/login/refresh` public, `GET /api/posts/**` public, everything
  else authenticated.
- A custom `authenticationEntryPoint` returns `401 + JSON` instead of the default
  redirect-to-login-page (useless for an API).
- Our filter is registered **before** `UsernamePasswordAuthenticationFilter`.
- The **CORS** bean allows the browser at `localhost:3000` to call `localhost:8080`.

### `config/ApplicationConfig.java`
The three beans Spring Security needs from us:
- `UserDetailsService` — "given a username, load the user" (a lambda over `UserRepository`).
- `PasswordEncoder` — BCrypt: deliberately slow, auto-salted.
- `AuthenticationManager` — the object `AuthService.login()` calls to verify credentials.

### `config/JwtProperties.java`
`@ConfigurationProperties` binds `app.jwt.*` from YAML into a typed, immutable record —
better than scattering `@Value("${...}")` strings (typos fail at startup, not runtime).

---

## 7. Controllers + error handling

### Controllers (`AuthController`, `PostController`, `CommentController`)
Thin by design — bind HTTP, call service, return DTO:
- `@RestController` → return values are serialized to JSON.
- `@Valid @RequestBody RegisterRequest r` → deserialize + validate in one step.
- `@AuthenticationPrincipal User u` → injects the user the JWT filter authenticated.
- Correct status codes via `@ResponseStatus`: **201** created, **204** no content on delete.
- REST shape: comments are a sub-resource → `POST /api/posts/{slug}/comments`.

### `common/exception/GlobalExceptionHandler.java`
One `@RestControllerAdvice` class turns every exception into a clean HTTP response, in
RFC 7807 "Problem Details" format (Spring's built-in `ProblemDetail`):

| exception | status |
|---|---|
| `ResourceNotFoundException` | 404 |
| `DuplicateResourceException` | 409 |
| `BadCredentialsException` | 401 (message deliberately vague — never reveal *which* of username/password was wrong) |
| `AccessDeniedException` | 403 |
| `MethodArgumentNotValidException` | 400 + `errors: {field: message}` map |
| anything else | 500, logged, generic message (never leak stack traces) |

Services just `throw`; no controller ever contains a `try/catch` for business errors.

---

## 8. The full journey of one request

`POST /api/posts` with a valid token:

1. `JwtAuthenticationFilter` verifies the signature, loads `davron`, marks the request authenticated.
2. Security rules: `anyRequest().authenticated()` → OK.
3. `PostController.create` — JSON → `PostRequest`, validation passes; injects the `User`.
4. `PostService.create` — opens a transaction, generates a unique slug, `save()`.
5. `@CreatedDate`/`@LastModifiedDate` filled in automatically; Hibernate emits the `INSERT`.
6. `PostResponse.from(post, 0)` → serialized to JSON, returned with **201**.
7. Had anything thrown: transaction rolls back, `GlobalExceptionHandler` maps it to JSON.

---

## 9. Try it yourself (curl)

```bash
# register
curl -s -X POST localhost:8080/api/auth/register -H 'Content-Type: application/json' \
  -d '{"username":"davron","email":"d@example.com","password":"password123","displayName":"Davron"}'

# login → grab .accessToken from the response
TOKEN=$(curl -s -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"davron","password":"password123"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["accessToken"])')

# create a post
curl -s -X POST localhost:8080/api/posts -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Hello Spring","excerpt":"My first post","content":"Written in **markdown**."}'

# read publicly (no token)
curl -s localhost:8080/api/posts
curl -s localhost:8080/api/posts/hello-spring
```

## 10. Where to go next

- **Testing**: `@DataJpaTest` for repositories, `@WebMvcTest` + MockMvc for controllers,
  Testcontainers for a real Postgres in integration tests.
- **Refresh token rotation**: store refresh tokens (or their hashes) in a DB table so
  they can be revoked; rotate on every use.
- **OpenAPI**: add `springdoc-openapi` for auto-generated Swagger docs.
- **Observability**: Spring Boot Actuator (`/actuator/health`, metrics).
- **N+1 hunting**: watch the SQL log while clicking around the frontend.
