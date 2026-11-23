
package com.example.CalTrac.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets =
            new ConcurrentHashMap<>();

    private Bucket createBucket(int capacity, Duration duration) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, duration)
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }

    private Bucket resolveBucket(HttpServletRequest request) {
        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        int capacity = 100;
        Duration duration = Duration.ofMinutes(1);

        if (path.equals("/api/auth/login")) {
            capacity = 5;
            duration = Duration.ofMinutes(1);
        } else if (path.equals("/api/auth/register")) {
            capacity = 3;
            duration = Duration.ofMinutes(1);
        } else if (path.equals("/api/auth/reset-password")) {
            capacity = 3;
            duration = Duration.ofMinutes(1);
        } else if (path.startsWith("/api/meals")) {
            capacity = 60;
            duration = Duration.ofMinutes(1);
        }

        String key = clientIp + ":" + path;

        final int finalCapacity = capacity;
        final Duration finalDuration = duration;

        return buckets.computeIfAbsent(
                key,
                k -> createBucket(finalCapacity, finalDuration)
        );
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        Bucket bucket = resolveBucket(request);

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setContentType("application/json");
            response.setHeader("Retry-After", "60");

            response.getWriter().write(
                    "{\"error\":\"Too many requests. Please try again later.\"}"
            );
        }
    }
}
