package com.blog.api.auth.dto;

import com.blog.api.user.dto.UserResponse;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {
}
