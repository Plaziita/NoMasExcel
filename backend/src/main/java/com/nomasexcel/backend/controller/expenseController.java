package com.nomasexcel.backend.controller;

import com.nomasexcel.backend.model.Expense;
import com.nomasexcel.backend.model.User;
import com.nomasexcel.backend.repository.userRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import com.nomasexcel.backend.repository.expenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expenses")
public class expenseController {

	@Autowired
	private expenseRepository expenseRepo;

	@Autowired
	private userRepository userRepo;

	@PostMapping
	public ResponseEntity<?> addExpense(@RequestBody Expense expense) {
		if (expense.getIdExpense() != null && expenseRepo.findByIdExpense(expense.getIdExpense()).isPresent()) {
			return ResponseEntity.badRequest().body("Ya existe un gasto con ese idExpense");
		}
		// Ensure default status = pendiente when missing inside data map
		if (expense.getData() == null) expense.setData(new java.util.HashMap<>());
		if (!expense.getData().containsKey("status") || expense.getData().get("status") == null) {
			expense.getData().put("status", "pendiente");
		}
		// Ensure expense.data exists
		if (expense.getData() == null) expense.setData(new java.util.HashMap<>());
		// Attach owner userId from authenticated session when available
		try {
			Object principal = SecurityContextHolder.getContext().getAuthentication() != null
				? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
				: null;
			if (principal instanceof String) {
				java.util.Optional<User> uopt = userRepo.findByEmail((String) principal);
				if (uopt.isPresent()) expense.getData().put("userId", uopt.get().getId());
			}
		} catch (Exception ex) {
			// ignore - best effort
		}
		// Normalize any date field to date-only (YYYY-MM-DD)
		normalizeDateField(expense.getData());
		Expense saved = expenseRepo.save(expense);
		return ResponseEntity.ok(saved);
	}

	@GetMapping
	public ResponseEntity<?> listExpenses(@RequestParam(name = "status", required = false) String status) {
		java.util.List<Expense> all = expenseRepo.findAll();
		// determine authenticated user (if any)
		String principalEmail = null;
		try {
			Object principal = SecurityContextHolder.getContext().getAuthentication() != null
				? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
				: null;
			if (principal instanceof String) principalEmail = (String) principal;
		} catch (Exception ex) {
			// ignore
		}
		boolean isAdmin = false;
		String userId = null;
		if (principalEmail != null) {
			java.util.Optional<User> uopt = userRepo.findByEmail(principalEmail);
			if (uopt.isPresent()) {
				User u = uopt.get();
				isAdmin = u.getRol() != null && u.getRol().toString().equals("ADMIN");
				userId = u.getId();
			}
		}
		java.util.List<Expense> result = new java.util.ArrayList<>();
		for (Expense e : all) {
			Object s = e.getData() != null ? e.getData().get("status") : null;
			// apply status filter when provided
			if (status != null && !status.isEmpty()) {
				if (s == null || !status.equals(s.toString())) continue;
			}
			// attach userName to the data map when possible
			if (e.getData() == null) e.setData(new java.util.HashMap<>());
			Object owner = e.getData().get("userId");
			if (owner != null) {
				java.util.Optional<User> uopt2 = userRepo.findById(owner.toString());
				if (uopt2.isPresent()) {
					e.getData().put("userName", uopt2.get().getName());
				}
			}
			// if admin or no authenticated user, include everything that passed status
			if (isAdmin || userId == null) {
				result.add(e);
				continue;
			}
			// non-admin: only include if owner matches
			if (owner != null && userId.equals(owner.toString())) result.add(e);
		}
		return ResponseEntity.ok(result);
	}

	@PutMapping("/{id}")
	public ResponseEntity<?> updateExpense(@PathVariable String id, @RequestBody Expense payload) {
		java.util.Optional<Expense> opt = expenseRepo.findById(id);
		if (!opt.isPresent()) return ResponseEntity.notFound().build();
		Expense e = opt.get();
		// permission check: only owner or ADMIN can update
		try {
			Object principal = SecurityContextHolder.getContext().getAuthentication() != null
				? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
				: null;
			String principalEmail = principal instanceof String ? (String) principal : null;
			if (principalEmail != null) {
				java.util.Optional<User> uopt = userRepo.findByEmail(principalEmail);
				if (uopt.isPresent()) {
					User u = uopt.get();
					boolean isAdmin = u.getRol() != null && u.getRol().toString().equals("ADMIN");
					Object owner = e.getData() != null ? e.getData().get("userId") : null;
					if (!isAdmin && (owner == null || !u.getId().equals(owner.toString()))) {
						return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("error","No autorizado"));
					}
				}
			}
		} catch (Exception ex) {
			// ignore and allow (best-effort)
		}
		// Replace data map fields with provided payload.data entries
		if (payload.getData() != null) {
			// normalize date in incoming payload before merging
			normalizeDateField(payload.getData());
			java.util.Map<String, Object> data = e.getData() == null ? new java.util.HashMap<>() : e.getData();
			data.putAll(payload.getData());
			e.setData(data);
		}
		Expense saved = expenseRepo.save(e);
		return ResponseEntity.ok(saved);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteExpense(@PathVariable String id) {
		java.util.Optional<Expense> opt = expenseRepo.findById(id);
		if (!opt.isPresent()) return ResponseEntity.notFound().build();
		Expense e = opt.get();
		// permission check: only owner or ADMIN can delete
		try {
			Object principal = SecurityContextHolder.getContext().getAuthentication() != null
				? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
				: null;
			String principalEmail = principal instanceof String ? (String) principal : null;
			if (principalEmail != null) {
				java.util.Optional<User> uopt = userRepo.findByEmail(principalEmail);
				if (uopt.isPresent()) {
					User u = uopt.get();
					boolean isAdmin = u.getRol() != null && u.getRol().toString().equals("ADMIN");
					Object owner = e.getData() != null ? e.getData().get("userId") : null;
					if (!isAdmin && (owner == null || !u.getId().equals(owner.toString()))) {
						return ResponseEntity.status(HttpStatus.FORBIDDEN).body(java.util.Map.of("error","No autorizado"));
					}
				}
			}
		} catch (Exception ex) {
			// ignore and continue
		}
		expenseRepo.deleteById(id);
		return ResponseEntity.ok(java.util.Map.of("message", "Gasto eliminado"));
	}

	// convert known date fields in the data map to date-only strings (YYYY-MM-DD)
	private void normalizeDateField(java.util.Map<String, Object> data) {
		if (data == null) return;
		Object d = data.get("date");
		if (d == null) return;
		try {
			java.time.Instant inst = null;
			if (d instanceof java.util.Date) {
				inst = ((java.util.Date) d).toInstant();
			} else {
				String s = d.toString();
				// try parsing as ISO instant first
				try {
					inst = java.time.Instant.parse(s);
				} catch (Exception ex) {
					// if not ISO, check if it's already a local date like yyyy-MM-dd
					try {
						java.time.LocalDate ld = java.time.LocalDate.parse(s);
						data.put("date", ld.toString());
						return;
					} catch (Exception ex2) {
						// fallback: leave original string
						return;
					}
				}
			}
			if (inst != null) {
				java.time.ZonedDateTime zdt = java.time.ZonedDateTime.ofInstant(inst, java.time.ZoneOffset.UTC);
				java.time.LocalDate only = zdt.toLocalDate();
				data.put("date", only.toString());
			}
		} catch (Exception ex) {
			// ignore and leave original
		}
	}
}
