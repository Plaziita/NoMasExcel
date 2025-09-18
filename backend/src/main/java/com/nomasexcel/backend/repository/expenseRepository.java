package com.nomasexcel.backend.repository;

import com.nomasexcel.backend.model.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface expenseRepository extends MongoRepository<Expense, String> {
	Optional<Expense> findByIdExpense(String idExpense);
}
