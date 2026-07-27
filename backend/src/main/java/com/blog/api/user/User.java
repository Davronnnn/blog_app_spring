package com.blog.api.user;

import com.blog.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * The User entity. Two jobs:
 *  1. JPA entity -> maps to the "users" table.
 *  2. Implements Spring Security's UserDetails -> can be used directly
 *     as the authenticated principal, no separate adapter class needed.
 *
 * Lombok:
 *  @Getter/@Setter        -> generates getters/setters (incl. getUsername/getPassword
 *                            that UserDetails requires)
 *  @Builder               -> User.builder().username("...")...build()
 *  @NoArgsConstructor     -> JPA requires a no-args constructor
 *  @AllArgsConstructor    -> required by @Builder when other constructors exist
 */
@Entity
@Table(name = "users") // "user" is a reserved word in PostgreSQL, so: "users"
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // let Postgres BIGSERIAL generate ids
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    /** BCrypt hash — the raw password is never stored. */
    @Column(nullable = false)
    private String password;

    @Column(name = "display_name", length = 100)
    private String displayName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Enumerated(EnumType.STRING) // store "USER"/"ADMIN", not ordinal numbers
    @Column(nullable = false, length = 20)
    private Role role;

    /**
     * Spring Security asks: "what is this user allowed to do?"
     * Convention: role names are prefixed with "ROLE_".
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    // isAccountNonExpired / isAccountNonLocked / isCredentialsNonExpired / isEnabled
    // have default implementations in UserDetails that return true.
}
