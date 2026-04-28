package com.vulse.api.backend.services;

import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.SavedMeal;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.repositories.SavedMealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NutritionService {
    private final SavedMealRepository savedMealRepository;
    private final PostRepository postRepository;

    public void saveMealFromPost(User user, UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));

        if (post.getCalories() == null) {
            throw new IllegalStateException("Post lacks nutritional data.");
        }

        SavedMeal meal = SavedMeal.builder()
                .user(user)
                .originalPost(post)
                .calories(post.getCalories())
                .proteinGrams(post.getProteinGrams())
                .carbsGrams(post.getCarbsGrams())
                .fatGrams(post.getFatGrams())
                .consumedDate(LocalDate.now())
                .build();

        savedMealRepository.save(meal);
    }

    public List<SavedMeal> getDailyLog(User user, LocalDate date) {
        return savedMealRepository.findByUserIdAndConsumedDate(user.getId(), date);
    }

    public void deleteMeal(User user, UUID mealId) {
        SavedMeal meal = savedMealRepository.findById(mealId)
                .orElseThrow(() -> new IllegalStateException("Meal not found"));

        if (!meal.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized: You can only delete your own meals");
        }
        savedMealRepository.delete(meal);
    }

    // Add manual meal without a post
    public void addManualMeal(User user, Integer calories, Integer protein, Integer carbs, Integer fat) {
        SavedMeal meal = SavedMeal.builder()
                .user(user)
                .calories(calories)
                .proteinGrams(protein != null ? protein : 0)
                .carbsGrams(carbs != null ? carbs : 0)
                .fatGrams(fat != null ? fat : 0)
                .consumedDate(LocalDate.now())
                .build();
        savedMealRepository.save(meal);
    }
}