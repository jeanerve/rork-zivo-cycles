package com.zivo.demo.Tokens;


import java.util.HashSet;
import java.util.Set;

public class TokenBlacklist {
    private Set<String> blacklistedTokens = new HashSet<>();

    public void add(String token) {
        blacklistedTokens.add(token);
    }

    public boolean isBlacklisted(String token) {
        return blacklistedTokens.contains(token);
    }
}