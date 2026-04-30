import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, TextInput, Image, Dimensions, 
  Animated, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import BouncyPressable from '../components/BouncyPressable';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

// --- VULSE CIRCLE MOCK (Până când backend-ul va avea o rută dedicată pentru "Stories") ---
const circleFriends = [
  { id: '1', name: 'Your Daily', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', hasPosted: false, isMe: true },
  { id: '2', name: 'Alex', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80', hasPosted: true },
  { id: '3', name: 'Sarah', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', hasPosted: true },
];

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // --- STATE-URI PENTRU FEED (BACKEND REAL) ---
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lastTap = useRef<{ [key: string]: number }>({});

  // --- STATE-URI PENTRU COMENTARII ---
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // 1. FETCH FEED-UL DE LA SERVER
  const fetchFeed = async () => {
    try {
      const response = await api.get('/posts/feed?type=DAILY&page=0&size=20');
      // Backend-ul returneaza un Page<> de Spring Boot, deci array-ul e in "content"
      setPosts(response.data.content);
    } catch (error) {
      console.error("Eroare la fetch feed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    fetchFeed();
  }, []);

  // 2. LOGICA DE LIKE (Optimistic UI + Request)
  const toggleLike = async (postId: string, currentIsLiked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Update local instant (pentru UI rapid)
    setPosts(currentPosts => 
      currentPosts.map(p => p.id === postId ? {
        ...p,
        isLiked: !currentIsLiked,
        likesCount: currentIsLiked ? p.likesCount - 1 : p.likesCount + 1
      } : p)
    );

    // Request in spate catre server
    try {
      await api.post(`/interactions/${postId}/like`);
    } catch (error) {
      console.error("Eroare la like:", error);
      // Daca pica, poti da revert aici la state-ul anterior (optional)
    }
  };

  const handleDoubleTap = (postId: string, currentIsLiked: boolean) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap.current[postId] && (now - lastTap.current[postId] < DOUBLE_PRESS_DELAY)) {
      if (!currentIsLiked) {
        toggleLike(postId, currentIsLiked);
      }
    } else {
      lastTap.current[postId] = now;
    }
  };

  // 3. LOGICA PENTRU COMENTARII
  const openComments = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePostId(postId);
    setLoadingComments(true);
    
    try {
      const response = await api.get(`/comments/${postId}?page=0&size=50`);
      setComments(response.data.content);
    } catch (error) {
      console.error("Eroare la incarcare comentarii:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activePostId) return;
    
    const commentText = newComment;
    setNewComment(''); // Golim input-ul
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post(`/comments/${activePostId}`, { text: commentText });
      
      // Re-fetch comentariile ca sa apara
      const response = await api.get(`/comments/${activePostId}?page=0&size=50`);
      setComments(response.data.content);
      
      // Update local contorul de comentarii pe postare
      setPosts(currentPosts => 
        currentPosts.map(p => p.id === activePostId ? { ...p, commentsCount: p.commentsCount + 1 } : p)
      );
    } catch (error) {
      console.error("Eroare la postare comentariu:", error);
    }
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- BARA DE SEARCH --- */}
        <View className="px-6 mb-6">
          <BlurView intensity={50} tint="dark" className="flex-row items-center px-4 h-12 rounded-full border border-white/15 shadow-lg shadow-black/50">
            <Ionicons name="search" size={20} color="#bec8ce" />
            <TextInput 
              placeholder="Search friends, workouts..."
              placeholderTextColor="#bec8ce80"
              className="flex-1 ml-3 text-white font-body-md"
              keyboardAppearance="dark"
            />
          </BlurView>
        </View>

        {/* --- VULSE CIRCLE (MOCK PENTRU UI PANA VINE RUTA) --- */}
        <View className="mb-8">
          <Text className="text-secondary text-xs font-bold tracking-widest uppercase mb-4 px-6">Vulse Circle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
            {circleFriends.map((friend) => (
              <BouncyPressable key={friend.id} className="items-center" scaleTo={0.9}>
                <View className="relative w-16 h-16 rounded-full items-center justify-center mb-2">
                  {friend.hasPosted ? (
                    <LinearGradient colors={['#7ad7c6', '#7dd3fc']} className="absolute inset-0 rounded-full" style={{ padding: 2 }}>
                      <View className="flex-1 bg-background rounded-full border-2 border-background overflow-hidden">
                        <Image source={{ uri: friend.img }} className="w-full h-full" />
                      </View>
                    </LinearGradient>
                  ) : (
                    <View className="absolute inset-0 rounded-full border-2 border-white/10 p-0.5">
                      <View className="flex-1 rounded-full overflow-hidden opacity-50">
                        <Image source={{ uri: friend.img }} className="w-full h-full" />
                      </View>
                    </View>
                  )}
                  {friend.isMe && !friend.hasPosted && (
                    <View className="absolute bottom-0 right-0 bg-primary w-5 h-5 rounded-full items-center justify-center border-2 border-background">
                      <Ionicons name="add" size={12} color="#0b1326" />
                    </View>
                  )}
                </View>
                <Text className={`text-[10px] font-bold ${friend.hasPosted ? 'text-white' : 'text-on-surface-variant'}`}>{friend.name}</Text>
              </BouncyPressable>
            ))}
          </ScrollView>
        </View>

        {/* --- FEED-UL REAL (LATEST UPDATES) --- */}
        <View className="px-6">
          <Text className="text-secondary text-xs font-bold tracking-widest uppercase mb-4">Latest Updates</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#c5eaff" className="mt-10" />
          ) : posts.length === 0 ? (
            <Text className="text-on-surface-variant text-center mt-10">No updates from your friends yet.</Text>
          ) : (
            posts.map((post) => (
              <BlurView 
                key={post.id}
                intensity={40} 
                tint="dark" 
                className="rounded-[32px] border border-white/10 mb-6 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                {/* Header Post */}
                <View className="flex-row items-center justify-between p-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full border border-white/20 items-center justify-center bg-white/10 overflow-hidden">
                      {post.author.profilePicUrl ? (
                        <Image source={{ uri: post.author.profilePicUrl }} className="w-full h-full" />
                      ) : (
                        <Text className="text-white font-bold">{post.author.username.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    <View>
                      <Text className="text-white font-bold text-sm">{post.author.username}</Text>
                      <Text className="text-on-surface-variant text-[10px] uppercase tracking-wider mt-0.5">
                        {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity><Ionicons name="ellipsis-horizontal" size={20} color="#bec8ce" /></TouchableOpacity>
                </View>

                {/* Imagine Post cu Double Tap */}
                <BouncyPressable onPress={() => handleDoubleTap(post.id, post.isLiked)}>
                  <View className="w-full h-80 bg-black/40 relative">
                    <Image source={{ uri: post.mediaUrl }} className="w-full h-full" resizeMode="cover" />
                    {/* Daca are camera frontala (BeReal style) */}
                    {post.frontMediaUrl && (
                      <View className="absolute top-4 left-4 w-24 h-32 rounded-2xl border-2 border-white/50 overflow-hidden shadow-lg">
                         <Image source={{ uri: post.frontMediaUrl }} className="w-full h-full" resizeMode="cover" />
                      </View>
                    )}
                  </View>
                </BouncyPressable>

                {/* Footer / Actiuni */}
                <View className="p-4">
                  {post.caption && (
                    <Text className="text-white/90 font-body-md text-sm leading-6 mb-4">{post.caption}</Text>
                  )}
                  
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row gap-4">
                      {/* BUTON LIKE REAL */}
                      <TouchableOpacity 
                        className="flex-row items-center gap-1.5" 
                        onPress={() => toggleLike(post.id, post.isLiked)}
                      >
                        <Ionicons name={post.isLiked ? "heart" : "heart-outline"} size={22} color={post.isLiked ? "#ff4b4b" : "#bec8ce"} />
                        <Text className={`font-bold text-xs ${post.isLiked ? 'text-white' : 'text-on-surface-variant'}`}>
                          {post.likesCount}
                        </Text>
                      </TouchableOpacity>

                      {/* BUTON COMMENT REAL */}
                      <TouchableOpacity 
                        className="flex-row items-center gap-1.5" 
                        onPress={() => openComments(post.id)}
                      >
                        <Ionicons name="chatbubble-outline" size={20} color="#bec8ce" />
                        <Text className="text-on-surface-variant font-bold text-xs">{post.commentsCount}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </BlurView>
            ))
          )}
        </View>
      </ScrollView>

      {/* =========================================
          MODALUL DE COMENTARII (BOTTOM SHEET)
          ========================================= */}
      <Modal
        visible={activePostId !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActivePostId(null)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" onPress={() => setActivePostId(null)} />
          
          <BlurView intensity={90} tint="dark" className="h-[60%] rounded-t-[40px] border-t border-white/20 p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
            <View className="w-12 h-1.5 bg-white/30 rounded-full self-center mb-6" />
            <Text className="text-white font-bold text-lg mb-4 text-center">Comments</Text>

            {loadingComments ? (
               <ActivityIndicator color="#c5eaff" className="mt-10" />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="flex-row gap-3 mb-4">
                    <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                      {item.user.profilePicUrl ? (
                         <Image source={{ uri: item.user.profilePicUrl }} className="w-full h-full" />
                      ) : (
                         <Text className="text-white text-xs font-bold">{item.user.username.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    <View className="flex-1 bg-white/5 p-3 rounded-2xl rounded-tl-sm border border-white/5">
                      <Text className="text-white/60 text-[10px] font-bold mb-1">{item.user.username}</Text>
                      <Text className="text-white text-sm leading-5">{item.text}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text className="text-on-surface-variant text-center mt-10">Be the first to comment.</Text>}
              />
            )}

            {/* INPUT PENTRU COMENTARIU NOU */}
            <View className="flex-row items-center gap-3 mt-4 pt-2">
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor="#bec8ce80"
                keyboardAppearance="dark"
                className="flex-1 h-12 bg-black/40 rounded-full px-5 text-white border border-white/10"
              />
              <TouchableOpacity 
                onPress={submitComment}
                disabled={!newComment.trim()}
                className={`w-12 h-12 rounded-full items-center justify-center ${newComment.trim() ? 'bg-primary' : 'bg-white/10'}`}
              >
                <Ionicons name="arrow-up" size={20} color={newComment.trim() ? '#0b1326' : '#ffffff80'} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

    </Animated.View>
  );
}