package com.vulse.api.backend.services;

import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.SavedMeal;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.repositories.SavedMealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NutritionService {
    private final SavedMealRepository savedMealRepository;
    private final PostRepository postRepository;

    @Transactional
    public SavedMeal saveMealFromPost(User user, UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));

        if (post.getCalories() == null) {
            throw new IllegalStateException("This post does not have nutritional data.");
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

        return savedMealRepository.save(meal);
    }

    public List<SavedMeal> getDailyLog(User user, LocalDate date) {
        return savedMealRepository.findByUserIdAndConsumedDate(user.getId(), date);
    }
}