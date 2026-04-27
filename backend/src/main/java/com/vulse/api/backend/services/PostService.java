package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.PostType;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final Cloudinary cloudinary; //bean comes from security/CloudinaryConfig

    public Post createPost(User user, MultipartFile file, String caption, PostType type) throws IOException {
        // we send "resource_type" as "auto" to accept both iamges and videos
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), //uploads it to cloudinary
                ObjectUtils.asMap("resource_type", "auto"));

        String url = uploadResult.get("secure_url").toString();

        // saves the post in our database
        Post post = Post.builder()
                .user(user)
                .mediaUrl(url)
                .caption(caption)
                .type(type)
                .build();

        return postRepository.save(post);
    }

    public void deletePost(UUID postId, User user) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // SECURITY CHECK
        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to delete this post");
        }

        postRepository.delete(post);
    }

    public Post createDailyPost(User user, MultipartFile mainFile, MultipartFile frontFile, String caption) throws IOException {
        Map uploadMain = cloudinary.uploader().upload(mainFile.getBytes(), ObjectUtils.asMap("resource_type", "auto"));
        Map uploadFront = cloudinary.uploader().upload(frontFile.getBytes(), ObjectUtils.asMap("resource_type", "auto"));

        Post post = Post.builder()
                .user(user)
                .mediaUrl(uploadMain.get("secure_url").toString())
                .frontMediaUrl(uploadFront.get("secure_url").toString())
                .caption(caption)
                .type(PostType.DAILY)
                .build();

        return postRepository.save(post);
    }
}
