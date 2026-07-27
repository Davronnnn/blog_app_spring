package com.blog.api.common.exception;

/** Username/email already taken, etc. -> becomes HTTP 409 Conflict. */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
