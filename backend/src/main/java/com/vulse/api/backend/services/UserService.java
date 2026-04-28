package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    @Transactional
    public void updateProfile(User user, String bio, MultipartFile profilePic) throws IOException {
        // Fetch the attached user from DB to ensure it's tracked by Hibernate
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (bio != null) {
            dbUser.setBio(bio);
        }

        if (profilePic != null && !profilePic.isEmpty()) {
            // Delete old profile picture from Cloudinary if it exists
            if (dbUser.getProfilePicPublicId() != null) {
                try {
                    cloudinary.uploader().destroy(dbUser.getProfilePicPublicId(), ObjectUtils.emptyMap());
                } catch (Exception e) {
                    System.err.println("Failed to delete old profile picture.");
                }
            }

            // Upload new picture
            Map uploadResult = cloudinary.uploader().upload(profilePic.getBytes(), ObjectUtils.asMap("resource_type", "image"));
            dbUser.setProfilePicUrl(uploadResult.get("secure_url").toString());
            dbUser.setProfilePicPublicId(uploadResult.get("public_id").toString());
        }

        userRepository.save(dbUser);
    }
}