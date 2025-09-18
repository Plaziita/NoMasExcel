package com.nomasexcel.backend.repository;

import com.nomasexcel.backend.model.Card;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface cardRepository extends MongoRepository<Card, String> {
	Optional<Card> findByCardNumber(String cardNumber);
}
