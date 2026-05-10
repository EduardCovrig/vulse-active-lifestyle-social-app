import React, { useState, useRef, useContext } from 'react';
import { View, Text, Image, Pressable, Animated, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons'; 
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import BouncyPressable from './BouncyPressable';
import PinchableImage from './PinchableImage';
import ReactionListModal from './ReactionListModal';

interface LiquidPostCardProps {
  post: any;
  cardHeight?: number; // Folosit pt global feed
  onOpenComments: (postId: string) => void;
  onPostDeleted: (postId: string) => void;
  onUserBlocked: (userId: string) => void;
  onEditCaption: (postId: string, currentCaption: string) => void;
  onOpenProfile?: (username: string) => void;
  onReactRequest?: (postId: string) => void;
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

const LiquidPostCard = React.memo(({ post, cardHeight, onOpenComments, onPostDeleted, onUserBlocked, onEditCaption, onOpenProfile, onReactRequest }: LiquidPostCardProps) => {
  const { username } = useContext(AuthContext);

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [recentReactions, setRecentReactions] = useState<string[]>(post.recentReactions || []);

  const cardScale = useRef(new Animated.Value(1)).current;
  const bigHeartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const [showReactions, setShowReactions] = useState(false);

  // --- LIKES ---
  const toggleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLiked(!isLiked);
    setLikesCount((prev: number) => isLiked ? prev - 1 : prev + 1);
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
    } else {
      Alert.alert("Camera unavailable", "Custom camera reaction is not implemented on this screen yet.");
    }
  };

  // --- OPTIONS MENU ---
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
    <View style={{ height: cardHeight, minHeight: 420 }} className="w-full relative mb-5">
      <Animated.View style={{ transform: [{ scale: cardScale }] }} className="flex-1 rounded-[28px] overflow-hidden bg-[#0c1018] border border-white/[0.06] relative">
        <Pressable onPress={handleDoubleTap} style={{ flex: 1, position: 'relative' }}>
          
          <PinchableImage uri={post.mediaUrl} className="w-full h-full object-cover" />
          <LinearGradient colors={['rgba(6,9,14,0.5)', 'transparent', 'rgba(6,9,14,0.8)']} locations={[0, 0.35, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" />

          {post.frontMediaUrl && (
            <View className="absolute top-16 right-4 w-24 h-32 rounded-2xl border-2 border-black/40 overflow-hidden shadow-lg z-10 bg-[#0c1018]">
               <Image source={{ uri: post.frontMediaUrl }} className="w-full h-full object-cover" />
            </View>
          )}

          <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20, transform: [{ scale: bigHeartScale }] }}>
            <BlurView intensity={40} tint="dark" className="w-32 h-32 rounded-full items-center justify-center border border-white/20 overflow-hidden">
               <Ionicons name="heart" size={70} color="#ff4b4b" />
            </BlurView>
          </Animated.View>

          {/* HEADER (AUTHOR INFO) */}
          <BouncyPressable onPress={() => onOpenProfile && onOpenProfile(post.author.username)} style={{ zIndex: 100, elevation: 100 }} className="absolute top-4 left-4 flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center overflow-hidden border border-white/15">
              {post.author?.profilePicUrl ? (
                <Image source={{ uri: post.author.profilePicUrl }} className="w-full h-full" />
              ) : (
                <Text className="text-white font-bold text-sm">{post.author?.username?.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View>
              <Text className="text-white text-sm font-bold tracking-tight">{post.author?.username}</Text>
              <Text className="text-white/50 text-[9px] font-semibold uppercase tracking-wider">{getRelativeTime(post.createdAt)}</Text>
            </View>
          </BouncyPressable>

          {/* OPTIONS BUTTON */}
          <TouchableOpacity onPress={handleOptions} style={{ zIndex: 100, elevation: 100 }} className="absolute top-4 right-4 w-9 h-9 bg-black/20 rounded-full items-center justify-center border border-white/[0.06]">
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* FOOTER (INTERACTIONS & CAPTION) */}
          <View className="absolute bottom-4 inset-x-4 z-20">
            {post.caption && post.type !== 'DAILY' && (
              <Text className="text-white/80 text-[13px] mb-3 leading-5">{post.caption}</Text>
            )}
            
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-4">
                {/* LIKE */}
                <TouchableOpacity onPress={toggleLike} className="flex-row items-center gap-1">
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#ff4b4b" : "rgba(255,255,255,0.8)"} />
                  <Text className={`font-semibold text-xs ${isLiked ? 'text-white' : 'text-white/60'}`}>{likesCount}</Text>
                </TouchableOpacity>

                {/* COMMENTS */}
                <TouchableOpacity onPress={() => onOpenComments(post.id)} className="flex-row items-center gap-1">
                  <Ionicons name="chatbubble-outline" size={20} color="rgba(255,255,255,0.8)" />
                  <Text className="text-white/60 font-semibold text-xs">{post.commentsCount || 0}</Text>
                </TouchableOpacity>

                {/* ADD REACTION */}
                <TouchableOpacity onPress={handleAddReaction} className="flex-row items-center justify-center w-7 h-7 rounded-full border border-dashed border-white/25 bg-white/[0.04]">
                  <Ionicons name="add" size={14} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center gap-2">
                {/* RECENT REACTIONS AVALANCHE */}
                {recentReactions.length > 0 && (
                  <TouchableOpacity onPress={() => setShowReactions(true)} className="flex-row-reverse">
                    {recentReactions.map((uri, index) => (
                      <View key={index} style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#0c1018', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', marginRight: index > 0 ? -8 : 0 }}>
                         <Image source={{ uri }} className="w-full h-full object-cover" />
                      </View>
                    ))}
                  </TouchableOpacity>
                )}

                {/* MACROS BADGE */}
                {post.calories && (
                  <View className="border border-[#7ad7c6]/30 rounded-full px-2.5 py-1 flex-row items-center gap-1 bg-[#7ad7c6]/[0.08]">
                    <Ionicons name="flame" size={10} color="#7ad7c6" />
                    <Text className="text-[#7ad7c6] font-bold text-[9px] uppercase tracking-wider">{post.calories} kcal</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
      <ReactionListModal visible={showReactions} onClose={() => setShowReactions(false)} postId={post.id} />
    </View>
  );
});

export default LiquidPostCard;