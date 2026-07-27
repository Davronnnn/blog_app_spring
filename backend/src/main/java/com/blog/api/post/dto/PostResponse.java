package com.blog.api.post.dto;

import com.blog.api.post.Post;
import com.blog.api.user.dto.AuthorResponse;

import java.time.Instant;

/** Full post, including content — for the detail page. */
public record PostResponse(
        Long id,
        String title,
        String slug,
        String excerpt,
        String content,
        String coverImageUrl,
        AuthorResponse author,
        long commentCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static PostResponse from(Post post, long commentCount) {
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                post.getSlug(),
                post.getExcerpt(),
                post.getContent(),
                post.getCoverImageUrl(),
                AuthorResponse.from(post.getAuthor()),
                commentCount,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
