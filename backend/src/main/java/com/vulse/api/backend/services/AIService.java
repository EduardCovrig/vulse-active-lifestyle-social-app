package com.vulse.api.backend.services;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AIService {

    /**
     * This is where you would call OpenAI Vision or Gemini API.
     * We return a map with nutritional data based on the image URL.
     */
    public Map<String, Integer> analyzeFoodImage(String imageUrl) {
        // Placeholder for real AI Call Logic
        // In production: Use RestTemplate or WebClient to call OpenAI/Gemini
        Map<String, Integer> macros = new HashMap<>();
        macros.put("calories", 450);
        macros.put("protein", 30);
        macros.put("carbs", 40);
        macros.put("fat", 15);

        return macros;
    }
}