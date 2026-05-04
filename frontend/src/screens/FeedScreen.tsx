import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, Dimensions, Animated, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import LiquidPostCard from '../components/LiquidPostCard';
import GlassTabBar from '../components/GlassTabBar';
import CameraScreen from './CameraScreen';
import ProfileScreen from './ProfileScreen';
import FriendsScreen from './FriendsScreen';
import { api } from '../services/api';

const { height, width } = Dimensions.get('window');

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'camera' | 'profile'>('feed');

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const CARD_HEIGHT = height - insets.top - insets.bottom - 100;

  // Background Animations
  const orb1Anim = useRef(new Animated.Value(0)).current;
  const orb2Anim = useRef(new Animated.Value(0)).current;

  const fetchGlobalFeed = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/feed?type=REEL&page=0&size=10');
      setPosts(response.data.content); // "content" pt ca backendul returneaza Page<>
    } catch (error) {
      console.error("Eroare fetching Reels feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalFeed();
    const floatOrb = (animValue: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration, useNativeDriver: true })
        ])
      ).start();
    };
    floatOrb(orb1Anim, 22000);
    floatOrb(orb2Anim, 28000);
  }, []);

  const orb1X = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [-100, 150] });
  const orb1Y = orb1Anim.interpolate({ inputRange: [0, 1], outputRange: [-50, 200] });

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#050A15]">
      {/* BACKGROUND ORBS */}
      <View style={StyleSheet.absoluteFill} className="overflow-hidden pointer-events-none">
        <Animated.View style={{ transform: [{ translateX: orb1X }, { translateY: orb1Y }], backgroundColor: '#7dd3fc', width: 400, height: 400, borderRadius: 200, position: 'absolute', opacity: 0.5 }} />
      </View>
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} className="pointer-events-none" />

      {/* DYNAMIC CONTENT */}
      <View className="flex-1">
        {activeTab === 'feed' ? (
          <View className="flex-1" style={{ paddingTop: insets.top }}>
            {loading ? (
              <ActivityIndicator size="large" color="#c5eaff" className="mt-20" />
            ) : posts.length === 0 ? (
              <Text className="text-white text-center mt-20 font-bold">No global reels found.</Text>
            ) : (
              <FlatList 
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <LiquidPostCard post={item} cardHeight={CARD_HEIGHT} />}
                showsVerticalScrollIndicator={false}
                pagingEnabled
                snapToInterval={CARD_HEIGHT + 16}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 150 }}
                onRefresh={fetchGlobalFeed}
                refreshing={loading}
              />
            )}
          </View>
        ) : activeTab === 'friends' ? (
          <FriendsScreen />
        ) : activeTab === 'profile' ? (
          <ProfileScreen />
        ) : null}
      </View>

      {/* TAB BAR & CAMERA */}
      {activeTab !== 'camera' && (
        <GlassTabBar activeTab={activeTab} onTabPress={(tab) => setActiveTab(tab as any)} />
      )}
      {activeTab === 'camera' && (
        <View style={StyleSheet.absoluteFill} className="z-[100]">
          <CameraScreen onClose={() => setActiveTab('feed')} />
        </View>
      )}
    </View>
  );
}