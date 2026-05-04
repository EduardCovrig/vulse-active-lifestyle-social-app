import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, Image, Pressable, Animated, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons'; 
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

interface LiquidPostCardProps {
  post: any;
  cardHeight: number;
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

export default function LiquidPostCard({ post, cardHeight }: LiquidPostCardProps) {
  const { username } = useContext(AuthContext);

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isDeleted, setIsDeleted] = useState(false); // Ascundem cardul daca a fost sters

  const cardScale = useRef(new Animated.Value(1)).current;
  const bigHeartScale = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);

  const toggleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLiked(!isLiked);
    setLikesCount((prev: number) => isLiked ? prev - 1 : prev + 1);

    try {
      await api.post(`/interactions/${post.id}/like`);
    } catch (error) {
      console.error("Eroare la like:", error);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
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

  const handleOptions = () => {
    const isMyPost = post.author.username === username;
    
    const options: any[] = [{ text: "Cancel", style: "cancel" }];

    if (isMyPost) {
      options.push({
        text: "Delete Post",
        style: "destructive",
        onPress: async () => {
          Alert.alert("Ești sigur?", "Postarea va fi ștearsă definitiv.", [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Delete", 
              style: "destructive", 
              onPress: async () => {
                try {
                  await api.delete(`/posts/${post.id}`);
                  setIsDeleted(true); // Ascundem componenta local
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) {
                  Alert.alert("Eroare", "Nu am putut șterge postarea.");
                }
              }
            }
          ]);
        }
      });
    } else {
      options.push({
        text: "Report Post",
        style: "destructive",
        onPress: async () => {
          await api.post(`/safety/report/post/${post.id}`, { reason: "Inappropriate content" });
          Alert.alert("Reported", "Un admin va verifica această postare.");
        }
      });
    }

    Alert.alert("Options", "What would you like to do?", options);
  };

  if (isDeleted) return null; // Magie React: Dispare cardul dacă i-am dat delete

  return (
    <View style={{ height: cardHeight }} className="w-full relative mb-4">
      <Animated.View style={{ transform: [{ scale: cardScale }] }} className="flex-1 rounded-[40px] overflow-hidden shadow-2xl shadow-black bg-black relative">
        <Pressable 
          onPress={handleDoubleTap}
          style={{ flex: 1, position: 'relative' }}
        >
          <Image source={{ uri: post.mediaUrl }} className="absolute inset-0 w-full h-full object-cover" />
          
          <View className="absolute inset-0 bg-black/10" />
          <View className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <View className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          {/* INIMA DOUBLE TAP */}
          <Animated.View 
            pointerEvents="none" 
            style={{ 
              position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20,
              transform: [{ scale: bigHeartScale }] 
            }}
          >
            <View className="w-32 h-32 rounded-full items-center justify-center bg-black/60 border border-white/20 shadow-2xl shadow-black">
               <Ionicons name="heart" size={70} color="#ff4b4b" />
            </View>
          </Animated.View>

          {/* HEADER (AUTHOR INFO) */}
          <View className="absolute top-6 left-4 z-10 pointer-events-none">
            <View className="rounded-full overflow-hidden border border-white/20">
              <BlurView intensity={50} tint="dark" className="flex-row items-center p-1.5 pr-5">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center border border-white/30 mr-3 overflow-hidden">
                  {post.author?.profilePicUrl ? (
                    <Image source={{ uri: post.author.profilePicUrl }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white font-extrabold text-base">
                      {post.author?.username?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
                <View>
                  <Text className="text-white text-sm font-black tracking-widest uppercase">{post.author?.username}</Text>
                  <Text className="text-white/70 text-[10px] font-bold uppercase mt-0.5">{getRelativeTime(post.createdAt)}</Text>
                </View>
              </BlurView>
            </View>
          </View>

          {/* BUTON OPTIUNI (STREGER / REPORT) */}
          <View className="absolute top-6 right-4 z-10">
            <TouchableOpacity onPress={handleOptions} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/20 backdrop-blur-md">
              <Ionicons name="ellipsis-horizontal" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* FOOTER (INTERACTIONS & CAPTION) */}
          <View className="absolute bottom-6 inset-x-5 z-10">
            {post.caption && (
              <Text className="text-white font-body-md text-sm mb-4 shadow-md">{post.caption}</Text>
            )}
            
            <View className="flex-row justify-between items-center">
              <View className="flex-row gap-4">
                <TouchableOpacity onPress={toggleLike} className="flex-row items-center gap-1.5">
                  <Ionicons name={isLiked ? "heart" : "heart-outline"} size={28} color={isLiked ? "#ff4b4b" : "white"} />
                  <Text className="text-white font-bold text-sm">{likesCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center gap-1.5">
                  <Ionicons name="chatbubble-outline" size={26} color="white" />
                  <Text className="text-white font-bold text-sm">{post.commentsCount || 0}</Text>
                </TouchableOpacity>
              </View>

              {post.calories && (
                <View className="bg-secondary/20 border border-secondary/30 rounded-full px-3 py-1.5 flex-row items-center gap-1">
                  <Ionicons name="flame" size={14} color="#7ad7c6" />
                  <Text className="text-secondary font-black text-xs">{post.calories} kcal</Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}