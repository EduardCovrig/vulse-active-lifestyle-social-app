package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.SavedMeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SavedMealRepository extends JpaRepository<SavedMeal, UUID> {
    // all meals from a day
    List<SavedMeal> findByUserIdAndConsumedDate(UUID userId, LocalDate date);
}