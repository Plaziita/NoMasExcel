package com.nomasexcel.backend.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.nomasexcel.backend.model.User;

public interface userRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
}