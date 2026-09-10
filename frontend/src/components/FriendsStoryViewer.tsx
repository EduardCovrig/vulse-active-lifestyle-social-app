import React from 'react';
import { View, Text, Image, Modal, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { optimizedImageUrl, optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface FriendsStoryViewerProps {
  activeStory: any;
  closeStory: () => void;
  storyProgress: any;
  insets: any;
}

export default function FriendsStoryViewer({
  activeStory,
  closeStory,
  storyProgress,
  insets,
}: FriendsStoryViewerProps) {
  if (activeStory === null) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}>
      <View className="flex-1 bg-black">
        {activeStory?.dailyPostUrl && (
          <Image source={{ uri: optimizedImageUrl(activeStory.dailyPostUrl, 800) }} className="w-full h-full" resizeMode="cover" />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} className="absolute top-0 inset-x-0 h-40 pointer-events-none" />

        <View className="absolute flex-row w-full px-2" style={{ top: insets.top }}>
          <View className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden mx-1">
            <Animated.View style={{ width: storyProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), height: '100%', backgroundColor: 'white' }} />
          </View>
        </View>

        <View className="absolute flex-row items-center justify-between w-full px-4" style={{ top: insets.top + 16 }}>
           <View className="flex-row items-center gap-3">
             <View className="w-10 h-10 rounded-full border border-white/30 overflow-hidden bg-white/10">
               {(activeStory?.img || activeStory?.profilePicUrl) && <Image source={{ uri: optimizedThumbUrl(activeStory.img || activeStory.profilePicUrl, 100) }} className="w-full h-full" />}
             </View>
             <Text className="text-white font-bold shadow-md">{activeStory?.name}</Text>
           </View>
           <TouchableOpacity onPress={closeStory} className="p-2"><Ionicons name="close" size={28} color="white" /></TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={1} onPress={closeStory} className="absolute inset-0 top-32 z-[-1]" />
      </View>
    </View>
  );
}
