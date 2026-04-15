// Utils.java


package com.zivo.demo.utils;
import java.util.List;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


public class Utils {

    public Utils() {}

    public int debug_counter = 1;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public String hash_password(String password){
        if (password.isBlank()){
            throw new IllegalArgumentException("Password cannot be blank");
        }
        String hashedPassword = passwordEncoder.encode(password);

        return hashedPassword;
    }

    public boolean verify_password(String password, String hashedPassword){
        if (password.isBlank() || hashedPassword.isBlank()){
            throw new IllegalArgumentException("Password and hashed password cannot be blank");
        }
        return passwordEncoder.matches(password, hashedPassword);
    }

    public void print(){
        print("\n");
    
    }
    public void print(String message){
        
        System.out.println(message + "\n");
    }

    public void debug(String message){
        System.out.println("[DEBUG " + this.debug_counter + "] " + message + "\n");
        this.debug_counter++;
    }

    public void reset_debug_counter(){
        this.debug_counter = 0;
    }

    public void new_section(String title){
        System.out.println("=========================");
        System.out.println("===== " + title + " =====");
        System.out.println("=========================");
        print();
        
    }


        public void nullException(List<Object> stuff){
        for (Object thing : stuff){
            if (thing == null){
                throw new IllegalArgumentException("Invalid input, check if item isnt null");
            }
        }
    }
}
