package com.nomasexcel.backend.controller;

import com.nomasexcel.backend.model.Expense;
import com.nomasexcel.backend.repository.expenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
public class expenseController {

	@Autowired
	private expenseRepository expenseRepo;

	@PostMapping
	public ResponseEntity<?> addExpense(@RequestBody Expense expense) {
		if (expense.getIdExpense() != null && expenseRepo.findByIdExpense(expense.getIdExpense()).isPresent()) {
			return ResponseEntity.badRequest().body("Ya existe un gasto con ese idExpense");
		}
		Expense saved = expenseRepo.save(expense);
		return ResponseEntity.ok(saved);
	}
}
