package com.blog.api.admin;

import com.blog.api.admin.dto.AdminStatsResponse;
import com.blog.api.admin.dto.AdminUserResponse;
import com.blog.api.admin.dto.UpdateRoleRequest;
import com.blog.api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.getStats();
    }

    @GetMapping("/users")
    public Page<AdminUserResponse> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        return adminService.getUsers(page, size, search);
    }

    @PatchMapping("/users/{id}/role")
    public AdminUserResponse updateRole(@PathVariable Long id,
                                        @Valid @RequestBody UpdateRoleRequest request,
                                        @AuthenticationPrincipal User currentAdmin) {
        return adminService.updateRole(id, request.role(), currentAdmin);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id,
                           @AuthenticationPrincipal User currentAdmin) {
        adminService.deleteUser(id, currentAdmin);
    }
}
