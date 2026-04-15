// User.java


package com.zivo.demo.Models;
import java.util.UUID;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.util.Scanner;
import java.util.Map;


public class User {


    private UserProfileType profileType;
    private final UUID id;
    private String username;
    private String password;
    private String email;
    private int userPoints;
    private final LocalDate dateJoined;
    private Long streak;
    
    private List<User> friends;
    private LocalDate streakStartDate;
    private LocalDate lastLoginDate;
    private String streakTitle;
    private String profilePictureUrl;
    private String bio;
    private String location;

    private final int groupLimit = 5;
    private List<Groups> joinedGroups; 
    private List<Map<BigDecimal, LocalDate>> imports;
    private List<String> pastNames;


    private Account account;


    public User(String username, 
                String encryptedPassword,
                String email,
                UserProfileType profileType){

    this.id = UUID.randomUUID();
    this.username = username;
    this.password = encryptedPassword;
    this.email = email;
    this.profileType = profileType;
    this.streakStartDate = LocalDate.now();
    this.lastLoginDate = LocalDate.now();
    this.streakTitle = "Newbie";
    this.profilePictureUrl = "https://example.com/default-profile-picture.jpg";
    this.streak = 0L;
    this.userPoints = 0;
    this.imports = new ArrayList<>();
    this.joinedGroups = new ArrayList<>();
    this.pastNames = new ArrayList<>();
    this.friends = new ArrayList<>();
    this.dateJoined = LocalDate.now();
    this.bio = String.format("Hi, I'm %s! Welcome to my profile.", username);
    }




    // GETTERS and SETTERS

    public String getUsername(){ return this.username; }
    public String getEmail(){ return this.email; }
    public int getGroupLimit(){ return this.groupLimit; }
    public UUID getId(){ return this.id; }
    public int getPoints(){ return this.userPoints; }
    public LocalDate getDateJoined(){ return this.dateJoined; }
    public Account getAccount(){ return this.account; }
    public Long getStreak(){ return this.streak; }
    public LocalDate getStreakStartDate(){ return this.streakStartDate; }
    public LocalDate getLastLoginDate(){ return this.lastLoginDate; }
    public String getStreakTitle(){ return this.streakTitle; }
    public String getProfilePictureUrl(){ return this.profilePictureUrl; }
    public String getBio(){ return this.bio; }
    public String getLocation(){ return this.location; }
    public UserProfileType getProfileType(){ return this.profileType; }
    public List<String> getPastUsernames(){ return this.pastNames; }
    public List<User> getFriends(){ return this.friends; }
    public List<Groups> getGroupsUserIsIncludedIn(){ return this.joinedGroups; }
    public List<Map<BigDecimal, LocalDate>> getImports(){ return this.imports; }

    public void increaseStreak(){ 
        this.streak+=1;
        if      (this.streak == 20L)   { this.streakTitle = "Consistent"; }
        else if (this.streak == 50L)   { this.streakTitle = "Dedicated"; }
        else if (this.streak == 100L)  { this.streakTitle = "Ancient"; }
        else if (this.streak == 500L)  { this.streakTitle = "Legendary"; }
        else if (this.streak == 1000L) { this.streakTitle = "Mythic"; }
    }
    public void resetStreak(){ 
        this.streak = 0L; 
        this.streakTitle = "newbie";
        this.streakStartDate = LocalDate.now(); }
    

    public void setUsername(String newUsername){
        if (newUsername.isBlank()){
            throw new IllegalArgumentException("Username cannot be blank");
        }

        if (newUsername.equalsIgnoreCase(this.username)){
            return;
        }
        String oldNameFormat = "("+this.username+") changed at "+LocalDate.now()+".";
        this.pastNames.add(oldNameFormat);
        this.username = newUsername;
    }

    public void setPassword(String newEncryptedPassword){
        if (newEncryptedPassword.isBlank()){
            throw new IllegalArgumentException("Password cannot be blank");
        }
        this.password = newEncryptedPassword;
    }

    public void addAccount(Account account){
        if (account == null){
            throw new IllegalArgumentException("Account cannot be null");
        }
        if (account.getTheOwner() != this){
            throw new IllegalArgumentException("Account owner does not match user");
        }
        this.account = account;
        boolean check = this.account.setOwnerById(this.id);
        if (!check){
            this.account = null;
            throw new IllegalStateException("Unexpected error occurred while setting account owner");
        }
    }

