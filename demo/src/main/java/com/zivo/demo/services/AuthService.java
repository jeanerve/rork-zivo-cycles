package com.zivo.demo.services;

import org.springframework.security.crypto.password.*;
import org.springframework.stereotype.Service;
import java.util.*;
import com.zivo.demo.Models.*;
import com.zivo.demo.utils.*;
import com.zivo.demo.database.Database;

@Service
public class AuthService {

    private final Database database;
    private final PasswordEncoder passwordEncoder;
    private JwtUtils jwtUtils;

    public AuthService(Database database, 
        PasswordEncoder passwordEncoder, 
        JwtUtils jwtUtils) {
            
        this.database = database;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;

    }

    public String login(String username, String password) {
        
        if (username.isBlank() || password.isBlank()) {
            throw new IllegalArgumentException("Username and password are required");
        }

        User user = database.getUserByUsername(username);

        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        boolean matches = passwordEncoder.matches(password, user.getPasswordHash());
        if (!matches){
            throw new IllegalArgumentException("Username or password are incorrect.");
        }
        return this.jwtUtils.generateToken(user.getId());
    }

    public String signup(String username, 
                        String password, 
                        String email,
                        UserProfileType profileType) {

        if (username.isBlank() || password.isBlank() || email.isBlank()) {
            throw new IllegalArgumentException("All fields are required");
        }

        if (database.getUserByUsername(username) != null) {
            throw new IllegalArgumentException("Username already taken");
        }

        if (!email.isBlank() && !email.contains("@")) {
            throw new IllegalArgumentException("Invalid email format");
        }

        String hashedPassword = passwordEncoder.encode(password);
        User newUser = new User(username, hashedPassword, email, profileType);
        database.addUser(newUser);

        return this.jwtUtils.generateToken(newUser.getId());
    }

    public User getUserById(UUID userId) {
        return database.getUserById(userId);
    }

   
}