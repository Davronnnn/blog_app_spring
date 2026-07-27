-- Flyway migration V1: initial schema.
-- Flyway runs files named V<version>__<description>.sql exactly once, in order,
-- and records them in the flyway_schema_history table.

CREATE TABLE users (
    id           BIGSERIAL PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,           -- BCrypt hash, never plain text
    display_name VARCHAR(100),
    bio          TEXT,
    role         VARCHAR(20)  NOT NULL,           -- 'USER' or 'ADMIN'
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE posts (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,  -- URL-friendly id, e.g. "my-first-post"
    excerpt         VARCHAR(500),
    content         TEXT         NOT NULL,
    cover_image_url VARCHAR(500),
    author_id       BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes for the queries we actually run: list by date, filter by author.
CREATE INDEX idx_posts_author_id  ON posts (author_id);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);

CREATE TABLE comments (
    id         BIGSERIAL PRIMARY KEY,
    content    TEXT        NOT NULL,
    post_id    BIGINT      NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    author_id  BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post_id ON comments (post_id);
