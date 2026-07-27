package com.blog.api.comment;

import com.blog.api.comment.dto.CommentRequest;
import com.blog.api.comment.dto.CommentResponse;
import com.blog.api.common.exception.ResourceNotFoundException;
import com.blog.api.post.Post;
import com.blog.api.post.PostRepository;
import com.blog.api.user.Role;
import com.blog.api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(String postSlug) {
        Post post = findPostOrThrow(postSlug);
        return commentRepository.findByPostIdOrderByCreatedAtDesc(post.getId())
                .stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse addComment(String postSlug, CommentRequest request, User currentUser) {
        Post post = findPostOrThrow(postSlug);
        Comment comment = Comment.builder()
                .content(request.content().trim())
                .post(post)
                .author(currentUser)
                .build();
        commentRepository.save(comment);
        return CommentResponse.from(comment);
    }

    /** Allowed: the comment's author, the post's author (moderation), admins. */
    @Transactional
    public void deleteComment(Long commentId, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));

        boolean isCommentAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isPostAuthor = comment.getPost().getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
            throw new AccessDeniedException("You cannot delete this comment");
        }
        commentRepository.delete(comment);
    }

    private Post findPostOrThrow(String slug) {
        return postRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + slug));
    }
}
