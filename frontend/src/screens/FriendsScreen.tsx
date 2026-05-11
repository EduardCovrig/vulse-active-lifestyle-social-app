import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, TextInput, Image, Animated, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, RefreshControl, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import BouncyPressable from '../components/BouncyPressable';
import LiquidPostCard from '../components/LiquidPostCard'; 
import CameraScreen from './CameraScreen';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import SwipeableModal from '../components/SwipeableModal';
import LockedFeedView from '../components/LockedFeedView';
import ImagePopoutModal from '../components/ImagePopoutModal';

interface FriendsScreenProps {
  onOpenCamera?: () => void;
  onHideBottomBar?: (hide: boolean) => void;
}

export default function FriendsScreen({ onOpenCamera, onHideBottomBar }: FriendsScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { username: myUsername } = useContext(AuthContext); 

  const [posts, setPosts] = useState<any[]>([]);
  const [circle, setCircle] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editCaptionText, setEditCaptionText] = useState('');

  const [reactingToPostId, setReactingToPostId] = useState<string | null>(null);

  const [activeStory, setActiveStory] = useState<any>(null);
  const storyProgress = useRef(new Animated.Value(0)).current;

  const [popoutPost, setPopoutPost] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [feedRes, circleRes] = await Promise.allSettled([
        api.get('/posts/feed?type=DAILY&page=0&size=20'),
        api.get('/users/circle')
      ]);

      if (feedRes.status === 'fulfilled') setPosts(feedRes.value.data.content);
      if (circleRes.status === 'fulfilled') setCircle(circleRes.value.data);
      else setCircle([{ id: 'me', name: 'Your Daily', img: null, hasPosted: false, isMe: true }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchData();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
    } catch (e) {}
  };

  const openUserProfile = (targetUsername: string) => {
    if (targetUsername === myUsername) {
      navigation.navigate('Profile');
      return; 
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss(); 
    setSearchQuery(''); 
    setSearchResults([]); 
    navigation.navigate('UserProfile', { username: targetUsername });
  };

  const openComments = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePostId(postId);
    setLoadingComments(true);
    try {
      const response = await api.get(`/comments/${postId}?page=0&size=50`);
      setComments(response.data.content);
    } catch (error) {} finally { setLoadingComments(false); }
  };

  const handleLikeToggled = (postId: string, newIsLiked: boolean) => {
    setPosts(curr => curr.map(p => p.id === postId ? { ...p, isLiked: newIsLiked, likesCount: newIsLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) } : p));
    if (popoutPost && popoutPost.id === postId) {
      setPopoutPost((prev: any) => ({ ...prev, isLiked: newIsLiked, likesCount: newIsLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1) }));
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activePostId) return;
    const text = newComment;
    setNewComment('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post(`/comments/${activePostId}`, { text });
      const response = await api.get(`/comments/${activePostId}?page=0&size=50`);
      setComments(response.data.content);
      
      setPosts(curr => curr.map(p => p.id === activePostId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      if (popoutPost && popoutPost.id === activePostId) {
        setPopoutPost((prev:any) => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
      }
    } catch (error) {}
  };

  const handleCommentLongPress = (comment: any) => {
    if (comment.user.username !== myUsername) return; 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Comment", "Do you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/comments/${comment.id}`);
          setComments(curr => curr.filter(c => c.id !== comment.id));
          
          setPosts(curr => curr.map(p => p.id === activePostId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
          if (popoutPost && popoutPost.id === activePostId) {
            setPopoutPost((prev:any) => ({ ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) }));
          }
        } catch (e) {}
      }}
    ]);
  };

  const saveCaptionEdit = async (postId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await api.patch(`/posts/${postId}/caption?caption=${encodeURIComponent(editCaptionText)}`);
      setPosts(curr => curr.map(p => p.id === postId ? { ...p, caption: editCaptionText } : p));
      setEditingPost(null);
    } catch(e) {}
  };

  const handleReactionCapture = async (uri: string) => {
    if (!reactingToPostId) return;
    const postId = reactingToPostId;
    setReactingToPostId(null);
    if (onHideBottomBar) onHideBottomBar(false);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'reaction.jpg';
      const type = `image/${filename.split('.').pop()}`;

      formData.append('file', { uri, name: filename, type } as any);

      setPosts(curr => curr.map(p => p.id === postId ? { ...p, recentReactions: [uri, ...(p.recentReactions || [])].slice(0, 3) } : p));
      if (popoutPost && popoutPost.id === postId) {
        setPopoutPost((prev:any) => ({ ...prev, recentReactions: [uri, ...(prev.recentReactions || [])].slice(0,3) }));
      }

      await api.post(`/interactions/${postId}/react`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {}
  };

  const iHavePosted = circle.length > 0 ? (circle.find(c => c.isMe)?.hasPosted || false) : false;

  const handleOpenStory = (friend: any) => {
    if (!friend.hasPosted || !friend.dailyPostUrl) return;
    if (!friend.isMe && !iHavePosted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Locked 🔒", "You need to post your Daily Snap first to see what your friends are up to!");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveStory(friend);
    storyProgress.setValue(0);
    Animated.timing(storyProgress, { toValue: 1, duration: 5000, useNativeDriver: false }).start(({ finished }) => {
      if (finished) setActiveStory(null);
    });
  };

  const closeStory = () => {
    storyProgress.stopAnimation();
    setActiveStory(null);
  };

  const renderCircleHeader = () => (
    <View className="mb-4 mt-2">
      <Text className="text-[#7ad7c6]/70 text-[9px] font-black tracking-[2px] uppercase mb-4 px-6">Daily Circle</Text>
      <FlatList 
        horizontal
        data={circle}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
        renderItem={({ item }) => (
          <BouncyPressable 
            className="items-center" 
            scaleTo={0.92} 
            onPress={() => {
              if (item.isMe && !item.hasPosted) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (onOpenCamera) onOpenCamera();
              } else {
                handleOpenStory(item);
              }
            }}
          >
            <View className="relative w-[50px] h-[50px] rounded-full items-center justify-center mb-1.5">
              {item.hasPosted ? (
                <LinearGradient colors={['rgba(122,215,198,0.6)', 'rgba(125,211,252,0.6)']} className="absolute inset-0 rounded-full" style={{ padding: 1.5 }}>
                  <View className="flex-1 bg-[#090E17] rounded-full border-[1.5px] border-[#090E17] overflow-hidden items-center justify-center">
                    {item.img || item.profilePicUrl ? <Image source={{ uri: item.img || item.profilePicUrl }} className="w-full h-full object-cover" blurRadius={(!item.isMe && !iHavePosted) ? 10 : 0} /> : <View className="w-full h-full bg-white/10 items-center justify-center"><Text className="text-white/80 font-bold text-xs">{item.name?.charAt(0)?.toUpperCase()}</Text></View>}
                    {(!item.isMe && !iHavePosted) && (
                      <View className="absolute inset-0 bg-black/40 items-center justify-center">
                        <Ionicons name="lock-closed" size={16} color="white" />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              ) : (
                <View className="absolute inset-0 rounded-full border-[0.5px] border-white/10 p-[1.5px]">
                  <View className="flex-1 rounded-full overflow-hidden opacity-30 bg-white/5 items-center justify-center">
                    {item.img || item.profilePicUrl ? <Image source={{ uri: item.img || item.profilePicUrl }} className="w-full h-full object-cover" /> : <Text className="text-white/40 font-bold text-xs">{item.name?.charAt(0)?.toUpperCase()}</Text>}
                  </View>
                </View>
              )}
              {item.isMe && !item.hasPosted && (
                <View className="absolute bottom-0 right-0 bg-[#7dd3fc] w-5 h-5 rounded-full items-center justify-center border-2 border-[#090E17]">
                  <Ionicons name="add" size={12} color="#090E17" />
                </View>
              )}
            </View>
            <Text className={`text-[9px] font-semibold text-center w-14 ${item.hasPosted ? 'text-white/80' : 'text-white/30'}`} numberOfLines={1}>{item.name}</Text>
          </BouncyPressable>
        )}
      />
      {iHavePosted && <Text className="text-white/30 text-[9px] font-semibold tracking-[3px] uppercase mb-3 px-6 mt-5">Latest Updates</Text>}
    </View>
  );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: '#090E17' }}>
      <View className="px-6 mb-2 z-[200]" style={{ paddingTop: insets.top + 10 }}>
        <BlurView intensity={40} tint="dark" className="flex-row items-center px-4 h-11 rounded-full border border-white/[0.08] bg-white/[0.03]">
          <Ionicons name="search" size={18} color="rgba(190,200,206,0.5)" />
          <TextInput 
            placeholder="Search friends..." 
            placeholderTextColor="rgba(190,200,206,0.35)" 
            className="flex-1 ml-3 text-white text-[14px]" 
            keyboardAppearance="dark" 
            value={searchQuery} 
            onChangeText={handleSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); Keyboard.dismiss(); }}>
              <Ionicons name="close-circle" size={18} color="rgba(190,200,206,0.4)" />
            </TouchableOpacity>
          )}
        </BlurView>

        {searchResults.length > 0 && (
          <View style={{ position: 'absolute', top: 56, left: 20, right: 20, zIndex: 300, backgroundColor: 'rgba(12,16,24,0.97)', borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', paddingVertical: 6, maxHeight: 340, overflow: 'hidden' }}>
            {searchResults.map((u, i) => (
              <TouchableOpacity key={u.id} onPress={() => openUserProfile(u.username)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < searchResults.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' }}>
                    {u.profilePicUrl ? <Image source={{ uri: u.profilePicUrl }} style={{ width: '100%', height: '100%' }} /> : <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 14 }}>{u.username.charAt(0).toUpperCase()}</Text>}
                  </View>
                  <View>
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 15, letterSpacing: 0.3 }}>{u.username}</Text>
                    {u.mutualsText && <Text style={{ color: 'rgba(122,215,198,0.7)', fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' }}>{u.mutualsText}</Text>}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.15)" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        keyboardShouldPersistTaps="handled"
        data={!iHavePosted ? [] : posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {renderCircleHeader()}
            {(!loading && circle.length > 0 && !iHavePosted) && <LockedFeedView circle={circle} onOpenCamera={onOpenCamera} />}
          </>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7dd3fc" />}
        ListEmptyComponent={
          (loading || !iHavePosted) ? null : <Text className="text-white/40 text-center mt-20">No posts in your circle today.</Text>
        }
        renderItem={({ item }) => (
          <View className="px-5 mb-4">
            {editingPost === item.id && (
              <View className="flex-row items-center bg-white/5 rounded-2xl border border-white/20 mb-4 px-2 py-1 z-50">
                <TextInput autoFocus className="flex-1 text-white p-3 font-body-md" value={editCaptionText} onChangeText={setEditCaptionText} />
                <TouchableOpacity className="bg-[#7ad7c6]/20 p-2 rounded-full" onPress={() => saveCaptionEdit(item.id)}>
                  <Ionicons name="checkmark" size={20} color="#7ad7c6" />
                </TouchableOpacity>
              </View>
            )}
            
            <LiquidPostCard 
              post={item} 
              onOpenProfile={openUserProfile}
              onOpenComments={() => openComments(item.id)}
              onPostDeleted={(id) => setPosts(curr => curr.filter(p => p.id !== id))}
              onUserBlocked={(id) => setPosts(curr => curr.filter(p => p.author.id !== id))}
              onLikeToggled={handleLikeToggled}
              onReactRequest={(id) => {
                setReactingToPostId(id);
                if (onHideBottomBar) onHideBottomBar(true);
              }}
              onEditCaption={(id, text) => {
                setEditCaptionText(text);
                setEditingPost(id);
              }}
              onImageLongPress={() => setPopoutPost(item)} // ZOOM
            />
          </View>
        )}
      />

      <Modal visible={activeStory !== null} animationType="fade" transparent={true} onRequestClose={closeStory}>
        <View className="flex-1 bg-black">
          {activeStory?.dailyPostUrl && (
            <Image source={{ uri: activeStory.dailyPostUrl }} className="w-full h-full" resizeMode="cover" />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} className="absolute top-0 inset-x-0 h-40 pointer-events-none" />

          <View className="absolute flex-row w-full px-2" style={{ top: insets.top }}>
            <View className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden mx-1">
              <Animated.View style={{ width: storyProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), height: '100%', backgroundColor: 'white' }} />
            </View>
          </View>

          <View className="absolute flex-row items-center justify-between w-full px-4" style={{ top: insets.top + 16 }}>
             <View className="flex-row items-center gap-3">
               <View className="w-10 h-10 rounded-full border border-white/30 overflow-hidden bg-white/10">
                 {activeStory?.img && <Image source={{ uri: activeStory.img }} className="w-full h-full" />}
               </View>
               <Text className="text-white font-bold shadow-md">{activeStory?.name}</Text>
             </View>
             <TouchableOpacity onPress={closeStory} className="p-2"><Ionicons name="close" size={28} color="white" /></TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={1} onPress={closeStory} className="absolute inset-0 top-32 z-[-1]" />
        </View>
      </Modal>

      <SwipeableModal visible={activePostId !== null} onClose={() => setActivePostId(null)} title="Comments" heightRatio={0.65}>
        {loadingComments ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.8} onLongPress={() => handleCommentLongPress(item)} className="flex-row gap-3 mb-4">
                <View className="w-8 h-8 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.04]">
                  {item.user.profilePicUrl ? <Image source={{ uri: item.user.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white/60 text-xs font-semibold">{item.user.username.charAt(0).toUpperCase()}</Text>}
                </View>
                <View className="flex-1 bg-white/[0.03] p-3.5 rounded-2xl rounded-tl-sm border border-white/[0.04]">
                  {/* COLOR CHANGED HERE */}
                  <Text className="text-[#7dd3fc] text-[10px] font-bold mb-1 tracking-wider uppercase">{item.user.username}</Text>
                  <Text className="text-white/90 text-[13px] leading-5">{item.text}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className="text-white/20 text-center mt-10 text-xs">No comments yet.</Text>}
          />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.04)', backgroundColor: 'rgba(9,14,23,0.95)' }}>
          <TextInput value={newComment} onChangeText={setNewComment} placeholder="Add a comment..." placeholderTextColor="rgba(255,255,255,0.2)" keyboardAppearance="dark" style={{ flex: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 22, paddingHorizontal: 16, color: 'white', fontSize: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />
          <TouchableOpacity onPress={submitComment} disabled={!newComment.trim()} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: newComment.trim() ? '#7dd3fc' : 'rgba(255,255,255,0.04)' }}>
            <Ionicons name="arrow-up" size={20} color={newComment.trim() ? '#090E17' : 'rgba(255,255,255,0.15)'} />
          </TouchableOpacity>
        </View>
      </SwipeableModal>

      <Modal visible={reactingToPostId !== null} transparent={true} animationType="fade" onRequestClose={() => { setReactingToPostId(null); if (onHideBottomBar) onHideBottomBar(false); }}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          {reactingToPostId && <CameraScreen mode="reaction" onClose={() => { setReactingToPostId(null); if (onHideBottomBar) onHideBottomBar(false); }} onCapture={handleReactionCapture} />}
        </View>
      </Modal>

      {/* UNIFIED VIEWER MODAL */}
      <ImagePopoutModal 
        visible={popoutPost !== null} 
        post={popoutPost} 
        onClose={() => setPopoutPost(null)}
        onOpenComments={(id) => {
          setPopoutPost(null);
          setTimeout(() => openComments(id), 300);
        }}
        onReactRequest={(id) => {
          setPopoutPost(null);
          setTimeout(() => {
             setReactingToPostId(id);
             if (onHideBottomBar) onHideBottomBar(true);
          }, 300);
        }}
      />

    </Animated.View>
  );
}