package com.blog.api.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Spring Data JPA repository. You write NO implementation:
 * Spring generates the SQL from the method names at startup
 * ("derived query methods").
 *
 * JpaRepository<User, Long> already gives you save(), findById(),
 * findAll(), delete(), count(), etc. for free.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);   // SELECT * FROM users WHERE username = ?

    boolean existsByUsername(String username);        // SELECT EXISTS(...)

    boolean existsByEmail(String email);

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<User> search(@Param("query") String query, Pageable pageable);
}
