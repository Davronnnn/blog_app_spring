package com.blog.api.user.dto;

import com.blog.api.user.User;

/**
 * The public face of a user when shown as a post/comment author.
 * Deliberately smaller than UserResponse — no email, no role.
 */
public record AuthorResponse(
        Long id,
        String username,
        String displayName
) {
    public static AuthorResponse from(User user) {
        return new AuthorResponse(user.getId(), user.getUsername(), user.getDisplayName());
    }
}
