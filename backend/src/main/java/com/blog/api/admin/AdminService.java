package com.blog.api.admin;

import com.blog.api.admin.dto.AdminStatsResponse;
import com.blog.api.admin.dto.AdminUserResponse;
import com.blog.api.common.exception.ResourceNotFoundException;
import com.blog.api.post.PostRepository;
import com.blog.api.user.Role;
import com.blog.api.user.User;
import com.blog.api.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final com.blog.api.comment.CommentRepository commentRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
                userRepository.count(),
                postRepository.count(),
                commentRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(int page, int size, String search) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.clamp(size, 1, MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> users;
        if (search != null && !search.isBlank()) {
            users = userRepository.search(search.trim(), pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(user ->
                AdminUserResponse.from(user, postRepository.countByAuthorId(user.getId())));
    }

    @Transactional
    public AdminUserResponse updateRole(Long userId, Role role, User currentAdmin) {
        assertNotSelf(currentAdmin, userId, "Cannot change your own role");
        User user = findUserOrThrow(userId);
        user.setRole(role);
        return AdminUserResponse.from(user, postRepository.countByAuthorId(user.getId()));
    }

    @Transactional
    public void deleteUser(Long userId, User currentAdmin) {
        assertNotSelf(currentAdmin, userId, "Cannot delete your own account");
        userRepository.delete(findUserOrThrow(userId));
    }

    private User findUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private void assertNotSelf(User currentAdmin, Long targetId, String message) {
        if (currentAdmin.getId().equals(targetId)) {
            throw new AccessDeniedException(message);
        }
    }
}
