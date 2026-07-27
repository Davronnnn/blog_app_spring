package com.blog.api.common.exception;

/**
 * Thrown by services when an entity doesn't exist.
 * Unchecked (extends RuntimeException) so services stay clean — the
 * GlobalExceptionHandler catches it and turns it into a 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
