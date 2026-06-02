import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, Image, Pressable, Animated, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons'; 
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import BouncyPressable from './BouncyPressable';
import { optimizedImageUrl, optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface LiquidPostCardProps {
  post: any;
  cardHeight?: number; 
  onOpenComments?: (postId: string) => void;
  onPostDeleted: (postId: string) => void;
  onUserBlocked: (userId: string) => void;
  onEditCaption: (postId: string, currentCaption: string) => void;
  onOpenProfile?: (username: string) => void;
  onReactRequest?: (postId: string) => void;
  onOpenReactions?: (postId: string) => void;
  onImageLongPress?: (uri?: string) => void; 
  onLikeToggled?: (postId: string, isLiked: boolean) => void;
  shouldPlay?: boolean;
}

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return 'Just now';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const LiquidPostCard = React.memo(({ post, cardHeight, onOpenComments, onPostDeleted, onUserBlocked, onEditCaption, onOpenProfile, onReactRequest, onOpenReactions, onImageLongPress, onLikeToggled, shouldPlay = false }: LiquidPostCardProps) => {
  const { username } = useContext(AuthContext);

  const [isLiked, setIsLiked] = useState<boolean>(post.isLiked || false);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [recentReactions, setRecentReactions] = useState<string[]>(post.recentReactions || []);

  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikesCount(post.likesCount || 0);
    setRecentReactions(post.recentReactions || []);
  }, [post.isLiked, post.likesCount, post.recentReactions]);

  const cardScale = useRef(new Animated.Value(1)).current;
  const bigHeartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const [showReactions, setShowReactions] = useState(false);

  const isFullScreenVideo = post.type === 'REEL' && cardHeight === Dimensions.get('window').height;

  const toggleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newLikedState = !isLiked;
    
    setIsLiked(newLikedState);
    setLikesCount((prev: number) => newLikedState ? prev + 1 : prev - 1);
    if (onLikeToggled) onLikeToggled(post.id, newLikedState);

    try { await api.post(`/interactions/${post.id}/like`); } 
    catch (error) { console.error("Like error:", error); }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (!isLiked) toggleLike();
      Animated.sequence([
        Animated.spring(bigHeartScale, { toValue: 1.2, useNativeDriver: true, bounciness: 20 }),
        Animated.delay(500),
        Animated.spring(bigHeartScale, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 0 })
      ]).start();
    }
    lastTapRef.current = now;
  };

  const handleAddReaction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onReactRequest) {
      onReactRequest(post.id);
    }
  };

  const handleOptions = () => {
    const isMyPost = post.author.username === username;
    const options: any[] = [{ text: "Cancel", style: "cancel" }];

    if (isMyPost) {
      options.push({ text: "Edit Caption", onPress: () => onEditCaption(post.id, post.caption || '') });
      options.push({ text: "Delete Post", style: "destructive", onPress: () => {
          Alert.alert("Are you sure?", "This will permanently delete the post.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                try {
                  await api.delete(`/posts/${post.id}`);
                  onPostDeleted(post.id);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) { Alert.alert("Error", "Failed to delete post."); }
              }
            }
          ]);
      }});
    } else {
      options.push({ text: "Report Post", style: "destructive", onPress: async () => {
          await api.post(`/safety/report/post/${post.id}`, { reason: "Inappropriate" });
          Alert.alert("Reported", "An admin will review this post.");
      }});
      options.push({ text: `Block ${post.author.username}`, style: "destructive", onPress: () => {
          Alert.alert("Block User", `Are you sure you want to block ${post.author.username}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Block", style: "destructive", onPress: async () => {
                try {
                  await api.post(`/safety/block/${post.author.id}`);
                  onUserBlocked(post.author.id);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch(e) { Alert.alert("Error", "Failed to block user."); }
            }}
          ]);
      }});
    }

    if (post.calories) {
      options.push({ text: "Save Meal to Diet Log", onPress: async () => {
          await api.post(`/nutrition/${post.id}/save`);
          Alert.alert("Saved", "Meal has been saved to your nutrition log.");
      }});
    }

    Alert.alert("Options", "What would you like to do?", options);
  };

  return (
    <View style={{ height: cardHeight, minHeight: 400, width: isFullScreenVideo ? '100%' : 'auto' }} className={`relative ${isFullScreenVideo ? '' : 'mb-5 w-full'}`}>
      <Animated.View style={{ transform: [{ scale: cardScale }] }} className={`flex-1 overflow-hidden relative ${isFullScreenVideo ? 'bg-black rounded-none border-0' : 'rounded-[32px] bg-black/40 border-[0.5px] border-white/10 shadow-2xl'}`}>
        <Pressable 
          onPress={handleDoubleTap} 
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            if (onImageLongPress) onImageLongPress();
          }}
          delayLongPress={350}
          style={{ flex: 1, position: 'relative' }}
        >
          {post.mediaUrl && (post.mediaUrl.toLowerCase().endsWith('.mp4') || post.mediaUrl.toLowerCase().endsWith('.mov')) ? (
            <Video source={{ uri: post.mediaUrl }} style={{ width: '100%', height: '100%' }} resizeMode={ResizeMode.COVER} shouldPlay={shouldPlay} isLooping isMuted={!shouldPlay} />
          ) : (
            <Image source={{ uri: optimizedImageUrl(post.mediaUrl) }} className="w-full h-full object-cover" />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.85)']} locations={[0, 0.4, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" />

          {post.frontMediaUrl && (
            <View className={`absolute right-4 w-24 h-32 rounded-2xl border-[1.5px] border-white/20 overflow-hidden shadow-2xl z-10 bg-black/40 ${isFullScreenVideo ? 'top-24' : 'top-16'}`}>
               {post.frontMediaUrl.toLowerCase().endsWith('.mp4') || post.frontMediaUrl.toLowerCase().endsWith('.mov') ? (
                 <Video source={{ uri: post.frontMediaUrl }} style={{ width: '100%', height: '100%' }} resizeMode={ResizeMode.COVER} shouldPlay={shouldPlay} isLooping isMuted={true} />
               ) : (
                 <Image source={{ uri: optimizedThumbUrl(post.frontMediaUrl) }} className="w-full h-full object-cover" />
               )}
            </View>
          )}

          <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20, transform: [{ scale: bigHeartScale }] }}>
            <BlurView intensity={20} tint="light" style={{ width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
               <Ionicons name="heart" size={50} color="#ff4b4b" />
            </BlurView>
          </Animated.View>

          {/* DACA NU E VIDEO FULL SCREEN, APARE SUS */}
          {!isFullScreenVideo && (
            <BouncyPressable onPress={() => onOpenProfile && onOpenProfile(post.author.username)} style={{ zIndex: 100, elevation: 100 }} className="absolute top-5 left-5 flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center overflow-hidden border-[0.5px] border-white/20">
                {post.author?.profilePicUrl ? (
                  <Image source={{ uri: optimizedThumbUrl(post.author.profilePicUrl, 100) }} className="w-full h-full" />
                ) : (
                  <Text className="text-white font-semibold text-xs">{post.author?.username?.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View>
                <Text className="text-white text-sm font-bold tracking-tight shadow-sm">{post.author?.username}</Text>
                <Text className="text-white/60 text-[9px] font-bold uppercase tracking-widest">{getRelativeTime(post.createdAt)}</Text>
              </View>
            </BouncyPressable>
          )}

          <TouchableOpacity onPress={handleOptions} style={{ zIndex: 100, elevation: 100 }} className={`absolute right-5 w-8 h-8 bg-black/20 rounded-full items-center justify-center border-[0.5px] border-white/10 ${isFullScreenVideo ? 'top-16' : 'top-5'}`}>
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* DACA E VIDEO FULL SCREEN: RIGHT SIDE OVERLAY COLUMN (LIKE & COMMENT) */}
          {isFullScreenVideo && (
            <View style={{ position: 'absolute', right: 16, bottom: 200, alignItems: 'center', gap: 20, zIndex: 100 }}>
              {/* Like Button */}
              <TouchableOpacity onPress={toggleLike} style={{ alignItems: 'center' }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ff4b4b" : "white"} />
                </View>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13, marginTop: 4, textShadowColor: 'black', textShadowRadius: 3 }}>{likesCount}</Text>
              </TouchableOpacity>

              {/* Comment Button */}
              <TouchableOpacity onPress={() => onOpenComments && onOpenComments(post.id)} style={{ alignItems: 'center' }}>
                <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Ionicons name="chatbubble-outline" size={24} color="white" />
                </View>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13, marginTop: 4, textShadowColor: 'black', textShadowRadius: 3 }}>{post.commentsCount || 0}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* DACA E VIDEO FULL SCREEN: BOTTOM-LEFT CONTENT OVERLAY (USERNAME, TIME, CAPTION) */}
          {isFullScreenVideo && (
            <View style={{ position: 'absolute', left: 20, bottom: 120, right: 80, zIndex: 100 }}>
              <BouncyPressable onPress={() => onOpenProfile && onOpenProfile(post.author.username)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, textShadowColor: 'black', textShadowRadius: 3 }}>
                  @{post.author?.username}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' }}>
                  {getRelativeTime(post.createdAt)}
                </Text>
              </BouncyPressable>
              
              {post.caption && (
                <Text numberOfLines={3} style={{ color: 'white', fontSize: 14, fontWeight: '500', lineHeight: 20, textShadowColor: 'black', textShadowRadius: 3 }}>
                  {post.caption}
                </Text>
              )}
            </View>
          )}

          {/* STANDARD BOTTOM SECTION (DACA NU E FULL SCREEN VIDEO) */}
          {!isFullScreenVideo && (
            <View className="absolute inset-x-5 z-20" style={{ bottom: 20 }}>
              {post.caption && post.type !== 'DAILY' && (
                <Text className="text-white/95 text-[14px] mb-4 leading-5 font-medium shadow-md">{post.caption}</Text>
              )}
              
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-5">
                  <TouchableOpacity onPress={toggleLike} className="flex-row items-center gap-1.5">
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ff4b4b" : "rgba(255,255,255,0.95)"} />
                    <Text className={`font-bold text-[14px] ${isLiked ? 'text-white' : 'text-white/80'}`}>{likesCount}</Text>
                  </TouchableOpacity>

                  {post.type !== 'DAILY' && (
                    <TouchableOpacity onPress={() => onOpenComments && onOpenComments(post.id)} className="flex-row items-center gap-1.5">
                      <Ionicons name="chatbubble-outline" size={24} color="rgba(255,255,255,0.95)" />
                      <Text className="text-white/90 font-bold text-[14px]">{post.commentsCount || 0}</Text>
                    </TouchableOpacity>
                  )}

                  {post.type !== 'REEL' && (
                    <TouchableOpacity onPress={handleAddReaction} className="w-9 h-9 rounded-full border-[0.5px] border-white/30 bg-white/15 items-center justify-center">
                      <Ionicons name="camera-outline" size={18} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row items-center gap-2.5">
                  {recentReactions.length > 0 && post.type !== 'REEL' && (
                    <TouchableOpacity onPress={() => onOpenReactions && onOpenReactions(post.id)} className="flex-row-reverse">
                      {recentReactions.slice(0, 3).map((uri: string, index: number) => (
                        <View key={index} style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', marginRight: index > 0 ? -12 : 0 }}>
                           <Image source={{ uri: optimizedThumbUrl(uri, 100) }} className="w-full h-full object-cover" />
                        </View>
                      ))}
                    </TouchableOpacity>
                  )}

                  {post.calories && (
                    <View className="border-[0.5px] border-[#7ad7c6]/50 rounded-full px-3 py-1.5 flex-row items-center gap-1.5 bg-[#7ad7c6]/20">
                      <Ionicons name="flame" size={12} color="#7ad7c6" />
                      <Text className="text-[#7ad7c6] font-black text-[11px] uppercase tracking-wider">{post.calories}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
});

export default LiquidPostCard;