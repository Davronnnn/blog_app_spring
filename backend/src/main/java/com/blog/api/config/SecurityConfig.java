package com.blog.api.config;

import com.blog.api.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * The security rulebook. Reads top-to-bottom like a policy:
 *
 *  - no CSRF (we don't use cookies, so CSRF doesn't apply)
 *  - no sessions (STATELESS — the JWT *is* the session)
 *  - which URLs are public, everything else needs authentication
 *  - our JWT filter runs before Spring's username/password filter
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // enables @PreAuthorize etc. on methods if we need them
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsProperties corsProperties;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF protection matters for cookie-based auth; we send tokens
                // in the Authorization header, so a cross-site form can't use them.
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults()) // uses the CorsConfigurationSource bean below
                // Never create an HTTP session — every request must carry its JWT.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // public: register / login / refresh
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/refresh").permitAll()
                        // public: reading posts and comments (GET only!)
                        .requestMatchers(HttpMethod.GET, "/api/posts", "/api/posts/**").permitAll()
                        // CORS preflight must succeed before the browser sends the real request
                        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                        // everything else: must be authenticated
                        .anyRequest().authenticated())
                // What to send when an unauthenticated request hits a protected URL.
                // Default would be a redirect to a login page — useless for an API,
                // so we return 401 + JSON instead.
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, e) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                    response.getWriter().write(
                            "{\"status\":401,\"title\":\"Unauthorized\",\"detail\":\"Authentication required\"}");
                }))
                // Our filter must run before Spring's default auth filter.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS: the browser blocks JS on localhost:3000 from calling
     * localhost:8080 unless the server explicitly allows it. This bean is
     * that permission slip.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Patterns allow localhost:3000, 127.0.0.1:3000, etc. (they are different origins!)
        config.setAllowedOriginPatterns(corsProperties.allowedOriginPatterns());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Allow any request header the browser asks for in preflight (Authorization, Content-Type, etc.)
        config.setAllowedHeaders(List.of("*"));
        config.setMaxAge(3600L); // cache preflight for 1 hour — fewer OPTIONS round-trips

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
