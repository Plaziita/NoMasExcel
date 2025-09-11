package com.nomasexcel.backend.model;

import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Document(collection = "expenses")
public class Expense {

    @Id
    private String idExpense;
    // Map to store dynamic Excel columns (column name -> value)
    private Map<String, Object> data;
}
