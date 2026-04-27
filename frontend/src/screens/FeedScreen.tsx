import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import LiquidPostCard from '../components/LiquidPostCard';
import GlassTabBar from '../components/GlassTabBar';

const { height, width } = Dimensions.get('window');

const mockData = [
  {
    id: '1',
    author: { username: 'Marcus_Fit' },
    mediaUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    frontMediaUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80',
    calories: null,
    caption: 'Back on the grind. Niciun pas inapoi!'
  },
  {
    id: '2',
    author: { username: 'Elena_R' },
    mediaUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    frontMediaUrl: null,
    calories: 650,
    caption: 'Post-workout recovery bowl'
  },
  {
    id: '3',
    author: { username: 'David_K' },
    mediaUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
    frontMediaUrl: null,
    calories: null,
    caption: 'Morning run 🏃‍♂️'
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

    floatOrb(orb1Anim, 20000);
    floatOrb(orb2Anim, 25000);
    floatOrb(orb3Anim, 18000);
  }, []);

  const orb1X = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 100] });
  const orb1Y = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 150] });

  const orb2X = orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [width - 100, width - 250] });
  const orb2Y = orb2Anim.interpolate({ inputRange: [0, 1], outputRange: [height / 2, height / 2 - 150] });

  const orb3X = orb3Anim.interpolate({ inputRange: [0, 1], outputRange: [50, -100] });
  const orb3Y = orb3Anim.interpolate({ inputRange: [0, 1], outputRange: [height - 100, height - 300] });

  return (
    <View className="flex-1 bg-[#050A15]">
      
      {/* 🌌 STRATUL 1: Petele de culoare (Vibrante) */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none">
        <Animated.View 
          style={{ transform: [{ translateX: orb1X }, { translateY: orb1Y }] }} 
          className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#7dd3fc] opacity-60 rounded-full blur-3xl"
        />
        <Animated.View 
          style={{ transform: [{ translateX: orb2X }, { translateY: orb2Y }] }} 
          className="absolute w-[600px] h-[600px] bg-[#c5eaff] opacity-50 rounded-full blur-3xl"
        />
        <Animated.View 
          style={{ transform: [{ translateX: orb3X }, { translateY: orb3Y }] }} 
          className="absolute w-[550px] h-[550px] bg-[#7ad7c6] opacity-40 rounded-full blur-3xl"
        />
      </View>

      {/* 🌌 STRATUL 2: O peliculă fină de sticlă pentru a uniformiza culorile, FĂRĂ tint negru agresiv */}
      <View className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* STRATUL 3: Continutul (FlatList) */}
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

      <GlassTabBar activeTab={activeTab} onTabPress={(tab) => setActiveTab(tab as any)} />
    </View>
  );
} 