// Goals.java - I decided to make a separate class for goals to keep the code organized and maintainable. This class will handle all the logic related to setting and updating financial goals for groups, including enforcing limits on how many times a goal can be changed and validating the input for new goals.

package com.zivo.demo.Models;
import java.math.*;
import java.util.*;
import java.time.LocalDate;

/**
 * Represents a financial goal set by a group. Each goal has a target amount, a target date, and a description.
 * The goal can be associated with a specific group and can be updated with new target dates, but only a limited number of times.
 */
public class Goals {

    /*
        This sections enforces safty to avoid constant plan changing or fraud.
    */
    private final int dateChangesLimit = 3;
    private final int targetAmountChangesLimit = 3;
    private final int descriptionChangesLimit = 3;
    private int totalDateChanges = 0;
    private int totalTargetAmountChanges = 0;
    private int totalDescriptionChanges = 0;

    private final UUID id;
    private String name;
    private final UUID groupId;
    private String description;
    private BigDecimal targetAmount;
    private LocalDate targetDate;
    private LocalDate startDate;

    public Goals(String name, 
        String description, 
        BigDecimal targetAmount, 
        LocalDate targetDate,
        LocalDate startDate,
        UUID groupId) {

        this.id = UUID.randomUUID();
        this.name = name;
        this.description = description;
        this.targetAmount = targetAmount;
        this.targetDate = targetDate;
        this.startDate = startDate;
        this.groupId = groupId;
}


    public UUID getId() { return id; }
    public String getName() { return name; }
    public UUID getGroupId() { return groupId; }
    public String getDescription() { return description; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public LocalDate getTargetDate() { return targetDate; }
    public LocalDate getStartDate() { return startDate; }
    public int getDateChangesLimit() { return dateChangesLimit; }
    public int getTotalDateChanges() { return totalDateChanges; }
    
    public void setName(String name) { 
        if (name == null || name.isBlank()){
            throw new IllegalArgumentException("New Name cannot be null");
        }
        if (name.length() < 3){
            throw new IllegalArgumentException("Name is too short in length");
        }
        this.name = name; 
    }

    /**
     * Sets a new target amount for the goal. This method can only be called a limited number of times, as defined by targetAmountLimit.
     * It also validates the new target amount to ensure it is positive.
     * @param targetAmount - The new target amount for the goal. Must be a positive value.
     * @throws IllegalArgumentException if the target amount is invalid or if the target amount change limit has been reached.
     */
    public void setDescription(String description) { 
        if (description.isBlank() || description == null){
            throw new IllegalArgumentException("Description is required");
        }

        if (description.length() < 30){
            /* TODO: Add a system where an AI check if the decription is detailed enough
                might need python for this process
            */
            throw new IllegalArgumentException("For the safty of others, please provide a more detailed decription.");
        }

        if (this.totalDescriptionChanges >= this.descriptionChangesLimit){
            throw new IllegalArgumentException("max description changes met");
        }
        this.description = description;
        this.totalDescriptionChanges ++; 
    }


    /**
     * Sets a new target amount for the goal. This method can only be called a limited number of times, as defined by targetAmountLimit.
     * It also validates the new target amount to ensure it is positive.
     * @param targetAmount - The new target amount for the goal. Must be a positive value.
     * @throws IllegalArgumentException if the target amount is invalid or if the target amount change limit has been reached.
     */
    public void setTargetAmount(BigDecimal targetAmount) { 
        if (targetAmount == null || targetAmount.compareTo(BigDecimal.ZERO) <= 0){
            throw new IllegalArgumentException("Invalid target amount provided");
        }
        if (this.totalTargetAmountChanges >= this.targetAmountChangesLimit || this.totalTargetAmountChanges < 0){
            throw new IllegalStateException("Target amount change limit reached");
        }
        this.totalTargetAmountChanges++;
        this.targetAmount = targetAmount; 
    } 
    
    /**
     * Updates the target date and start date of the goal. This method can only be called a limited number of times, as defined by dateChangesLimit.
     * It also validates the new dates to ensure they are not in the past and that the start date is not after the target date.
     * @param newEndDate - The new target date for the goal. Must be in the future and after the new start date.
     * @param newStartDate - The new start date for the goal. Must be in the future and before the new target date.
     * @throws IllegalArgumentException if the new dates are invalid or if the date change limit has been reached.
     */
    public void changeEndAndStartDate(LocalDate newEndDate, LocalDate newStartDate){
         if (newEndDate == null || newEndDate.isBefore(LocalDate.now())){
            throw new IllegalArgumentException("Invalid end date provided");
        }
        if (newStartDate == null || newStartDate.isBefore(LocalDate.now())){
            throw new IllegalArgumentException("Invalid start date provided");
        }


        if (newStartDate.isAfter(newEndDate)){
             throw new IllegalArgumentException("End date cannot be before start date or start date cannot be after end date");
        }
        if (newEndDate.isBefore(newStartDate)){
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        if (this.totalDateChanges >= this.dateChangesLimit || this.totalDateChanges < 0){
            throw new IllegalStateException("Date change limit reached");
        }

        this.targetDate = newEndDate;
        this.startDate = newStartDate;
        this.totalDateChanges++;
    }
}

