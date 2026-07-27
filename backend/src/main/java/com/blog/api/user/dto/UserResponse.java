package com.blog.api.user.dto;

import com.blog.api.user.Role;
import com.blog.api.user.User;

import java.time.Instant;

/**
 * What the API returns for the CURRENT user. Note what's absent: the
 * password hash. This is exactly why entities are never serialized directly.
 */
public record UserResponse(
        Long id,
        String username,
        String email,
        String displayName,
        String bio,
        Role role,
        Instant createdAt
) {
    /** Static factory: the one place that maps User -> UserResponse. */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getBio(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
