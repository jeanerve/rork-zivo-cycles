package com.zivo.demo.Tokens;

public class Tokens {

    public enum TokenType {
        ACCESS,
        REFRESH
    }

    private String token;
    private long expiryTime;
    private TokenType type;

    public Tokens(String token, long expiryTime, TokenType type) {
        this.token = token;
        this.expiryTime = expiryTime;
        this.type = type;
    }

    public String getToken() { return token; }
    public long getExpiryTime() { return expiryTime; }
    public TokenType getType() { return type; }
}
