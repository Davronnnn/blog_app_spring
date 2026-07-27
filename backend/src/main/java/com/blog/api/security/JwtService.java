package com.blog.api.security;

import com.blog.api.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Everything JWT: creating tokens and reading/verifying them.
 *
 * A JWT is three base64 parts: header.payload.signature
 *  - payload ("claims") holds the username (subject), issue/expiry dates, etc.
 *  - signature = HMAC-SHA of header+payload with our secret key.
 * Anyone can READ a JWT (it's just base64), but nobody can FORGE or ALTER
 * one without the secret key — that's what makes it trustworthy.
 *
 * We issue two tokens:
 *  - access token  (15 min): sent with every API request
 *  - refresh token (7 days): used only to obtain a new access token
 * Short-lived access tokens limit the damage if one leaks.
 */
@Service
public class JwtService {

    private static final String TOKEN_TYPE_CLAIM = "type";
    private static final String ACCESS = "access";
    private static final String REFRESH = "refresh";

    private final JwtProperties properties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        // Decode the base64 secret from application.yml into an HMAC key.
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(properties.secret()));
    }

    public String generateAccessToken(UserDetails user) {
        return buildToken(user, properties.accessTokenExpiration(), ACCESS);
    }

    public String generateRefreshToken(UserDetails user) {
        return buildToken(user, properties.refreshTokenExpiration(), REFRESH);
    }

    private String buildToken(UserDetails user, long expirationMs, String type) {
        Date now = new Date();
        return Jwts.builder()
                .subject(user.getUsername())                        // who the token is for
                .claim(TOKEN_TYPE_CLAIM, type)                      // access vs refresh
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(secretKey)                                // sign -> tamper-proof
                .compact();                                         // -> "xxx.yyy.zzz"
    }

    /** Throws JwtException if the token is expired, malformed or has a bad signature. */
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isAccessToken(String token) {
        return ACCESS.equals(parseClaims(token).get(TOKEN_TYPE_CLAIM, String.class));
    }

    public boolean isRefreshToken(String token) {
        try {
            return REFRESH.equals(parseClaims(token).get(TOKEN_TYPE_CLAIM, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isValid(String token, UserDetails user) {
        try {
            return user.getUsername().equals(extractUsername(token));
            // expiry is already checked inside parseClaims -> ExpiredJwtException
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Verifies the signature AND the expiry, then returns the payload. */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
