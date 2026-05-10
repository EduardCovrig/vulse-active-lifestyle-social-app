import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import BouncyPressable from './BouncyPressable';

interface GlassTabBarProps {
  activeTab: 'feed' | 'friends' | 'camera' | 'nutrition' | 'profile';
  onTabPress?: (tab: string) => void; 
}

export default function GlassTabBar({ activeTab, onTabPress }: GlassTabBarProps) {
  return (
    <View className="absolute bottom-8 inset-x-0 items-center pointer-events-none z-50">
      <BlurView 
        intensity={50} 
        tint="dark" 
        className="pointer-events-auto flex-row justify-around items-center w-[85%] h-16 rounded-full border border-white/[0.08] overflow-hidden"
      >
        {/* 1. FEED (Global) */}
        <BouncyPressable 
          onPress={() => onTabPress?.('feed')}
          className={`p-2.5 rounded-full ${activeTab === 'feed' ? 'bg-white/[0.08]' : ''}`}
        >
          <Ionicons name={activeTab === 'feed' ? 'play-circle' : 'play-circle-outline'} size={24} color={activeTab === 'feed' ? 'white' : 'rgba(255,255,255,0.4)'} />
        </BouncyPressable>

        {/* 2. FRIENDS (Daily) */}
        <BouncyPressable 
          onPress={() => onTabPress?.('friends')}
          className={`p-2.5 rounded-full ${activeTab === 'friends' ? 'bg-white/[0.08]' : ''}`}
        >
          <Ionicons name={activeTab === 'friends' ? 'people' : 'people-outline'} size={24} color={activeTab === 'friends' ? 'white' : 'rgba(255,255,255,0.4)'} />
        </BouncyPressable>

        {/* 3. CAMERA (Center) */}
        <BouncyPressable 
          scaleTo={0.88} 
          onPress={() => onTabPress?.('camera')}
          className="p-3.5 bg-white/[0.08] rounded-full border border-white/[0.12]"
        >
          <Ionicons name="camera" size={26} color="rgba(255,255,255,0.9)" />
        </BouncyPressable>

        {/* 4. NUTRITION HUB */}
        <BouncyPressable 
          onPress={() => onTabPress?.('nutrition')}
          className={`p-2.5 rounded-full ${activeTab === 'nutrition' ? 'bg-white/[0.08]' : ''}`}
        >
          <Ionicons name={activeTab === 'nutrition' ? 'pie-chart' : 'pie-chart-outline'} size={24} color={activeTab === 'nutrition' ? '#7ad7c6' : 'rgba(255,255,255,0.4)'} />
        </BouncyPressable>

        {/* 5. PROFILE */}
        <BouncyPressable 
          onPress={() => onTabPress?.('profile')}
          className={`p-2.5 rounded-full ${activeTab === 'profile' ? 'bg-white/[0.08]' : ''}`}
        >
          <Ionicons name={activeTab === 'profile' ? 'person-circle' : 'person-circle-outline'} size={24} color={activeTab === 'profile' ? 'white' : 'rgba(255,255,255,0.4)'} />
        </BouncyPressable>

      </BlurView>
    </View>
  );
}