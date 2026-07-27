package com.blog.api.admin.dto;

import com.blog.api.user.Role;
import com.blog.api.user.User;

import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String username,
        String email,
        String displayName,
        Role role,
        long postCount,
        Instant createdAt
) {
    public static AdminUserResponse from(User user, long postCount) {
        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                postCount,
                user.getCreatedAt()
        );
    }
}
