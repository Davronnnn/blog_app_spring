package com.blog.api.admin.dto;

public record AdminStatsResponse(
        long userCount,
        long postCount,
        long commentCount
) {
}
