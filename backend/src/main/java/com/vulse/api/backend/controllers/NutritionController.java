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
import java.util.Map;
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
        LocalDate date = LocalDate.parse(dateString);
        return ResponseEntity.ok(nutritionService.getDailyLog(user, date));
    }

    @GetMapping("/friends/log")
    public ResponseEntity<List<Map<String, Object>>> getFriendsDailyLog(@AuthenticationPrincipal User user, @RequestParam("date") String dateString) {
        LocalDate date = LocalDate.parse(dateString);
        return ResponseEntity.ok(nutritionService.getFriendsDailyLog(user, date));
    }

    @DeleteMapping("/{mealId}")
    public ResponseEntity<Void> deleteMeal(@AuthenticationPrincipal User user, @PathVariable UUID mealId) {
        nutritionService.deleteMeal(user, mealId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/manual")
    public ResponseEntity<Void> addManualMeal(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> payload) {
        LocalDate date = payload.containsKey("date") ? LocalDate.parse((String) payload.get("date")) : LocalDate.now();
        nutritionService.addManualMeal(
                user,
                payload.get("calories") instanceof Number ? ((Number) payload.get("calories")).intValue() : null,
                payload.get("protein") instanceof Number ? ((Number) payload.get("protein")).intValue() : 0,
                payload.get("carbs") instanceof Number ? ((Number) payload.get("carbs")).intValue() : 0,
                payload.get("fat") instanceof Number ? ((Number) payload.get("fat")).intValue() : 0,
                date
        );
        return ResponseEntity.ok().build();
    }

    @PutMapping("/manual/{mealId}")
    public ResponseEntity<Void> updateManualMeal(@AuthenticationPrincipal User user, @PathVariable UUID mealId, @RequestBody Map<String, Object> payload) {
        nutritionService.updateManualMeal(
                user,
                mealId,
                payload.get("calories") instanceof Number ? ((Number) payload.get("calories")).intValue() : null,
                payload.get("protein") instanceof Number ? ((Number) payload.get("protein")).intValue() : 0,
                payload.get("carbs") instanceof Number ? ((Number) payload.get("carbs")).intValue() : 0,
                payload.get("fat") instanceof Number ? ((Number) payload.get("fat")).intValue() : 0
        );
        return ResponseEntity.ok().build();
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getNutritionHistory(@AuthenticationPrincipal User user, @RequestParam("days") int days) {
        return ResponseEntity.ok(nutritionService.getNutritionHistory(user, days));
    }
}