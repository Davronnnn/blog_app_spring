package com.blog.api.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Runs ONCE for every HTTP request (OncePerRequestFilter), BEFORE the request
 * reaches any controller. Its only job:
 *
 *   "Authorization: Bearer <token>" header present and valid?
 *   -> put the user into the SecurityContext (= "this request is authenticated").
 *
 * It never rejects a request itself. If the token is missing/invalid we just
 * continue unauthenticated, and the authorization rules in SecurityConfig
 * decide whether that's allowed for the requested URL (-> 401 if not).
 */
@Component
@RequiredArgsConstructor // Lombok: constructor with all final fields -> Spring injects them
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // 1. No Bearer header -> not our business, move on.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // strip "Bearer "

        try {
            // 2. Verify signature + expiry, and read the username out of it.
            String username = jwtService.extractUsername(token);

            // 3. Only authenticate if nobody has authenticated this request yet.
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails user = userDetailsService.loadUserByUsername(username);

                // Refresh tokens must NOT grant API access — access tokens only.
                if (jwtService.isValid(token, user) && jwtService.isAccessToken(token)) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    user,                  // principal (our User entity)
                                    null,                  // credentials — not needed anymore
                                    user.getAuthorities()  // roles
                            );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 4. THE key line: mark this request as authenticated.
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (JwtException | UsernameNotFoundException e) {
            // Bad/expired token -> proceed unauthenticated; SecurityConfig returns 401
            // for protected endpoints. We deliberately don't throw here.
        }

        filterChain.doFilter(request, response);
    }
}
