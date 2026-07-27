package com.blog.api.comment.dto;

import com.blog.api.comment.Comment;
import com.blog.api.user.dto.AuthorResponse;

import java.time.Instant;

public record CommentResponse(
        Long id,
        String content,
        AuthorResponse author,
        Instant createdAt
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                AuthorResponse.from(comment.getAuthor()),
                comment.getCreatedAt()
        );
    }
}
