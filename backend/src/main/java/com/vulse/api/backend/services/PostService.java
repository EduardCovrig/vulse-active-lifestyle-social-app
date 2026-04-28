package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.dtos.post.PostAuthorDto;
import com.vulse.api.backend.dtos.post.PostResponse;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.PostType;
import com.vulse.api.backend.models.Reaction;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.CommentRepository;
import com.vulse.api.backend.repositories.LikeRepository;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.repositories.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final Cloudinary cloudinary;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final ReactionRepository reactionRepository;

    public PostResponse createPost(User user, MultipartFile file, MultipartFile frontFile, String caption, PostType type, Integer calories, Integer proteinGrams, Integer carbsGrams, Integer fatGrams) throws IOException {

        // Business Rule: Only 1 DAILY post allowed per day
        if (type == PostType.DAILY) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            boolean alreadyPostedToday = postRepository.existsByUserIdAndTypeAndCreatedAtAfter(user.getId(), PostType.DAILY, startOfDay);
            if (alreadyPostedToday) {
                throw new IllegalStateException("You have already posted your Daily Snap today!");
            }
        }

        // 1. Upload main media
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "auto"));
        String mediaUrl = uploadResult.get("secure_url").toString();
        String mediaPublicId = uploadResult.get("public_id").toString();

        String frontMediaUrl = null;
        String frontMediaPublicId = null;

        // 2. Upload front media for BeReal style
        if (type == PostType.DAILY && frontFile != null) {
            Map frontUploadResult = cloudinary.uploader().upload(frontFile.getBytes(), ObjectUtils.asMap("resource_type", "auto"));
            frontMediaUrl = frontUploadResult.get("secure_url").toString();
            frontMediaPublicId = frontUploadResult.get("public_id").toString();
        }

        // 3. Save to database
        Post post = Post.builder()
                .user(user)
                .mediaUrl(mediaUrl)
                .mediaPublicId(mediaPublicId)
                .frontMediaUrl(frontMediaUrl)
                .frontMediaPublicId(frontMediaPublicId)
                .caption(caption)
                .type(type)
                .calories(calories)
                .proteinGrams(proteinGrams)
                .carbsGrams(carbsGrams)
                .fatGrams(fatGrams)
                .build();

        Post savedPost = postRepository.save(post);
        return mapToResponse(savedPost, user);
    }

    public PostResponse updateCaption(UUID postId, String newCaption, User user) {
        Post post = getPostById(postId);

        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized: You can only edit your own posts.");
        }

        post.setCaption(newCaption);
        Post updatedPost = postRepository.save(post);
        return mapToResponse(updatedPost, user);
    }

    public void deletePost(UUID postId, User user) {
        Post post = getPostById(postId);

        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized: You can only delete your own posts.");
        }

        // Clean up Cloudinary safely
        try {
            if (post.getMediaPublicId() != null) {
                cloudinary.uploader().destroy(post.getMediaPublicId(), ObjectUtils.emptyMap());
            }
            if (post.getFrontMediaPublicId() != null) {
                cloudinary.uploader().destroy(post.getFrontMediaPublicId(), ObjectUtils.emptyMap());
            }
        } catch (IOException e) {
            System.err.println("Warning: Failed to delete media from Cloudinary for post " + postId);
        }

        postRepository.delete(post);
    }

    public Page<PostResponse> getFeedByType(User user, PostType type, Pageable pageable) {
        return postRepository.findAllByTypeOrderByCreatedAtDesc(type, pageable)
                .map(post -> mapToResponse(post, user));
    }

    public java.util.List<PostResponse> getMyPosts(User user) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(post -> mapToResponse(post, user))
                .toList();
    }

    private Post getPostById(UUID id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Post not found."));
    }

    private PostResponse mapToResponse(Post post, User currentUser) {
        PostAuthorDto authorDto = PostAuthorDto.builder()
                .id(post.getUser().getId())
                .username(post.getUser().getUsername())
                .build();

        boolean isLiked = likeRepository.existsByUserIdAndPostId(currentUser.getId(), post.getId());
        long likesCount = likeRepository.countByPostId(post.getId());

        // Tragem din baza de date numarul de comentarii
        long commentsCount = commentRepository.countByPostId(post.getId());

        java.util.List<String> reactions = reactionRepository.findTop3ByPostIdOrderByCreatedAtDesc(post.getId())
                .stream()
                .map(Reaction::getMediaUrl)
                .toList();

        return PostResponse.builder()
                .id(post.getId())
                .mediaUrl(post.getMediaUrl())
                .frontMediaUrl(post.getFrontMediaUrl())

                // --- Mapam MACRO-urile ---
                .calories(post.getCalories())
                .proteinGrams(post.getProteinGrams())
                .carbsGrams(post.getCarbsGrams())
                .fatGrams(post.getFatGrams())

                .caption(post.getCaption())
                .type(post.getType())
                .createdAt(post.getCreatedAt())
                .author(authorDto)
                .isLiked(isLiked)
                .likesCount(likesCount)
                .commentsCount(commentsCount)
                .recentReactions(reactions)
                .build();
    }
}