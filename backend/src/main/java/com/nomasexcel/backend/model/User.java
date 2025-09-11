package com.nomasexcel.backend.model;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String name;
    private String email;
    private String password;
    private String address;
    private Role rol;
    private List<String> expenseIds;

    public enum Role {
        ADMIN,
        EMPLOYEE
    }
}
