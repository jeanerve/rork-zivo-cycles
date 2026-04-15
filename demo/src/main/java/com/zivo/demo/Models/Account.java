// Account.java

package com.zivo.demo.Models;

import com.zivo.demo.database.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.math.BigDecimal;

public class Account {


    private final UUID id;
    private User owner;
    private Database database;
    private BigDecimal amount;
    public List<Map<BigDecimal, LocalDate>> transactionsOnzivo;

    public final LocalDate addedDate;

    public Account(User founder, Database database){
        this.database = database;
        this.owner = founder;
        this.amount = BigDecimal.ZERO;
        this.id = UUID.randomUUID();
        this.addedDate = LocalDate.now();
        this.transactionsOnzivo = new ArrayList<>();
    }


    public UUID getId(){ return this.id; }
    public User getTheOwner(){ return this.owner; }
    public LocalDate getDateWhenAdded(){ return this.addedDate; }
    public List<Map<BigDecimal, LocalDate>> getImports(){ return this.transactionsOnzivo; }
    public BigDecimal getAmount(){ return this.amount; }

    public boolean deposit(BigDecimal amount){
        if (amount.compareTo(BigDecimal.ZERO) <= 0){
            throw new IllegalArgumentException("Bad amount provided");
        }
        this.amount = this.amount.add(amount);

        return true;
    }

    public boolean withdrawal(BigDecimal amount){
        if (amount.compareTo(BigDecimal.ZERO) <= 0 ||
            amount.compareTo(this.amount) > 0){

            throw new IllegalArgumentException("Bad amount provided");
        }
        this.amount = this.amount.subtract(amount);

        return true;
    }

    public boolean setOwnerById(UUID id){
        if (id == null){
            return false;
        }

        User newOwner = database.getUserById(id);
        if (newOwner == null){
            System.out.println("User with provided id not found in database");
            return false;
        }
        this.owner = newOwner;
        return true;
    }

    public void remove(){
        this.owner = null;
        this.transactionsOnzivo = null;
        this.amount = null;
    }




}
