import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Dimensions, StyleSheet, ActivityIndicator, Text, Modal, TextInput, TouchableOpacity, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import LiquidPostCard from '../components/LiquidPostCard';
import GlassTabBar from '../components/GlassTabBar';
import CameraScreen from './CameraScreen';
import ProfileScreen from './ProfileScreen';
import FriendsScreen from './FriendsScreen';
import NutritionScreen from './NutritionScreen';
import SwipeableModal, { ModalScrollContext } from '../components/SwipeableModal';
import { api } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

const { width, height } = Dimensions.get('window');

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'camera' | 'nutrition' | 'profile'>('feed');

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideTabBar, setHideTabBar] = useState(false);
  const feedEnterAnim = useRef(new Animated.Value(0)).current;

  const [activePostId, setActivePostId] = useState<string | null>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActivePostId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  useEffect(() => {
    if (activeTab === 'feed') {
      feedEnterAnim.setValue(0);
      Animated.spring(feedEnterAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    }
  }, [activeTab]);

  // States pentru comentarii (Global Feed)
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchGlobalFeed = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/feed?type=REEL&page=0&size=10');
      setPosts(response.data.content);
    } catch (error) {
      console.error("Error fetching Videos feed:", error);
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


  // Functii Comentarii
  const openComments = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const res = await api.get(`/comments/${postId}?page=0&size=50`);
      setComments(res.data.content);
    } catch (e) {} finally { setLoadingComments(false); }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activeCommentsPostId) return;
    const text = newComment;
    setNewComment('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post(`/comments/${activeCommentsPostId}`, { text });
      const res = await api.get(`/comments/${activeCommentsPostId}?page=0&size=50`);
      setComments(res.data.content);
      setPosts(curr => curr.map(p => p.id === activeCommentsPostId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
    } catch (e) {}
  };

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#090E17]">
      <View className="flex-1">
        {activeTab === 'feed' ? (
          <Animated.View style={{ flex: 1, backgroundColor: 'black', opacity: feedEnterAnim, transform: [{ translateY: feedEnterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
            {loading ? (
              <ActivityIndicator size="large" color="#7dd3fc" className="mt-20" />
            ) : posts.length === 0 ? (
              <Text className="text-white/40 text-center mt-20 font-bold">No global videos found.</Text>
            ) : (
              <FlatList 
                data={posts}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                pagingEnabled
                snapToAlignment="start"
                decelerationRate="fast"
                removeClippedSubviews={true}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                onRefresh={fetchGlobalFeed}
                refreshing={loading}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                  <View style={{ height, width }}>
                    <LiquidPostCard 
                      post={item} 
                      cardHeight={height} 
                      onOpenProfile={(username) => navigation.navigate('UserProfile', { username })}
                      onOpenComments={() => openComments(item.id)}
                      onPostDeleted={(id) => setPosts(curr => curr.filter(p => p.id !== id))}
                      onUserBlocked={(id) => setPosts(curr => curr.filter(p => p.author.id !== id))}
                      onLikeToggled={handleLikeToggled}
                      onEditCaption={(id, text) => console.log("Edit")}
                      shouldPlay={item.id === activePostId && activeTab === 'feed'}
                    />
                  </View>
                )}
              />
            )}
          </Animated.View>
        ) : activeTab === 'friends' ? (
          <FriendsScreen onOpenCamera={() => setActiveTab('camera')} onHideBottomBar={setHideTabBar} />
        ) : activeTab === 'profile' ? (
          <ProfileScreen onHideBottomBar={setHideTabBar} />
        ) : activeTab === 'nutrition' ? (
          <NutritionScreen /> 
        ) : null}
      </View>

      {/* Am adaugat activeCommentsPostId === null ca bara sa se ascunda cand scrii commenturi */}
      {activeTab !== 'camera' && activeCommentsPostId === null && !hideTabBar && (
        <GlassTabBar activeTab={activeTab} onTabPress={(tab) => setActiveTab(tab as any)} />
      )}
      
      {activeTab === 'camera' && (
        <View style={StyleSheet.absoluteFill} className="z-[100]">
          <CameraScreen onClose={() => setActiveTab('friends')} />
        </View>
      )}


      <SwipeableModal visible={activeCommentsPostId !== null} onClose={() => setActiveCommentsPostId(null)} title="Comments" heightRatio={0.65}>
        <ModalScrollContext.Consumer>
          {(scrollContext) => loadingComments ? (
            <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              onScroll={scrollContext?.onScroll}
              scrollEventThrottle={scrollContext?.scrollEventThrottle}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
            renderItem={({ item }) => (
              <View className="flex-row gap-3 mb-4">
                <View className="w-8 h-8 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.04]">
                  {item?.user?.profilePicUrl ? (
                    <Image source={{ uri: optimizedThumbUrl(item.user.profilePicUrl, 100) }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white/60 text-xs font-semibold">
                      {item?.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View className="flex-1 bg-white/[0.03] p-3.5 rounded-2xl rounded-tl-sm border border-white/[0.04]">
                  <Text className="text-[#7dd3fc] text-[10px] font-bold mb-1 tracking-wider uppercase">
                    {item?.user?.username || 'Unknown'}
                  </Text>
                  <Text className="text-white/90 text-[13px] leading-5">{item?.text || ''}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text className="text-white/20 text-center mt-10 text-xs">No comments yet.</Text>}
          />
        )}
        </ModalScrollContext.Consumer>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.04)', backgroundColor: 'rgba(9,14,23,0.95)' }}>
          <TextInput value={newComment} onChangeText={setNewComment} placeholder="Add a comment..." placeholderTextColor="rgba(255,255,255,0.2)" keyboardAppearance="dark" style={{ flex: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, paddingHorizontal: 16, color: 'white', fontSize: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />
          <TouchableOpacity onPress={submitComment} disabled={!newComment.trim()} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: newComment.trim() ? '#7dd3fc' : 'rgba(255,255,255,0.04)' }}>
            <Ionicons name="arrow-up" size={20} color={newComment.trim() ? '#090E17' : 'rgba(255,255,255,0.15)'} />
          </TouchableOpacity>
        </View>
      </SwipeableModal>

    </View>
  );
}