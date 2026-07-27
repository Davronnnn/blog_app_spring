package com.blog.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Type-safe configuration: binds the "app.jwt.*" keys from application.yml
 * to this immutable record. Best practice over sprinkling @Value("${...}")
 * strings everywhere — typos fail at startup, not at runtime.
 *
 * Activated by @ConfigurationPropertiesScan on the main application class.
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        long accessTokenExpiration,
        long refreshTokenExpiration
) {
}
