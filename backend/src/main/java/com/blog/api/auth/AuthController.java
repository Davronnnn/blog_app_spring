package com.blog.api.auth;

import com.blog.api.auth.dto.AuthResponse;
import com.blog.api.auth.dto.LoginRequest;
import com.blog.api.auth.dto.RefreshRequest;
import com.blog.api.auth.dto.RegisterRequest;
import com.blog.api.user.User;
import com.blog.api.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controllers stay thin: bind HTTP -> call service -> return DTO.
 * No business logic, no try/catch (GlobalExceptionHandler handles errors).
 *
 * @RestController = @Controller + @ResponseBody: return values are
 * serialized to JSON automatically.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * @Valid triggers the constraints declared on RegisterRequest.
     * @RequestBody deserializes the JSON body into the record.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED) // 201 for "resource created", not a generic 200
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    /**
     * @AuthenticationPrincipal injects the User our JwtAuthenticationFilter
     * put into the SecurityContext. This endpoint is NOT in the permitAll
     * list, so an anonymous request gets 401 before ever reaching here.
     */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User currentUser) {
        return UserResponse.from(currentUser);
    }
}
