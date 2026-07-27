package com.blog.api.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Used for both create (POST) and update (PUT) — same shape, same rules. */
public record PostRequest(

        @NotBlank(message = "Title is required")
        @Size(min = 3, max = 200, message = "Title must be 3-200 characters")
        String title,

        @Size(max = 500, message = "Excerpt must be at most 500 characters")
        String excerpt,

        @NotBlank(message = "Content is required")
        @Size(min = 10, max = 100_000, message = "Content must be 10-100000 characters")
        String content,

        @Size(max = 500, message = "Cover image URL must be at most 500 characters")
        String coverImageUrl
) {
}
