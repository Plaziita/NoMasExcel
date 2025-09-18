package com.nomasexcel.backend.controller;

import com.nomasexcel.backend.model.User;
import com.nomasexcel.backend.repository.userRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class userController {

	@Autowired
	private userRepository userRepository;

	@GetMapping
    public List<User> getAllUsers(@RequestParam(value = "ids", required = false) List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return userRepository.findAll();
        } else {
            return userRepository.findAllById(ids);
        }
    }

	@GetMapping("/{id}")
	public ResponseEntity<User> getUserById(@PathVariable String id) {
		return userRepository.findById(id)
			.map(ResponseEntity::ok)
			.orElse(ResponseEntity.notFound().build());
	}

	@DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Usuario eliminado"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User request) {
        return userRepository.findById(id)
            .map(user -> {
                user.setName(request.getName());
                user.setEmail(request.getEmail());
                user.setRol(request.getRol());
                User updated = userRepository.save(user);
                return ResponseEntity.ok(updated);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
