// utils/JwtUtils.java
package com.zivo.demo.utils;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtils {

    // In production, load this from application.properties — never hardcode it
    private final String SECRET = "zivo-secret-key-change-this-in-production-min32chars";
    private final long EXPIRATION_MS = 86400000; // 24 hours

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    // Called on login — creates a token containing the user's ID
    public String generateToken(UUID userId) {
        return Jwts.builder()
            .setSubject(userId.toString())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
            .signWith(getSigningKey())
            .compact();
    }

    // Called on every protected request — returns the userId embedded in the token
    public UUID extractUserId(String token) {
        String subject = Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
        return UUID.fromString(subject);
    }

    public boolean isTokenValid(String token) {
        try {
            extractUserId(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    public void invalidateToken(String token) {
        // JWTs are stateless, so to "invalidate" a token, you'd typically add it to a blacklist in your database.
        // This method is a placeholder to show where that logic would go.
    }
}