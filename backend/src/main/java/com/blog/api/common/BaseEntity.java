package com.blog.api.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Shared audit fields for every entity.
 *
 * @MappedSuperclass = "this class is not a table itself; its fields are
 * inherited by entities that extend it".
 *
 * AuditingEntityListener + @CreatedDate/@LastModifiedDate = Spring Data JPA
 * fills these timestamps automatically on INSERT and UPDATE
 * (enabled by @EnableJpaAuditing in JpaAuditingConfig).
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
public abstract class BaseEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
