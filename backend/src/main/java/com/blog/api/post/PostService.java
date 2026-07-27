package com.blog.api.post;

import com.blog.api.comment.CommentRepository;
import com.blog.api.common.exception.ResourceNotFoundException;
import com.blog.api.post.dto.PostRequest;
import com.blog.api.post.dto.PostResponse;
import com.blog.api.post.dto.PostSummaryResponse;
import com.blog.api.user.Role;
import com.blog.api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PostService {

    private static final int MAX_PAGE_SIZE = 50;

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    /** readOnly = true lets Hibernate/the DB skip dirty-checking — cheaper. */
    @Transactional(readOnly = true)
    public Page<PostSummaryResponse> getPosts(int page, int size, String search, String author) {
        // Never trust client paging input: clamp the size.
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.clamp(size, 1, MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Post> posts;
        if (author != null && !author.isBlank()) {
            posts = postRepository.findByAuthorUsername(author, pageable);
        } else if (search != null && !search.isBlank()) {
            posts = postRepository.search(search.trim(), pageable);
        } else {
            posts = postRepository.findAll(pageable);
        }

        // Page.map keeps all the pagination metadata, converts only the content.
        return posts.map(post ->
                PostSummaryResponse.from(post, commentRepository.countByPostId(post.getId())));
    }

    @Transactional(readOnly = true)
    public PostResponse getBySlug(String slug) {
        Post post = findPostOrThrow(slug);
        return PostResponse.from(post, commentRepository.countByPostId(post.getId()));
    }

    @Transactional
    public PostResponse create(PostRequest request, User currentUser) {
        Post post = Post.builder()
                .title(request.title().trim())
                .slug(generateUniqueSlug(request.title()))
                .excerpt(request.excerpt())
                .content(request.content())
                .coverImageUrl(request.coverImageUrl())
                .author(currentUser)
                .build();
        postRepository.save(post);
        return PostResponse.from(post, 0);
    }

    @Transactional
    public PostResponse update(String slug, PostRequest request, User currentUser) {
        Post post = findPostOrThrow(slug);
        assertCanModify(post, currentUser);

        // The slug stays stable on update — changing it would break shared links.
        post.setTitle(request.title().trim());
        post.setExcerpt(request.excerpt());
        post.setContent(request.content());
        post.setCoverImageUrl(request.coverImageUrl());
        // No save() needed: inside a transaction Hibernate tracks the loaded
        // entity and flushes changes automatically ("dirty checking").

        return PostResponse.from(post, commentRepository.countByPostId(post.getId()));
    }

    @Transactional
    public void delete(String slug, User currentUser) {
        Post post = findPostOrThrow(slug);
        assertCanModify(post, currentUser);
        postRepository.delete(post); // comments go with it: ON DELETE CASCADE
    }

    private Post findPostOrThrow(String slug) {
        return postRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + slug));
    }

    /**
     * Authorization that depends on DATA (who owns this row?) belongs in the
     * service — URL-level rules in SecurityConfig can't express it.
     */
    private void assertCanModify(Post post, User user) {
        boolean isOwner = post.getAuthor().getId().equals(user.getId());
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("You can only modify your own posts");
        }
    }

    /**
     * "My First Post!" -> "my-first-post". If taken: "my-first-post-2", -3, ...
     */
    private String generateUniqueSlug(String title) {
        String base = Normalizer.normalize(title, Normalizer.Form.NFKD) // é -> e + accent
                .replaceAll("\\p{M}", "")                               // drop the accents
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")                        // drop other symbols
                .trim()
                .replaceAll("[\\s-]+", "-");                            // spaces -> single '-'

        if (base.isBlank()) {
            base = "post"; // e.g. a title written entirely in another script
        }
        if (base.length() > 80) {
            base = base.substring(0, 80).replaceAll("-+$", "");
        }

        String slug = base;
        int suffix = 2;
        while (postRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }
}
