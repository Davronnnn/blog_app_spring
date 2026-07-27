package com.blog.api.user;

/**
 * User roles. Stored as a string in the DB (see @Enumerated(EnumType.STRING)
 * in User) so adding/reordering enum values never corrupts existing rows.
 */
public enum Role {
    USER,
    ADMIN
}
