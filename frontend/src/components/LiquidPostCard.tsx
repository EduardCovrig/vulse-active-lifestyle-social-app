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

interface LiquidPostCardProps {
  post: any;
  cardHeight?: number; // Folosit pt global feed
  onOpenComments: (postId: string) => void;
  onPostDeleted: (postId: string) => void;
  onUserBlocked: (userId: string) => void;
  onEditCaption: (postId: string, currentCaption: string) => void;
  onOpenProfile?: (username: string) => void;
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

const LiquidPostCard = React.memo(({ post, cardHeight, onOpenComments, onPostDeleted, onUserBlocked, onEditCaption, onOpenProfile }: LiquidPostCardProps) => {
  const { username } = useContext(AuthContext);

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [recentReactions, setRecentReactions] = useState<string[]>(post.recentReactions || []);

  const cardScale = useRef(new Animated.Value(1)).current;
  const bigHeartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);

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

  const handleAddReaction = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'reaction.jpg';
        const type = `image/${filename.split('.').pop()}`;

        formData.append('file', { uri, name: filename, type } as any);

        // Pre-update UI for speed
        setRecentReactions(prev => [uri, ...prev].slice(0, 3)); 

        await api.post(`/interactions/${post.id}/react`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        Alert.alert("Error", "Could not add reaction.");
      }
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
    <View style={{ height: cardHeight, minHeight: 450 }} className="w-full relative mb-6 shadow-2xl shadow-black/80">
      <Animated.View style={{ transform: [{ scale: cardScale }] }} className="flex-1 rounded-[32px] overflow-hidden bg-[#06090E] border border-white/5 relative">
        <Pressable onPress={handleDoubleTap} style={{ flex: 1, position: 'relative' }}>
          
          <Image source={{ uri: post.mediaUrl }} className="absolute inset-0 w-full h-full object-cover" />
          <LinearGradient colors={['rgba(6,9,14,0.7)', 'transparent', 'rgba(6,9,14,0.9)']} locations={[0, 0.3, 1]} className="absolute inset-0 pointer-events-none" />

          {post.frontMediaUrl && (
            <View className="absolute top-20 right-4 w-28 h-40 rounded-2xl border-[3px] border-[#090E17] overflow-hidden shadow-2xl z-10 bg-[#06090E]">
               <Image source={{ uri: post.frontMediaUrl }} className="w-full h-full object-cover" />
            </View>
          )}

          <Animated.View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20, transform: [{ scale: bigHeartScale }] }}>
            <BlurView intensity={40} tint="dark" className="w-32 h-32 rounded-full items-center justify-center border border-white/20 overflow-hidden">
               <Ionicons name="heart" size={70} color="#ff4b4b" />
            </BlurView>
          </Animated.View>

          {/* HEADER (AUTHOR INFO) CU BUTON */}
          <BouncyPressable onPress={() => onOpenProfile && onOpenProfile(post.author.username)} className="absolute top-5 left-4 z-10 flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center overflow-hidden border border-white/20">
              {post.author?.profilePicUrl ? (
                <Image source={{ uri: post.author.profilePicUrl }} className="w-full h-full" />
              ) : (
                <Text className="text-white font-extrabold text-lg">{post.author?.username?.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View>
              <Text className="text-white text-base font-black tracking-tight shadow-md">{post.author?.username}</Text>
              <Text className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{getRelativeTime(post.createdAt)} • {post.type}</Text>
            </View>
          </BouncyPressable>

          {/* OPTIONS BUTTON */}
          <TouchableOpacity onPress={handleOptions} className="absolute top-6 right-4 z-10 w-10 h-10 bg-black/30 rounded-full items-center justify-center border border-white/10 backdrop-blur-md">
            <Ionicons name="ellipsis-horizontal" size={20} color="white" />
          </TouchableOpacity>

          {/* FOOTER (INTERACTIONS & CAPTION) */}
          <View className="absolute bottom-5 inset-x-5 z-10">
            {post.caption && (
              <Text className="text-white/90 font-body-md text-sm mb-4 leading-6 shadow-md">{post.caption}</Text>
            )}
            
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-5">
                {/* LIKE */}
                <TouchableOpacity onPress={toggleLike} className="flex-row items-center gap-1.5">
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={28} color={isLiked ? "#ff4b4b" : "white"} />
                  <Text className={`font-bold text-sm ${isLiked ? 'text-white' : 'text-white/70'}`}>{likesCount}</Text>
                </TouchableOpacity>

                {/* COMMENTS */}
                <TouchableOpacity onPress={() => onOpenComments(post.id)} className="flex-row items-center gap-1.5">
                  <Ionicons name="chatbubble-outline" size={26} color="white" />
                  <Text className="text-white/70 font-bold text-sm">{post.commentsCount || 0}</Text>
                </TouchableOpacity>

                {/* ADD REACTION (NOU) */}
                <TouchableOpacity onPress={handleAddReaction} className="flex-row items-center justify-center w-8 h-8 rounded-full border border-dashed border-white/40 bg-white/5">
                  <Ionicons name="add" size={16} color="white" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center gap-2">
                {/* RECENT REACTIONS AVALANCHE */}
                {recentReactions.length > 0 && (
                  <View className="flex-row-reverse">
                    {recentReactions.map((uri, index) => (
                      <View key={index} className={`w-8 h-8 rounded-full border-2 border-[#090E17] overflow-hidden bg-white/10 ${index > 0 ? '-mr-3' : ''}`}>
                         <Image source={{ uri }} className="w-full h-full object-cover" />
                      </View>
                    ))}
                  </View>
                )}

                {/* MACROS BADGE */}
                {post.calories && (
                  <BlurView intensity={40} tint="dark" className="border border-[#7ad7c6]/50 rounded-full px-3 py-1.5 flex-row items-center gap-1 overflow-hidden ml-2 bg-[#7ad7c6]/10">
                    <Ionicons name="flame" size={12} color="#7ad7c6" />
                    <Text className="text-[#7ad7c6] font-black text-[10px] uppercase tracking-wider">{post.calories} kcal</Text>
                  </BlurView>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});

export default LiquidPostCard;