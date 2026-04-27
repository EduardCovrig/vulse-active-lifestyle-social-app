package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.dtos.post.PostAuthorDto;
import com.vulse.api.backend.dtos.post.PostResponse;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.PostType;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public PostResponse createPost(User user, MultipartFile file, MultipartFile frontFile, String caption, PostType type, Integer calories) throws IOException {
        // 1. Upload main media (Video/Image)
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "auto"));
        String mediaUrl = uploadResult.get("secure_url").toString();
        String frontMediaUrl = null;

        // 2. Upload front media if it's a BeReal style post
        if (type == PostType.DAILY && frontFile != null) {
            Map frontUploadResult = cloudinary.uploader().upload(frontFile.getBytes(), ObjectUtils.asMap("resource_type", "auto"));
            frontMediaUrl = frontUploadResult.get("secure_url").toString();
        }

        // 3. Build and save entity
        Post post = Post.builder()
                .user(user)
                .mediaUrl(mediaUrl)
                .frontMediaUrl(frontMediaUrl)
                .caption(caption)
                .type(type)
                .calories(calories)
                .build();

        Post savedPost = postRepository.save(post);
        return mapToResponse(savedPost);
    }

    public PostResponse updateCaption(UUID postId, String newCaption, User user) {
        Post post = getPostById(postId);

        // Security: Only the author can edit
        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You can only edit your own posts.");
        }

        post.setCaption(newCaption);
        Post updatedPost = postRepository.save(post);
        return mapToResponse(updatedPost);
    }

    public void deletePost(UUID postId, User user) {
        Post post = getPostById(postId);

        // Security: Only the author can delete
        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You can only delete your own posts.");
        }

        postRepository.delete(post);
    }

    public Page<PostResponse> getFeedByType(PostType type, Pageable pageable) {
        return postRepository.findAllByTypeOrderByCreatedAtDesc(type, pageable)
                .map(this::mapToResponse);
    }

    // --- Helper Methods ---
    private Post getPostById(UUID id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found."));
    }

    private PostResponse mapToResponse(Post post) {
        PostAuthorDto authorDto = PostAuthorDto.builder()
                .id(post.getUser().getId())
                .username(post.getUser().getUsername())
                .build();

        return PostResponse.builder()
                .id(post.getId())
                .mediaUrl(post.getMediaUrl())
                .frontMediaUrl(post.getFrontMediaUrl())
                .calories(post.getCalories())
                .caption(post.getCaption())
                .type(post.getType())
                .createdAt(post.getCreatedAt())
                .author(authorDto)
                .build();
    }
}
