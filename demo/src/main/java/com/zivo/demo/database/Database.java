// Database.java



package com.zivo.demo.database;

import java.util.*;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import com.zivo.demo.Models.Groups;
import com.zivo.demo.Models.User;
import com.zivo.demo.Models.FriendsOrFamily;


@Component
public class Database {

    private final String backEndCredits = "Julius Marc Cylien";
    private ArrayList<User> userData = new ArrayList<>();
    private ArrayList<Groups> groupData = new ArrayList<>();
    private ArrayList<String> tokens = new ArrayList<>();
    private List<FriendsOrFamily> friendsOrFamilyData = new ArrayList<>();
    private Map<User, LocalDate> oldData = new HashMap<>();

    public void addUser(User user){
        if (user == null){
            throw new IllegalArgumentException("User cannot be null");
        }
        if (this.userData.contains(user)){
            throw new IllegalArgumentException("User already exists in database");
        }

        this.userData.add(user);
    }

    public void addGroup(Groups group){
        if (group == null){
            throw new IllegalArgumentException("User cannot be null");
        }
        if (this.groupData.contains(group)){
            throw new IllegalArgumentException("User already exists in database");
        }

        this.groupData.add(group);
    }

    public void blackList(String token){

    }
    public void removeUser(User user){
        if (user == null){
            throw new IllegalArgumentException("User cannot be null");
        }

        if (!this.userData.contains(user)){
            throw new IllegalArgumentException("User not found in database");
        }

        this.userData.remove(user);
    }

    public void removeUserByUsername(String username){
        if (username.isBlank()){
            throw new IllegalArgumentException("Username cannot be blank");
        }

        User userToRemove = getUserByUsername(username);
        if (userToRemove == null){
            throw new IllegalArgumentException("User not found in database");
        }

        this.userData.remove(userToRemove);
    }

   

    public User getUserByUsername(String username){
        for (User user : this.userData){
            if (user.getUsername().equalsIgnoreCase(username)){
                return user;
            }
        }
        return null;
    }

    public User getOldUserByUsername(String username){
        for (Map.Entry<User, LocalDate> oldUserEntry : this.oldData.entrySet()){
            User user = oldUserEntry.getKey();

            if (user.getUsername().equalsIgnoreCase(username)){
                return user;
            }
        }
        return null;
    }

    public List<String> getTokens(){ return this.tokens; }

    public User getUserById(UUID id){
        for (User user : this.userData){
            if (user.getId().equals(id)){
                return user;
            }
        }
        return null;
    }

    public Groups getGroupById(UUID id){
        
        for (Groups group : this.groupData){
            if (group.getId().equals(id)){
                return group;
        }
    }
    return null;
}
    public List<User> getUsersWhoAreFollowingUser(UUID id){ 
        List<User> info = new ArrayList<>();

        for (FriendsOrFamily data : this.friendsOrFamilyData){
            if (data.getUserWhoIsBeingFollowed().getId().equals(id)){
                info.add(data.getUserWhoIsFollowing());
            }
        }
        return info;
     }

    public List<User> getUserFollowing(UUID id){ 
        List<User> info = new ArrayList<>();

        for (FriendsOrFamily data : this.friendsOrFamilyData){
            if (data.getUserWhoIsFollowing().getId().equals(id)){
                info.add(data.getUserWhoIsBeingFollowed());
            }
        }
        return info;
     }

    

    public void addMutuals(FriendsOrFamily pair){
        if (pair == null){ throw new IllegalArgumentException("Pairing cannot be null."); }

        User user1 = pair.getUserWhoIsBeingFollowed();

        User user2 = pair.getUserWhoIsFollowing();

        
        if (user1 == null || user2 == null){
            throw new IllegalArgumentException("A user returns null");
        }
        UUID user1Id = user1.getId();

        UUID user2Id = user2.getId();

        if (user1Id == null || user2Id == null){
            throw new IllegalArgumentException("A user ID returns null");
        }

        List<User> user1List = getUsersWhoAreFollowingUser(user1Id);

        List<User> user2List = getUsersWhoAreFollowingUser(user2Id);

        Set<User> user2Set = new HashSet<>(user2List);


        for (User user : user1List){
            if (user2Set.contains(user)){
                 pair.addMutual(user);
            }
        }
    }
    
    public List<FriendsOrFamily> getAllFriends(){ return this.friendsOrFamilyData; }

    public ArrayList<User> getAllUsers(){
        return this.userData;
    }

    public String getCredits() {return this.backEndCredits; }

    public ArrayList<Groups> getAllGroups(){
        return this.groupData;
    }

    public Map<User, LocalDate> getOldUsers(){
        return this.oldData;
    }
    
    public String allGroupNames(){
        StringBuilder info = new StringBuilder();
        for (Groups group : this.groupData){
            info.append("\t"+ group.getGroupName()).append("\n");
        }
        return info.toString();
    }

    public String allUserNames(){
        StringBuilder info = new StringBuilder();
        for (User user : this.userData){
            info.append("\t"+ user.getUsername()).append("\n");
        }
        return info.toString();
    }


     public String allGroupIds(){
        StringBuilder info = new StringBuilder();
        for (Groups group : this.groupData){
            info.append("\t"+ group.getId()).append("\n");
        }
        return info.toString();
    }

    public String allUserIds(){
        StringBuilder info = new StringBuilder();
        for (User user : this.userData){
            info.append("\t"+ user.getId()).append("\n");
        }
        return info.toString();
    }

    public String getDatabaseData(){
        StringBuilder info = new StringBuilder();

        info.append("Groups: \n\n").append(allGroupNames()).append("\n");
        info.append("Users: \n\n").append(allUserNames()).append("\n");
        info.append("Backend enginner: ").append(backEndCredits).append("\n");
        return info.toString();
    }

    public void deleteGroup(Groups group){
        if (group == null){
            throw new IllegalArgumentException("Group cannot be null");
        }
        if (!this.groupData.contains(group)){
            throw new IllegalArgumentException("Group not found in database");
        }
        this.groupData.remove(group);
    }

    public void deleteGroupById(UUID id){
        if (id == null){
            throw new IllegalArgumentException("Id cannot be null");
        }
        Groups groupToRemove = getGroupById(id);
        if (groupToRemove == null){
            throw new IllegalArgumentException("Group not found in database");
        }
        this.groupData.remove(groupToRemove);
    }






    
}
