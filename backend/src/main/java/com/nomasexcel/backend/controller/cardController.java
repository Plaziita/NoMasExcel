package com.nomasexcel.backend.controller;


import com.nomasexcel.backend.model.Card;
import com.nomasexcel.backend.model.User;
import com.nomasexcel.backend.repository.cardRepository;
import com.nomasexcel.backend.repository.userRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
public class cardController {
    @Autowired
    private cardRepository cardRepo;
    @Autowired
    private userRepository userRepo;


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCard(@PathVariable String id) {
        cardRepo.deleteById(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Tarjeta eliminada"));
    }

    @GetMapping
    public List<Card> getAllCards() {
        return cardRepo.findAll();
    }

    @PostMapping
    public ResponseEntity<?> addCard(@RequestBody CardRequest request) {
        // Normalizar número de tarjeta (eliminar espacios y guiones)
        String normalizedNumber = request.getCardNumber().replaceAll("[\\s-]", "");
        // Evitar duplicados por número de tarjeta
        if (cardRepo.findByCardNumber(normalizedNumber).isPresent()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "No se aceptan duplicados"));
        }
        Card card = new Card();
        card.setCardNumber(normalizedNumber);
        card.setCardType(request.getCardType());
        card.setCardHolder(request.getCardHolder());
        card.setSpendingLimit(0);
        if (request.getUserName() != null && !request.getUserName().isEmpty()) {
            User user = userRepo.findByName(request.getUserName());
            if (user != null) {
                card.setUserId(user.getId());
            }
        }
        Card saved = cardRepo.save(card);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCard(@PathVariable String id, @RequestBody CardRequest request) {
        java.util.Optional<Card> cardOpt = cardRepo.findById(id);
        if (!cardOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        // Normalizar número de tarjeta (eliminar espacios y guiones)
        String normalizedNumber = request.getCardNumber().replaceAll("[\\s-]", "");
        // Validar duplicado: si el número ya existe en otra tarjeta
        java.util.Optional<Card> existing = cardRepo.findByCardNumber(normalizedNumber);
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "No se aceptan duplicados"));
        }
        Card card = cardOpt.get();
        card.setCardNumber(normalizedNumber);
        card.setCardType(request.getCardType());
        card.setCardHolder(request.getCardHolder());
        if (request.getUserName() != null && !request.getUserName().isEmpty()) {
            User user = userRepo.findByName(request.getUserName());
            if (user != null) {
                card.setUserId(user.getId());
            } else {
                card.setUserId(null);
            }
        } else {
            card.setUserId(null);
        }
        Card saved = cardRepo.save(card);
        return ResponseEntity.ok(saved);
    }

    // DTO para recibir la petición
    public static class CardRequest {
        private String cardNumber;
        private String cardType;
        private String cardHolder;
        private String userName;
        // getters y setters
        public String getCardNumber() { return cardNumber; }
        public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }
        public String getCardType() { return cardType; }
        public void setCardType(String cardType) { this.cardType = cardType; }
        public String getCardHolder() { return cardHolder; }
        public void setCardHolder(String cardHolder) { this.cardHolder = cardHolder; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
    }
}
