// friendsOrfamily.java

package com.zivo.demo.Models;

import java.time.LocalDate;

import java.util.*;

public class FriendsOrFamily {

    private List<String> validFriendTypes = Arrays.asList("friends", "family","business");
    
    private String relationshipType;

    private final User thePersonBeingFollowed;

    private final User thePersonWhoIsFollowing;

    private final LocalDate dateAdded;

    private List<Groups> groupsInCommon;

    private List<User> mutuals;




    public FriendsOrFamily(User beingFollowed, User theStalker, String type){
        this.thePersonBeingFollowed = beingFollowed;
        this.thePersonWhoIsFollowing = theStalker;
        this.relationshipType = type;
        this.dateAdded = LocalDate.now();
        this.mutuals = new ArrayList<>();
        this.groupsInCommon = new ArrayList<>();
    }

/**
* @return the user who is being followed
*/
public User getUserWhoIsBeingFollowed() { return this.thePersonBeingFollowed; }

/**
 * @return formatted info about the user who is being followed
 */
public String getUserWhoIsBeingFollowedInfo() {
    if (thePersonBeingFollowed == null) {
        return "";
    }

    return String.format(
        "Username: %s%nPoints: %d%n",
        thePersonBeingFollowed.getUsername(),
        thePersonBeingFollowed.getPoints()
    );
}



/**
* @return the user who is following
*/
public User getUserWhoIsFollowing() { return this.thePersonWhoIsFollowing; }

/**
 * @return formatted info about the user who is following
 */
public String getUserWhoIsFollowingInfo() {
    if (thePersonWhoIsFollowing == null) {
        return "";
    }

    return String.format(
        "Username: %s%nPoints: %d%n",
        thePersonWhoIsFollowing.getUsername(),
        thePersonWhoIsFollowing.getPoints()
    );
}

    /**
     * @return the relationship type of this pairing (family, friends)
    */
    public String getRelationshipType(){ return this.relationshipType; }
    

    /**
     * 
     * @return The date this pairing was created
     */
    public LocalDate getDateAdded(){ return this.dateAdded; }

    /**
     * 
     * @param id - The id of the user being searched
     * @return The user that matches the id, returns null if no user is found
     */
    public User getUserFriendId(UUID id){

        if (thePersonBeingFollowed.getId().equals(id)){ return thePersonBeingFollowed; }
        else if (thePersonWhoIsFollowing.getId().equals(id)){ return thePersonWhoIsFollowing; }
        else{ return null;}
    }

    /**
     * 
     * @param user - Append user to mutual list
     */
    public void addMutual(User user){ 
        if (user == null){
            throw new IllegalArgumentException("User cannot be none");
        }
        if (this.mutuals.contains(user)){
            throw new IllegalArgumentException("User already noticed by the system as mutuals");
        }
        this.mutuals.add(user); 
    }

    /**
     * 
     * @param user - User to remove from mutual list, could be from a unfollow or system issued offense
     */
    public void removeMutual(User user){ 
        if (user == null){
            throw new IllegalArgumentException("User cannot be none");
        }
        if (!this.mutuals.contains(user)){
            throw new IllegalArgumentException("A user inside the friend class doesn't follow parameter user");
        }
        this.mutuals.remove(user); 
    }

    /**
     * 
     * @param group - The group to append to this friendship
     */
    public void addGroup(Groups group){
        if (group == null){
            throw new IllegalArgumentException("Group cannot be none");
        }
        if (this.groupsInCommon.contains(group)){
            throw new IllegalArgumentException("Group already noticed by the system as mutuals");
        }
        this.groupsInCommon.add(group); 
    }

    /**
     * 
     * @param group - The group to remove from this friendgroup
     */
    public void removeGroup(Groups group){ 
        if (group == null){
            throw new IllegalArgumentException("Group cannot be none");
        }
        if (!this.groupsInCommon.contains(group)){
            throw new IllegalArgumentException("Group isnt inside Friends dataset");
        }
        this.groupsInCommon.remove(group); 
    }

    /**
     * 
     * @param newType - The new relationship type to set for this pairing, must be either family or friends
     * @throws IllegalArgumentException if the new type is not valid
     */
    public void changeRelationshipType(String newType){

        newType = newType.toLowerCase().strip();

        if (!this.validFriendTypes.contains(newType)){
            throw new IllegalArgumentException("New type isnt valid");
        } 
        this.relationshipType = newType;
    }

    public List<User> getMutuals(){ return this.mutuals; }
    public List<Groups> getMutualGroups(){return this.groupsInCommon; }



}
