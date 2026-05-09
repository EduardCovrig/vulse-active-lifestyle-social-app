import React, { useState, useEffect } from 'react';
import { View, FlatList, Dimensions, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LiquidPostCard from '../components/LiquidPostCard';
import GlassTabBar from '../components/GlassTabBar';
import CameraScreen from './CameraScreen';
import ProfileScreen from './ProfileScreen';
import FriendsScreen from './FriendsScreen';
import NutritionScreen from './NutritionScreen';
import { api } from '../services/api';

const { height } = Dimensions.get('window');

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'camera' | 'nutrition' | 'profile'>('feed');

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const CARD_HEIGHT = height - insets.top - insets.bottom - 100;

  const fetchGlobalFeed = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/feed?type=REEL&page=0&size=10');
      setPosts(response.data.content);
    } catch (error) {
      console.error("Eroare fetching Reels feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalFeed();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#090E17]">
      <View className="flex-1">
        {activeTab === 'feed' ? (
          <View className="flex-1" style={{ paddingTop: insets.top }}>
            {loading ? (
              <ActivityIndicator size="large" color="#7dd3fc" className="mt-20" />
            ) : posts.length === 0 ? (
              <Text className="text-white/40 text-center mt-20 font-bold">No global reels found.</Text>
            ) : (
              <FlatList 
                data={posts}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                pagingEnabled
                snapToInterval={CARD_HEIGHT + 24}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 150 }}
                onRefresh={fetchGlobalFeed}
                refreshing={loading}
                renderItem={({ item }) => (
                  <LiquidPostCard 
                    post={item} 
                    cardHeight={CARD_HEIGHT} 
                    onOpenComments={() => console.log("Comments pe global in progress")}
                    onPostDeleted={(id) => setPosts(curr => curr.filter(p => p.id !== id))}
                    onUserBlocked={(id) => setPosts(curr => curr.filter(p => p.author.id !== id))}
                    onEditCaption={(id, text) => console.log("Edit")}
                  />
                )}
              />
            )}
          </View>
        ) : activeTab === 'friends' ? (
          <FriendsScreen onOpenCamera={() => setActiveTab('camera')} />
        ) : activeTab === 'profile' ? (
          <ProfileScreen />
        ) : activeTab === 'nutrition' ? (
          <NutritionScreen /> 
        ) : null}
      </View>

      {activeTab !== 'camera' && (
        <GlassTabBar activeTab={activeTab} onTabPress={(tab) => setActiveTab(tab as any)} />
      )}
      {activeTab === 'camera' && (
        <View style={StyleSheet.absoluteFill} className="z-[100]">
          <CameraScreen onClose={() => setActiveTab('friends')} />
        </View>
      )}
    </View>
  );
}