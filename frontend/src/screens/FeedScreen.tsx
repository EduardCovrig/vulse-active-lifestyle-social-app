import React, { useState, useEffect } from 'react';
import { View, FlatList, Dimensions, StyleSheet, ActivityIndicator, Text, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'camera' | 'nutrition' | 'profile'>('feed');

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactingToPostId, setReactingToPostId] = useState<string | null>(null);
  const [hideTabBar, setHideTabBar] = useState(false);

  const CARD_HEIGHT = height - insets.top - insets.bottom - 100;

  const fetchGlobalFeed = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/feed?type=REEL&page=0&size=10');
      setPosts(response.data.content);
    } catch (error) {
      console.error("Error fetching Reels feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalFeed();
  }, []);

  const handleLikeToggled = (postId: string, newIsLiked: boolean) => {
    setPosts(curr => curr.map(p => p.id === postId ? { ...p, isLiked: newIsLiked, likesCount: newIsLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) } : p));
  };

  const handleReactionCapture = async (uri: string) => {
    if (!reactingToPostId) return;
    const postId = reactingToPostId;
    setReactingToPostId(null);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'reaction.jpg';
      const type = `image/${filename.split('.').pop()}`;

      formData.append('file', { uri, name: filename, type } as any);
      setPosts(curr => curr.map(p => p.id === postId ? { ...p, recentReactions: [uri, ...(p.recentReactions || [])].slice(0, 3) } : p));

      await api.post(`/interactions/${postId}/react`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (error) {}
  };

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
                snapToInterval={CARD_HEIGHT + 20}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 150 }}
                removeClippedSubviews={true}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                onRefresh={fetchGlobalFeed}
                refreshing={loading}
                renderItem={({ item }) => (
                  <LiquidPostCard 
                    post={item} 
                    cardHeight={CARD_HEIGHT} 
                    onOpenProfile={(username) => navigation.navigate('UserProfile', { username })}
                    onOpenComments={() => console.log("Global comments in progress")}
                    onPostDeleted={(id) => setPosts(curr => curr.filter(p => p.id !== id))}
                    onUserBlocked={(id) => setPosts(curr => curr.filter(p => p.author.id !== id))}
                    onLikeToggled={handleLikeToggled}
                    onReactRequest={(id) => setReactingToPostId(id)}
                    onEditCaption={(id, text) => console.log("Edit")}
                  />
                )}
              />
            )}
          </View>
        ) : activeTab === 'friends' ? (
          <FriendsScreen onOpenCamera={() => setActiveTab('camera')} onHideBottomBar={setHideTabBar} />
        ) : activeTab === 'profile' ? (
          <ProfileScreen onHideBottomBar={setHideTabBar} />
        ) : activeTab === 'nutrition' ? (
          <NutritionScreen /> 
        ) : null}
      </View>

      {activeTab !== 'camera' && reactingToPostId === null && !hideTabBar && (
        <GlassTabBar activeTab={activeTab} onTabPress={(tab) => setActiveTab(tab as any)} />
      )}
      {activeTab === 'camera' && (
        <View style={StyleSheet.absoluteFill} className="z-[100]">
          <CameraScreen onClose={() => setActiveTab('friends')} />
        </View>
      )}

      {/* REACTION CAMERA OVERLAY */}
      <Modal visible={reactingToPostId !== null} transparent={true} animationType="fade" onRequestClose={() => setReactingToPostId(null)}>
        <View style={StyleSheet.absoluteFill} className="bg-black">
          {reactingToPostId && (
            <CameraScreen 
              mode="reaction" 
              onClose={() => setReactingToPostId(null)} 
              onCapture={handleReactionCapture} 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}