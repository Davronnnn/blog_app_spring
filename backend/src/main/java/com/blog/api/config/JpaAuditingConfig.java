package com.blog.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Turns on automatic @CreatedDate / @LastModifiedDate handling (see BaseEntity).
 * Kept in its own config class (instead of on the main class) so tests can
 * exclude it easily.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
