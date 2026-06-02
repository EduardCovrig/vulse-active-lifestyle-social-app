package com.vulse.api.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>(); //counts requests for every ip addresss
    private long lastCleanupTime = System.currentTimeMillis();

    private Bucket createNewBucket() {
        // limit: 60 requests/minute/ip
        Bandwidth limit = Bandwidth.builder()
                .capacity(60) //max 60 requests/minute
                .refillGreedy(60, Duration.ofMinutes(1)) //receive one more token every second
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIp(HttpServletRequest request) { //universal method which will be used with any cloud hosting
        //to get the actual user ip.
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            if (ip.contains(",")) {
                ip = ip.split(",")[0].trim();
            }
            return ip;
        }
        ip = request.getHeader("Proxy-Client-IP");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        return request.getRemoteAddr();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        cleanupCacheIfNeeded();

        String ip = getClientIp(request);
        Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());

        if (bucket.tryConsume(1)) {
            // good, continue with the request
            filterChain.doFilter(request, response);
        } else {
            // limit exceeded. respond with 429 too many requests
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests\", \"message\": \"Please slow down.\"}");
        }
    }
    //auto clears cache every hour
    private void cleanupCacheIfNeeded() {
        long now = System.currentTimeMillis();
        if (now - lastCleanupTime > Duration.ofHours(1).toMillis()) {
            cache.clear();
            lastCleanupTime = now;
        }
    }
}
