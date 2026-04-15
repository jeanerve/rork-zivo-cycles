/*package com.zivo.demo.test;
import com.zivo.demo.Models.*;
import com.zivo.demo.utils.*;
import com.zivo.demo.database.*;


public class zivoTest {

    public static Utils utils = new Utils();

    public static Database database = new Database();
    public static void main(String args[]){

        User user1 = new User("test1", "password1", "test1@example.com");

        database.addUser(user1);

        User user2 = new User("test2", "password2", "test2@example.com");
        
        database.addUser(user2);

        // User user3 = new User("test3", "password3", "test3@example.com");

        Groups group1 = new Groups("group1", user1, 123L, "Test 1 group");
        
        database.addGroup(group1);

        debug("New group was created: " + group1.getGroupInfo());

        group1.addMember(user2);

        utils.debug("New member is added: " + group1.getLatestMemberToJoin().getUsername());

        debug("Database at the time being: " + database.getDatabaseData());
        


    } 

    public static void print(){ utils.print(); }

    public static void print(Object info){ utils.print("" + info); } 

    public static void debug(Object info){ utils.debug("" + info); }
}*/
