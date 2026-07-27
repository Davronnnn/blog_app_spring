package com.blog.api.comment;

import com.blog.api.comment.dto.CommentRequest;
import com.blog.api.comment.dto.CommentResponse;
import com.blog.api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Comments are a sub-resource of posts, so reading/creating lives under
 * /api/posts/{slug}/comments. Deleting uses the comment's own id.
 */
@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/api/posts/{slug}/comments")
    public List<CommentResponse> getComments(@PathVariable String slug) {
        return commentService.getComments(slug);
    }

    @PostMapping("/api/posts/{slug}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse addComment(@PathVariable String slug,
                                      @Valid @RequestBody CommentRequest request,
                                      @AuthenticationPrincipal User currentUser) {
        return commentService.addComment(slug, request, currentUser);
    }

    @DeleteMapping("/api/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long id,
                              @AuthenticationPrincipal User currentUser) {
        commentService.deleteComment(id, currentUser);
    }
}
