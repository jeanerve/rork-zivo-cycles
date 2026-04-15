// GroupController.java
package com.zivo.demo.controllers;
import com.zivo.demo.utils.*;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.zivo.demo.Models.Groups;
import com.zivo.demo.dto.GroupRequests;
import com.zivo.demo.services.GroupService;

@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupService groupService;
    private JwtUtils jwtUtils;

    public GroupController(GroupService groupService, JwtUtils jwtUtils) {
        this.groupService = groupService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(
        @RequestBody GroupRequests request,
            @RequestParam boolean isPrivate,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            UUID founderId = jwtUtils.extractUserId(token);
            Groups group = groupService.createGroup(
                request.getName(),
                founderId,
                isPrivate,
                request.getDescription()
            );
            return ResponseEntity.status(201).body(group);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(@RequestParam UUID groupId,
            @RequestParam Long groupKey,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            UUID userId = jwtUtils.extractUserId(token);
            boolean joined = groupService.joinGroup(groupId, groupKey, userId);
            if (!joined) {
                return ResponseEntity.status(403).body("Could not join group");
            }
            return ResponseEntity.ok("Successfully joined group");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/leave")
    public ResponseEntity<?> leaveGroup(@RequestParam UUID groupId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            UUID userId = jwtUtils.extractUserId(token);

            boolean left = groupService.leaveGroup(groupId, userId);
            if (!left) {
                return ResponseEntity.status(404).body("Could not leave group");
            }
            return ResponseEntity.ok("Successfully left group");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteGroup(@RequestParam UUID groupId,
            @RequestParam UUID userId) {
        try {
            boolean abandoned = groupService.deleteGroup(groupId, userId);
            if (!abandoned) {
                return ResponseEntity.status(404).body("Could not abandon group");
            }
            return ResponseEntity.ok("Successfully abandoned group");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}