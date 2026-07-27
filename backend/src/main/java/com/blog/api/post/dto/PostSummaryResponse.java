package com.blog.api.post.dto;

import com.blog.api.post.Post;
import com.blog.api.user.dto.AuthorResponse;

import java.time.Instant;

/**
 * Post WITHOUT its content — for list pages. Sending full article bodies in a
 * paginated list would waste bandwidth for text nobody reads on that page.
 */
public record PostSummaryResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String coverImageUrl,
        AuthorResponse author,
        long commentCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static PostSummaryResponse from(Post post, long commentCount) {
        return new PostSummaryResponse(
                post.getId(),
                post.getTitle(),
                post.getSlug(),
                post.getExcerpt(),
                post.getCoverImageUrl(),
                AuthorResponse.from(post.getAuthor()),
                commentCount,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
