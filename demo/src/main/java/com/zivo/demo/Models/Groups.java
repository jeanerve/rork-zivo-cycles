// Groups.java


package com.zivo.demo.Models;
import java.time.LocalDate;
import java.util.*;


public class Groups {

    private final UUID id;


    private Goals goal;

    private String groupName;
    private List<User> members;
    private final User founder;
    private long totalGroupPoints;
    private String groupDescription;
    private User highestContribrutor;
    private String groupType;
    private final LocalDate dateCreated;
    private Long groupKey;
    private boolean hasGroupKey;
    private User latestMemberToJoin;

    public Groups(String groupName, 
                User founder,
                Long groupKey,
            String description){

        this.id = UUID.randomUUID();
        this.founder = founder;
        this.groupName = groupName;
        this.groupDescription = description;
        this.members = new ArrayList<>();
        this.totalGroupPoints = 0;
        this.dateCreated = LocalDate.now();
        this.latestMemberToJoin = null;
        this.goal = null;
        if (groupKey != null && groupKey >= 10000L && groupKey <= 99999L){
            this.groupKey = groupKey;
            this.hasGroupKey = true;
            this.groupType = "private";
        } else {
            this.groupKey = null;
            this.hasGroupKey = false;
            this.groupType = "public";
        }
        this.highestContribrutor = null;
    }

    public UUID getId(){ return this.id; }
    public String getGroupName(){ return this.groupName; }
    public List<User> getMembers(){ return this.members; }
    public long getTotalGroupPoints(){ return this.totalGroupPoints; }
    public LocalDate getDateCreated(){ return this.dateCreated; }
    public boolean getHasGroupKey(){ return this.hasGroupKey; }
    public String getGroupType(){ return this.groupType; }
    public String getGroupDescription(){ return this.groupDescription; }
    private Long getGroupKey(){ return this.groupKey; }
    public User getFounder(){ return this.founder; }
    public User getHighestContribrutor(){ return this.highestContribrutor; }
    public User getLatestMemberToJoin(){ return this.latestMemberToJoin; }
    


    public Long obtainGroupKey(){
        if (!this.hasGroupKey){
            System.out.println("This group does not have a group key, open for all users.");
            return null;
        }

        return this.getGroupKey();
    }

    public User findHighestContribrutor(){
        User highestPointUser = this.founder;
        for (User user : this.members){
            if (user.getPoints() > highestPointUser.getPoints()){
                highestPointUser = user;
            } else {
                continue;
            }
        }
        this.highestContribrutor = highestPointUser;
        return highestPointUser;
    }

    public boolean verifyGroupKey(Long providedKey){
        if (!this.hasGroupKey){
            throw new IllegalStateException("This group does not have a group key");
        }
        if (providedKey == null){
            throw new IllegalArgumentException("Provided key cannot be null");
        }
        return this.groupKey.equals(providedKey);
    }

    public void setGroupName(String newName){
        if (newName.isBlank()){
            throw new IllegalArgumentException("Group name cannot be blank");
        }
        this.groupName = newName;
    }

    public void addMember(User user){
        if (user == null){
            throw new IllegalArgumentException("User cannot be null");
        }
        if (this.members.contains(user)){
            throw new IllegalArgumentException("User is already a member of the group");
        }
        this.members.add(user);
        this.latestMemberToJoin = user;
    }

    public void removeMember(User user){
        if (user == null){
            throw new IllegalArgumentException("User cannot be null");
        }
        if (!this.members.contains(user)){
            throw new IllegalArgumentException("User is not a member of the group");
        }
        this.members.remove(user);
    }

    public void updateTotalGroupPoints(){
        long totalPoints = 0;
        for (User member : this.members){
            totalPoints += member.getPoints();
        }
        this.totalGroupPoints = totalPoints;
    }

    public void setGroupKey(Long newKey){
        if (newKey == null || newKey == 0){
            this.groupKey = null;
            this.hasGroupKey = false;
            return;
        } 
        
        else if (newKey < 10000L || newKey > 99999L){
            throw new IllegalArgumentException("Key has to be 5 digits long (10000-99999)");
        }
        
        this.groupKey = newKey;
        this.hasGroupKey = true;
        
    }

    public void removeGroupKey(){
        this.groupKey = null;
        this.hasGroupKey = false;
        this.groupType = "public";
    }

    public void abandonGroup(){
        for (User member : this.members){
            member.removeGroup(this);
        }
        this.members.clear();
    }

    public String getGroupInfo(){
        StringBuilder info = new StringBuilder();
        info.append("Group Name: ").append(this.groupName).append("\n");
        info.append("Founder: ").append(this.founder.getUsername()).append("\n");
        info.append("Total Points: ").append(this.totalGroupPoints).append("\n");
        info.append("Date Created: ").append(this.dateCreated).append("\n");
        info.append("Group Type: ").append(this.groupType).append("\n");
        info.append("Group Description: ").append(this.groupDescription).append("\n");
        info.append("Members: ");
        for (User member : this.members){
            info.append(member.getUsername()).append(", ");
        }
        return info.toString();
    }


    public void setGoal(Goals goal){
        if (goal == null){
            throw new IllegalArgumentException("Goal cannot be null");
        }

        if (this.goal != null){
            throw new IllegalArgumentException("Goal already set");
        }

        this.goal = goal;
    }

    public Goals getGoal(){
        return this.goal;
    }




}
