package com.zivo.demo.database;

import com.zivo.demo.Models.*;
import java.util.*;

public class ProtectionLayer {
    
    private List<Map<User, String>> suspiciousUsers;
    private List<Map<User, Integer>> suspiciousUsersTimesTheyAppeared;
    private List<Groups> suspiciousGroups;
    private List<String> blacklistedTokens;
    private List<User> blacklisteUsers;

    public ProtectionLayer(){
        this.suspiciousUsers = new ArrayList<>();
        this.suspiciousUsersTimesTheyAppeared = new ArrayList<>();
        this.suspiciousGroups = new ArrayList<>();
        this.blacklistedTokens = new ArrayList<>();
    }

    public void addSuspiciousUser(User user, String reason){
        if (user == null){
            throw new IllegalArgumentException("User cannot be null");
        }
        if (reason == null || reason.isBlank()){
            throw new IllegalArgumentException("Reason cannot be null");
        }

        for (Map<User, String> map : this.suspiciousUsers){
            if (map.containsKey(user)){
                for (Map<User, Integer> map2 : this.suspiciousUsersTimesTheyAppeared){
                    if (map2.containsKey(user)){
                        int currentTimes = map2.get(user);
                        map2.put(user, currentTimes + 1);
                        return;
                    }
                }
                return;
            }
        }

        
        Map<User, String> mapOf = Map.of(user, reason);
        this.suspiciousUsers.add(mapOf);
        
    }
}
