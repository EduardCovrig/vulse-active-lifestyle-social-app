package com.vulse.api.backend.controllers;

import com.vulse.api.backend.models.SavedMeal;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.services.NutritionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class NutritionController {
    private final NutritionService nutritionService;

    @PostMapping("/{postId}/save")
    public ResponseEntity<Void> saveMeal(@AuthenticationPrincipal User user, @PathVariable UUID postId) {
        nutritionService.saveMealFromPost(user, postId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/log")
    public ResponseEntity<List<SavedMeal>> getDailyLog(@AuthenticationPrincipal User user, @RequestParam("date") String dateString) {
        LocalDate date = LocalDate.parse(dateString); // Expected format: YYYY-MM-DD
        return ResponseEntity.ok(nutritionService.getDailyLog(user, date));
    }

    @DeleteMapping("/{mealId}")
    public ResponseEntity<Void> deleteMeal(@AuthenticationPrincipal User user, @PathVariable UUID mealId) {
        nutritionService.deleteMeal(user, mealId);
        return ResponseEntity.noContent().build();
    }
}