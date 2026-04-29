import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Dimensions, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import LiquidPostCard from '../components/LiquidPostCard';
import GlassTabBar from '../components/GlassTabBar';
import CameraScreen from './CameraScreen';
import ProfileScreen from './ProfileScreen';

const { height, width } = Dimensions.get('window');

// Generam niste timpuri relative pentru mock data
const now = Date.now();

const mockData = [
  {
    id: '1',
    author: { username: 'Marcus_Fit' },
    mediaUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    frontMediaUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80',
    calories: null,
    createdAt: new Date(now - 15 * 60000).toISOString(), 
    caption: 'Back on the grind. Niciun pas inapoi!'
  },
  {
    id: '2',
    author: { username: 'Elena_R' },
    mediaUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    frontMediaUrl: null,
    calories: 650,
    createdAt: new Date(now - 2 * 3600000).toISOString(), 
    caption: 'Post-workout recovery bowl'
  }
];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'camera' | 'profile'>('friends');

  const CARD_HEIGHT = height - insets.top - insets.bottom - 100;

  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;
  const orb3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatOrb = (animValue: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: duration, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: duration, useNativeDriver: true })
        ])
      ).start();
    };

    floatOrb(orb1Anim, 22000);
    floatOrb(orb2Anim, 28000);
    floatOrb(orb3Anim, 20000);
  }, []);

  const orb1X = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [-100, 150] });
  const orb1Y = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 200] });

  const orb2X = orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [width - 150, width - 350] });
  const orb2Y = orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [height / 2, height / 2 - 200] });

  const orb3X = orb3Anim.interpolate({ inputRange: [0, 1], outputRange: [100, -150] });
  const orb3Y = orb3Anim.interpolate({ inputRange: [0, 1], outputRange: [height - 100, height - 400] });

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#050A15]">
      
      {/* 1. FUNDALUL ȘI ORB-URILE */}
      <View style={StyleSheet.absoluteFill} className="overflow-hidden pointer-events-none">
        <Animated.View style={{ transform: [{ translateX: orb1X }, { translateY: orb1Y }], backgroundColor: '#7dd3fc', width: 400, height: 400, borderRadius: 200, position: 'absolute', opacity: 0.5 }} />
        <Animated.View style={{ transform: [{ translateX: orb2X }, { translateY: orb2Y }], backgroundColor: '#c5eaff', width: 500, height: 500, borderRadius: 250, position: 'absolute', opacity: 0.4 }} />
        <Animated.View style={{ transform: [{ translateX: orb3X }, { translateY: orb3Y }], backgroundColor: '#7ad7c6', width: 450, height: 450, borderRadius: 225, position: 'absolute', opacity: 0.3 }} />
      </View>
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} className="pointer-events-none" />

      {/* 2. CONȚINUTUL DINAMIC */}
      <View className="flex-1">
        {activeTab === 'friends' || activeTab === 'feed' ? (
          <View className="flex-1" style={{ paddingTop: insets.top }}>
            <FlatList 
              data={mockData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <LiquidPostCard post={item} cardHeight={CARD_HEIGHT} />}
              showsVerticalScrollIndicator={false}
              pagingEnabled
              snapToInterval={CARD_HEIGHT + 16}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 150 }}
            />
          </View>
        ) : activeTab === 'profile' ? (
          <ProfileScreen />
        ) : null}
      </View>

      {/* 3. TAB BAR-UL */}
      {activeTab !== 'camera' && (
        <GlassTabBar activeTab={activeTab} onTabPress={(tab) => setActiveTab(tab as any)} />
      )}

      {/* 4. OVERLAY-UL DE CAMERĂ */}
      {activeTab === 'camera' && (
        <View style={StyleSheet.absoluteFill} className="z-[100]">
          <CameraScreen onClose={() => setActiveTab('friends')} />
        </View>
      )}

    </View>
  );
}