// GroupService.java

package com.zivo.demo.services;


import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;

import com.zivo.demo.Models.Groups;
import com.zivo.demo.Models.User;
import com.zivo.demo.database.Database;


@Service
public class GroupService {
    private final Database database;


    public GroupService(Database database) {
        this.database = database;
    }

    public Groups createGroup(String name, UUID founderId, boolean privateOrPublic, String description) {
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Group name cannot be empty");
        }

        if (founderId == null) {
            throw new IllegalArgumentException("Founder cannot be null");
        }

        User founder = database.getUserById(founderId);
        if (founder == null) {
            throw new IllegalArgumentException("Founder not found");
        }

        Long key = null;
        if (privateOrPublic){
            key = autoGenerateGroupKey();
        }

        Groups group = new Groups(name, founder, key, description);

        database.addGroup(group);
        return group;
    }


    public boolean deleteGroup(UUID groupId, UUID founderId) {
        Groups group = database.getGroupById(groupId);
        if (group == null) {
            return false;
            //throw new IllegalArgumentException("Group not found");
        }

        if (!group.getFounder().getId().equals(founderId)) {
            return false;
            //throw new IllegalArgumentException("Only the founder can delete the group");
        }

        group.abandonGroup();
        return true;
    }
    
    public boolean joinGroup(UUID id, Long groupKey, UUID userId) {
        Groups group = database.getGroupById(id);
        if (group == null) {
            return false;
        }

        User user = database.getUserById(userId);

        if (user == null){
            throw new IllegalArgumentException("User cannot be found");
        }

        if (group.getMembers().contains(user)) {
            return false;
        }

        if(group.getHasGroupKey() && !group.verifyGroupKey(groupKey)) {
            return false;
        }

        group.addMember(user);
        user.addGroup(group);
        return true;
    }

    public boolean leaveGroup(UUID groupId, UUID userId) {
        Groups group = database.getGroupById(groupId);
        User user = database.getUserById(userId);

        if (group == null || user == null) {
            return false;
        }

        if (!group.getMembers().contains(user)) {
            return false;
        }

        group.removeMember(user);
        return true;
    }

    public Long autoGenerateGroupKey() {
        return ThreadLocalRandom.current().nextLong(10000, 100000);
    }
}
