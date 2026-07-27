package com.blog.api.auth;

import com.blog.api.auth.dto.AuthResponse;
import com.blog.api.auth.dto.LoginRequest;
import com.blog.api.auth.dto.RefreshRequest;
import com.blog.api.auth.dto.RegisterRequest;
import com.blog.api.common.exception.DuplicateResourceException;
import com.blog.api.security.JwtService;
import com.blog.api.user.Role;
import com.blog.api.user.User;
import com.blog.api.user.UserRepository;
import com.blog.api.user.dto.UserResponse;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    /**
     * @Transactional: everything inside runs in ONE database transaction —
     * if anything throws, all DB changes roll back together.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check duplicates BEFORE hitting the DB unique constraints,
        // so we can return friendly 409 messages instead of a raw SQL error.
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password())) // hash, never store raw
                .displayName(request.displayName())
                .role(Role.USER)
                .build();
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        // Delegates to Spring Security: loads the user via our UserDetailsService
        // and compares passwords with BCrypt. Wrong credentials ->
        // BadCredentialsException -> 401 via GlobalExceptionHandler.
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        // The principal IS our User entity (User implements UserDetails).
        User user = (User) authentication.getPrincipal();
        return buildAuthResponse(user);
    }

    /**
     * Access token expired? The client sends its refresh token here and gets
     * a fresh pair — no re-login needed for 7 days.
     */
    public AuthResponse refresh(RefreshRequest request) {
        String token = request.refreshToken();
        try {
            if (!jwtService.isRefreshToken(token)) { // access tokens can't be used to refresh
                throw new BadCredentialsException("Invalid refresh token");
            }
            String username = jwtService.extractUsername(token);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
            return buildAuthResponse(user);
        } catch (JwtException e) { // expired / tampered / malformed
            throw new BadCredentialsException("Invalid refresh token");
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        return new AuthResponse(
                jwtService.generateAccessToken(user),
                jwtService.generateRefreshToken(user),
                UserResponse.from(user)
        );
    }
}
