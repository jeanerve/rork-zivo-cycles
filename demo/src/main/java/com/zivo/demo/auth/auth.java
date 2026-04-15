/*/ auth.java - I believe this would be a route?

package com.zivo.demo.auth;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

class auth{
    


    public ResponseEntity<String> login(String username, String password) {
        // Implement login logic here
        if (username.isBlank() || password.isBlank()){
            throw new IllegalArgumentException("Username and password cannot be blank");
        }
        return "";

    }
}*/
