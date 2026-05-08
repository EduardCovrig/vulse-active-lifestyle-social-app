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
    <View className="absolute bottom-10 inset-x-0 items-center pointer-events-none z-50">
      <BlurView 
        intensity={60} 
        tint="dark" 
        className="pointer-events-auto flex-row justify-around items-center w-[90%] h-20 rounded-[40px] border border-white/15 overflow-hidden shadow-2xl shadow-black"
      >
        {/* 1. FEED (Global) */}
        <BouncyPressable 
          onPress={() => onTabPress?.('feed')}
          className={`p-3 rounded-full transition-all ${activeTab === 'feed' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''}`}
        >
          <Ionicons name={activeTab === 'feed' ? 'play-circle' : 'play-circle-outline'} size={28} color={activeTab === 'feed' ? 'white' : 'rgba(255,255,255,0.5)'} />
        </BouncyPressable>

        {/* 2. FRIENDS (Daily) */}
        <BouncyPressable 
          onPress={() => onTabPress?.('friends')}
          className={`p-3 rounded-full transition-all ${activeTab === 'friends' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''}`}
        >
          <Ionicons name={activeTab === 'friends' ? 'people' : 'people-outline'} size={28} color={activeTab === 'friends' ? 'white' : 'rgba(255,255,255,0.5)'} />
        </BouncyPressable>

        {/* 3. CAMERA (Centru) */}
        <BouncyPressable 
          scaleTo={0.85} 
          onPress={() => onTabPress?.('camera')}
          className="p-4 bg-primary/20 rounded-full border border-primary/30 shadow-[0_0_15px_rgba(197,234,255,0.3)]"
        >
          <Ionicons name="camera" size={32} color="#c5eaff" />
        </BouncyPressable>

        {/* 4. NUTRITION HUB (NOU) */}
        <BouncyPressable 
          onPress={() => onTabPress?.('nutrition')}
          className={`p-3 rounded-full transition-all ${activeTab === 'nutrition' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''}`}
        >
          <Ionicons name={activeTab === 'nutrition' ? 'pie-chart' : 'pie-chart-outline'} size={28} color={activeTab === 'nutrition' ? '#7ad7c6' : 'rgba(255,255,255,0.5)'} />
        </BouncyPressable>

        {/* 5. PROFILE */}
        <BouncyPressable 
          onPress={() => onTabPress?.('profile')}
          className={`p-3 rounded-full transition-all ${activeTab === 'profile' ? 'bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : ''}`}
        >
          <Ionicons name={activeTab === 'profile' ? 'person-circle' : 'person-circle-outline'} size={28} color={activeTab === 'profile' ? 'white' : 'rgba(255,255,255,0.5)'} />
        </BouncyPressable>

      </BlurView>
    </View>
  );
}