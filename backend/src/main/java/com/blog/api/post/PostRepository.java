package com.blog.api.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * @EntityGraph solves the "N+1 queries" problem: author is LAZY, so
     * mapping 10 posts to DTOs would fire 10 extra SELECTs for authors.
     * With attributePaths = "author" Spring fetches posts + authors
     * in ONE query with a JOIN.
     */
    @EntityGraph(attributePaths = "author")
    Optional<Post> findBySlug(String slug);

    boolean existsBySlug(String slug);

    long countByAuthorId(Long authorId);

    @Override
    @EntityGraph(attributePaths = "author")
    Page<Post> findAll(Pageable pageable);

    /** Derived query: WHERE author.username = ? — Spring walks the relation for you. */
    @EntityGraph(attributePaths = "author")
    Page<Post> findByAuthorUsername(String username, Pageable pageable);

    /**
     * When a method name would get unreadable, write JPQL yourself with @Query.
     * JPQL queries entities/fields (Post, p.title), not tables/columns —
     * Hibernate translates it to SQL.
     */
    @EntityGraph(attributePaths = "author")
    @Query("""
            SELECT p FROM Post p
            WHERE LOWER(p.title)   LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(p.excerpt) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<Post> search(@Param("query") String query, Pageable pageable);
}
