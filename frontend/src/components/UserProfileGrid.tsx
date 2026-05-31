import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const ITEM_WIDTH = (width - 8 - (GRID_GAP * 2)) / 3;

interface UserProfileGridProps {
  userPosts: any[];
  iHavePostedToday: boolean;
  isWithinLast24Hours: (dateStr: string) => boolean;
  setSelectedPost: (post: any) => void;
}

export default function UserProfileGrid({
  userPosts,
  iHavePostedToday,
  isWithinLast24Hours,
  setSelectedPost,
}: UserProfileGridProps) {
  return (
    <View className="px-1">
      <View className="flex-row flex-wrap justify-start" style={{ gap: GRID_GAP }}>
         {userPosts.map((post) => {
           const isLocked = !iHavePostedToday && post.type === 'DAILY' && isWithinLast24Hours(post.createdAt);

           return (
             <TouchableOpacity 
               key={post.id} 
               onPress={() => {
                 if (isLocked) {
                   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                   Alert.alert("Locked 🔒", "Post your Daily Snap to unlock your friends' latest daily moments!");
                   return;
                 }
                 Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                 setSelectedPost(post);
               }}
               activeOpacity={0.8}
               style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
               className="bg-white/[0.03] rounded-lg overflow-hidden relative items-center justify-center"
             >
               <Image 
                 source={{ uri: optimizedThumbUrl(post.mediaUrl) }} 
                 className="absolute inset-0 w-full h-full" 
                 resizeMode="cover" 
                 blurRadius={isLocked ? 12 : 0}
               />
               
               {isLocked && (
                 <View className="absolute inset-0 bg-black/40 items-center justify-center">
                   <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.9)" />
                 </View>
               )}

               <View className="absolute bottom-1.5 left-1.5 flex-row gap-1">
                 {post.calories && !isLocked && (
                    <View className="bg-black/40 rounded-full flex-row items-center px-1.5 py-0.5">
                      <Ionicons name="flame" size={7} color="#7ad7c6" />
                    </View>
                 )}
                 {post.type === 'REEL' && (
                    <View className="bg-black/40 rounded-full flex-row items-center px-1.5 py-0.5">
                      <Ionicons name="play" size={7} color="rgba(255,255,255,0.8)" />
                    </View>
                 )}
               </View>
             </TouchableOpacity>
           );
         })}
         {userPosts.length === 0 && (
           <View className="w-full py-16 items-center justify-center">
             <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.08)" />
             <Text className="text-white/20 mt-3 font-semibold tracking-widest uppercase text-[10px]">No posts yet</Text>
           </View>
         )}
      </View>
    </View>
  );
}