    public void removeAccount(){
        if (this.account == null){
            throw new IllegalStateException("User does not have an account to remove");
        }

        this.account.remove();
        this.account = null;
    }

    public void addGroup(Groups group){
        if (group == null){
            throw new IllegalArgumentException("Group cannot be null");
        }
        if (this.joinedGroups.contains(group)){
            throw new IllegalArgumentException("User is already a member of this group");
        }
        this.joinedGroups.add(group);
    }

    public void setProfileType(UserProfileType newType){
        if (newType == null){
            throw new IllegalArgumentException("Profile type cannot be null");
        }
        this.profileType = newType;
    }

    public void removeGroup(Groups group){
       
            if (group == null){
                throw new IllegalArgumentException("Group cannot be null");
            }
            if (!this.joinedGroups.contains(group)){
                throw new IllegalArgumentException("User is not a member of this group");
            }
            this.joinedGroups.remove(group);
   }


    public void addImport(BigDecimal amount, LocalDate date){
        if (amount == null || date == null){
            throw new IllegalArgumentException("Amount and date cannot be null");
        }
        Map<BigDecimal, LocalDate> importEntry = Map.of(amount, date);
        this.imports.add(importEntry);
    }

    public void removeImport(BigDecimal amount, LocalDate date){
        if (amount == null || date == null){
            throw new IllegalArgumentException("Amount and date cannot be null");
        }
        Map<BigDecimal, LocalDate> importEntry = Map.of(amount, date);
        if (!this.imports.contains(importEntry)){
            throw new IllegalArgumentException("Import entry not found");
        }
        this.imports.remove(importEntry);
    }

    public void removeImportByAmount(BigDecimal amount){
        if (amount == null){
            throw new IllegalArgumentException("Amount cannot be null");
        }
        boolean found = false;
        for (Map<BigDecimal, LocalDate> importEntry : this.imports){
            if (importEntry.containsKey(amount)){
                this.imports.remove(importEntry);
                found = true;
                break;
            }
        }
        if (!found){
            throw new IllegalArgumentException("Import entry with provided amount not found");
        }
    }

    public void addPoints(){ this.userPoints+=1; }
    public int addPoints(int pointsToAdd){ 
        if (pointsToAdd <= 0){
            throw new IllegalArgumentException("Points to add must be greater than zero");
        }
        this.userPoints+=pointsToAdd; 
        return this.userPoints;
    }
    public void removePoints(){ 
        if (this.userPoints <= 0){
            throw new IllegalStateException("User does not have any points to remove");
        }
        this.userPoints-=1; 
    }
    public void removePointsByAmount(int pointsToRemove){ 
        if (this.userPoints <= 0  || pointsToRemove <= 0 || pointsToRemove > this.userPoints){
            throw new IllegalStateException("User does not have any points to remove");
        }
        this.userPoints-=pointsToRemove; 
    }

    public void updatePassword(String newEncryptedPassword){
        setPassword(newEncryptedPassword);
    }

    public void clearUser(){
        Scanner scanner = new Scanner(System.in);

        System.out.print("Confirm clearing user data by typing the username: ");

        String confirmation = scanner.nextLine();
        scanner.close();
        if (!confirmation.equals(this.username)){
            System.out.println("Username does not match. Aborting clear operation.");
            return;
        }
        clearUserData();
    }

    private void clearUserData(){
        this.username = null;
        this.password = null;
        this.email = null;
        this.userPoints = 0;
        this.joinedGroups.clear();
        this.imports.clear();
        this.pastNames.clear();
    }

    public void clearImports(){
        this.imports.clear();
    }

    public void clearGroups(){
        this.joinedGroups.clear();
    }

    public void clearPastNames(){
        this.pastNames.clear();
    }

    public String getPasswordHash(){ return this.password; } 

    public int getGroupCount(){ return this.joinedGroups.size(); }

    public boolean canJoinMoreGroups(){ return this.joinedGroups.size() < this.groupLimit; }

    public boolean isInGroup(Groups group){
        if (group == null){
            throw new IllegalArgumentException("Group cannot be null");
        }
        return this.joinedGroups.contains(group);
    }

    public boolean areFriends(User user){
        if (user == null){
            throw new IllegalArgumentException("Group cannot be null");
        }
        return this.friends.contains(user);
    }

}

