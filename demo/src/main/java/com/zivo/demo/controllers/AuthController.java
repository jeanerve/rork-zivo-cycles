package com.zivo.demo.controllers;

import java.util.Map;
import java.util.UUID;

import com.zivo.demo.utils.*;
import com.zivo.demo.Models.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.zivo.demo.dto.LoginRequest;
import com.zivo.demo.dto.SignupRequest;
import com.zivo.demo.services.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private JwtUtils jwtUtils;

    public AuthController(AuthService authService, JwtUtils jwtUtils) {
        this.authService = authService;
        this.jwtUtils = jwtUtils;
    }

     @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            String token = authService.login(request.getUsername(), request.getPassword());
            return ResponseEntity.ok(Map.of("token", token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            String token = authService.signup(
                request.getUsername(),
                request.getPassword(),
                request.getEmail(),
                UserProfileType.PERSONAL
            );
            return ResponseEntity.status(201).body(Map.of("token", token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtils.extractUserId(token);
        User user = authService.getUserById(userId);

        if (user == null) {
            return ResponseEntity.status(401).body("Invalid token");
        }
        
        this.jwtUtils.invalidateToken(authHeader.replace("Bearer ", ""));
        // With JWT, logout is handled client-side by discarding the token.
        // If you want server-side invalidation later, you'd maintain a token blacklist in the DB.
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}