package com.nomasexcel.backend.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.nomasexcel.backend.model.User;
import com.nomasexcel.backend.service.userService;

@RestController
@RequestMapping("/api/users")
public class userController {

    @Autowired
    private userService userService;

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestParam String email, @RequestParam String password) {
        Optional<User> user = userService.login(email, password);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.status(401).build());
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        User newUser = userService.register(user);
        return ResponseEntity.ok(newUser);
    }
}
