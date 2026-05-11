package com.vulse.api.backend.services;

import com.vulse.api.backend.models.Follow;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.SavedMeal;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.FollowRepository;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.repositories.SavedMealRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NutritionService {
    private final SavedMealRepository savedMealRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;

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

    public void addManualMeal(User user, Integer calories, Integer protein, Integer carbs, Integer fat, LocalDate date) {
        SavedMeal meal = SavedMeal.builder()
                .user(user)
                .calories(calories)
                .proteinGrams(protein != null ? protein : 0)
                .carbsGrams(carbs != null ? carbs : 0)
                .fatGrams(fat != null ? fat : 0)
                .consumedDate(date != null ? date : LocalDate.now())
                .build();
        savedMealRepository.save(meal);
    }

    public void updateManualMeal(User user, UUID mealId, Integer calories, Integer protein, Integer carbs, Integer fat) {
        SavedMeal meal = savedMealRepository.findById(mealId)
                .orElseThrow(() -> new IllegalStateException("Meal not found"));

        if (!meal.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized");
        }

        meal.setCalories(calories);
        meal.setProteinGrams(protein != null ? protein : 0);
        meal.setCarbsGrams(carbs != null ? carbs : 0);
        meal.setFatGrams(fat != null ? fat : 0);
        savedMealRepository.save(meal);
    }

    //macros for friends
    public List<Map<String, Object>> getFriendsDailyLog(User currentUser, LocalDate date) {
        List<User> following = followRepository.findByFollowerId(currentUser.getId())
                .stream().map(Follow::getFollowing).toList();

        return following.stream().map(friend -> {
                    List<SavedMeal> meals = savedMealRepository.findByUserIdAndConsumedDate(friend.getId(), date);

                    int totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
                    for (SavedMeal meal : meals) {
                        totalCal += meal.getCalories() != null ? meal.getCalories() : 0;
                        totalPro += meal.getProteinGrams() != null ? meal.getProteinGrams() : 0;
                        totalCarb += meal.getCarbsGrams() != null ? meal.getCarbsGrams() : 0;
                        totalFat += meal.getFatGrams() != null ? meal.getFatGrams() : 0;
                    }

                    Map<String, Object> map = new HashMap<>();
                    map.put("id", friend.getId());
                    map.put("username", friend.getRealUsername());
                    map.put("profilePicUrl", friend.getProfilePicUrl());

                    map.put("cal", totalCal);
                    map.put("pro", totalPro);
                    map.put("carbs", totalCarb);
                    map.put("fat", totalFat);

                    map.put("calGoal", friend.getDailyCaloriesGoal() != null ? friend.getDailyCaloriesGoal() : 2000);
                    map.put("proGoal", friend.getProteinGoal() != null ? friend.getProteinGoal() : 150);
                    map.put("carbsGoal", friend.getCarbsGoal() != null ? friend.getCarbsGoal() : 250);
                    map.put("fatGoal", friend.getFatGoal() != null ? friend.getFatGoal() : 70);

                    return map;
                }).filter(data -> (Integer) data.get("cal") > 0) // only show those who added atleast 1 cal today
                .collect(Collectors.toList());
    }
}