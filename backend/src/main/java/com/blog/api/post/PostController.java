package com.blog.api.post;

import com.blog.api.post.dto.PostRequest;
import com.blog.api.post.dto.PostResponse;
import com.blog.api.post.dto.PostSummaryResponse;
import com.blog.api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST conventions:
 *   GET    /api/posts          list (public, paginated)
 *   GET    /api/posts/{slug}   read one (public)
 *   POST   /api/posts          create        -> 201
 *   PUT    /api/posts/{slug}   full update   -> 200
 *   DELETE /api/posts/{slug}   delete        -> 204 (no body)
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public Page<PostSummaryResponse> getPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String author) {
        return postService.getPosts(page, size, search, author);
    }

    @GetMapping("/{slug}")
    public PostResponse getPost(@PathVariable String slug) {
        return postService.getBySlug(slug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse create(@Valid @RequestBody PostRequest request,
                               @AuthenticationPrincipal User currentUser) {
        return postService.create(request, currentUser);
    }

    @PutMapping("/{slug}")
    public PostResponse update(@PathVariable String slug,
                               @Valid @RequestBody PostRequest request,
                               @AuthenticationPrincipal User currentUser) {
        return postService.update(slug, request, currentUser);
    }

    @DeleteMapping("/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @AuthenticationPrincipal User currentUser) {
        postService.delete(slug, currentUser);
    }
}
