package com.vulse.api.backend.services;

import com.vulse.api.backend.dtos.auth.AuthResponse;
import com.vulse.api.backend.dtos.auth.LoginRequest;
import com.vulse.api.backend.dtos.auth.RegisterRequest;
import com.vulse.api.backend.models.Role;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.UserRepository;
import com.vulse.api.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        // base user
        var user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password())) // encrypt password
                .role(Role.USER)
                .build();

        repository.save(user); //save in database

        var jwtToken = jwtService.generateToken(user); //generates the token for 30days.
        return new AuthResponse(jwtToken, user.getUsername());
    }

    public AuthResponse login(LoginRequest request) {
        //checks if email & password are right
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        //if the code runs 'til here, we extract the user email as everything is alright.
        var user = repository.findByEmail(request.email())
                .orElseThrow();

        var jwtToken = jwtService.generateToken(user); //we generate the token
        return new AuthResponse(jwtToken, user.getUsername()); //return the dto
    }
}
