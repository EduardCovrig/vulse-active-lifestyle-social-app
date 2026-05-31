import React from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface UserProfileHeaderProps {
  insets: any;
  navigation: any;
  headerTranslateY: any;
  profilePicScale: any;
  profile: any;
  handleFollowUser: () => Promise<void>;
  isFollowing: boolean;
}

export default function UserProfileHeader({
  insets,
  navigation,
  headerTranslateY,
  profilePicScale,
  profile,
  handleFollowUser,
  isFollowing,
}: UserProfileHeaderProps) {
  return (
    <>
      <Animated.View style={{ transform: [{ translateY: headerTranslateY }], position: 'absolute', top: 0, left: 0, right: 0, height: 180, zIndex: 1 }}>
        <LinearGradient colors={['rgba(122, 215, 198, 0.04)', 'transparent']} className="absolute inset-0" />
      </Animated.View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingTop: insets.top + 10, paddingLeft: 20, zIndex: 50, position: 'absolute' }}>
        <View className="w-9 h-9 bg-white/[0.06] rounded-full items-center justify-center border border-white/[0.08]">
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </View>
      </TouchableOpacity>

      <View className="items-center px-6 mt-6">
        <Animated.View style={{ transform: [{ scale: profilePicScale }] }} className="mb-4">
          <View className="p-[2px] rounded-full bg-white/15 shadow-xl shadow-black/50">
            <View className="w-[100px] h-[100px] rounded-full bg-[#0c1018] overflow-hidden items-center justify-center">
              {profile?.profilePicUrl ? (
                <Image source={{ uri: optimizedThumbUrl(profile.profilePicUrl, 200) }} className="w-full h-full" />
              ) : (
                <Text className="text-white font-bold text-4xl">{profile?.username?.charAt(0).toUpperCase()}</Text>
              )}
            </View>
          </View>
        </Animated.View>

        <Text className="text-white font-black text-[28px] tracking-tight mb-2">{profile?.username}</Text>
        <Text className="text-white/70 text-[14px] text-center max-w-[80%] mb-6 font-medium leading-5">{profile?.bio || 'Living the active life'}</Text>

        <TouchableOpacity 
          onPress={handleFollowUser} 
          className={`px-12 py-3.5 rounded-full mb-8 ${isFollowing ? 'bg-white/[0.06] border border-white/[0.1]' : 'bg-[#7ad7c6]'}`}
          style={!isFollowing ? { shadowColor: '#7ad7c6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 10 } : {}}
        >
          <Text className={`font-bold text-[15px] tracking-wide ${isFollowing ? 'text-white/70' : 'text-[#090E17]'}`}>
            {isFollowing ? 'Following ✓' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}
