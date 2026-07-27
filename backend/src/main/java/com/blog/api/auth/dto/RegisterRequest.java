package com.blog.api.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTOs as Java records: immutable, concise, no Lombok needed.
 * The jakarta.validation annotations run automatically when the controller
 * parameter is marked @Valid; failures become a 400 with field errors
 * (see GlobalExceptionHandler).
 */
public record RegisterRequest(

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, digits and underscores")
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        @Size(max = 255)
        String email,

        @NotBlank(message = "Password is required")
        // max 72: BCrypt only uses the first 72 bytes of a password
        @Size(min = 8, max = 72, message = "Password must be 8-72 characters")
        String password,

        @Size(max = 100, message = "Display name must be at most 100 characters")
        String displayName
) {
}
