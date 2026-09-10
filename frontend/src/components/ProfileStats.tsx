import React from 'react';
import { View, Text } from 'react-native';
import BouncyPressable from './BouncyPressable';

interface ProfileStatsProps {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  openFollowers: () => void;
  openFollowing: () => void;
}

export default function ProfileStats({
  followersCount,
  followingCount,
  postsCount,
  openFollowers,
  openFollowing,
}: ProfileStatsProps) {
  return (
    <View className="px-5 mb-8 w-full">
      <View className="flex-row justify-evenly items-center py-4 px-2 rounded-full border border-white/10 bg-white/[0.03] shadow-lg shadow-black/50">
        <BouncyPressable onPress={openFollowers} className="items-center w-24">
          <Text className="text-white font-black text-[20px]">{followersCount}</Text>
          <Text className="text-white/40 text-[10px] uppercase font-bold mt-1">Followers</Text>
        </BouncyPressable>
        
        <View className="w-[1px] h-6 bg-white/20" />
        
        <View className="items-center w-24">
          <Text className="text-white font-black text-[20px]">{postsCount}</Text>
          <Text className="text-white/40 text-[10px] uppercase font-bold mt-1">Posts</Text>
        </View>

        <View className="w-[1px] h-6 bg-white/20" />
        
        <BouncyPressable onPress={openFollowing} className="items-center w-24">
          <Text className="text-white font-black text-[20px]">{followingCount}</Text>
          <Text className="text-white/40 text-[10px] uppercase font-bold mt-1">Following</Text>
        </BouncyPressable>
      </View>
    </View>
  );
}
