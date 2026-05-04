import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TextInput, Image, Animated, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import BouncyPressable from '../components/BouncyPressable';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const circleFriends = [
  { id: '1', name: 'Your Daily', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', hasPosted: false, isMe: true },
  { id: '2', name: 'Alex', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80', hasPosted: true },
  { id: '3', name: 'Sarah', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', hasPosted: true },
];

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { username } = useContext(AuthContext);

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lastTap = useRef<{ [key: string]: number }>({});

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editCaptionText, setEditCaptionText] = useState('');

  const fetchFeed = async () => {
    try {
      const response = await api.get('/posts/feed?type=DAILY&page=0&size=20');
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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) return setSearchResults([]);
    try {
      const res = await api.get(`/users/search?query=${query}`);
      setSearchResults(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post(`/users/${userId}/follow`);
      
      if (viewedProfile && viewedProfile.id === userId) {
        setViewedProfile({ 
          ...viewedProfile, 
          isFollowing: !viewedProfile.isFollowing,
          followersCount: viewedProfile.isFollowing ? viewedProfile.followersCount - 1 : viewedProfile.followersCount + 1
        });
      }
      fetchFeed(); 
    } catch (e) {
      Alert.alert("Eroare", "Nu am putut actualiza statusul.");
    }
  };

  const openUserProfile = async (targetUsername: string) => {
    if (targetUsername === username) return; 
    setSearchQuery('');
    setSearchResults([]);
    setLoadingProfile(true);
    setViewedProfile({ username: targetUsername }); 
    
    try {
      const res = await api.get(`/users/${targetUsername}/profile`);
      setViewedProfile(res.data);
    } catch (e: any) {
      Alert.alert("Indisponibil", "Acest profil nu poate fi vizualizat.");
      setViewedProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const toggleLike = async (postId: string, currentIsLiked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosts(curr => curr.map(p => p.id === postId ? { ...p, isLiked: !currentIsLiked, likesCount: currentIsLiked ? p.likesCount - 1 : p.likesCount + 1 } : p));
    try { await api.post(`/interactions/${postId}/like`); } catch (e) { console.error(e); }
  };

  const handleDoubleTap = (postId: string, currentIsLiked: boolean) => {
    const now = Date.now();
    if (lastTap.current[postId] && (now - lastTap.current[postId] < 300)) {
      if (!currentIsLiked) toggleLike(postId, currentIsLiked);
    } else {
      lastTap.current[postId] = now;
    }
  };

  const openComments = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePostId(postId);
    setLoadingComments(true);
    try {
      const response = await api.get(`/comments/${postId}?page=0&size=50`);
      setComments(response.data.content);
    } catch (error) {
      console.error(error);
    } finally { 
      setLoadingComments(false); 
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
    } catch (error) {
      console.error(error);
    }
  };

  const handleCommentLongPress = (comment: any) => {
    if (comment.user.username !== username) return; 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Comment", "Vrei să ștergi acest comentariu?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/comments/${comment.id}`);
          setComments(curr => curr.filter(c => c.id !== comment.id));
          setPosts(curr => curr.map(p => p.id === activePostId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
        } catch (e) { Alert.alert("Eroare", "Nu am putut șterge comentariul."); }
      }}
    ]);
  };

  const handlePostOptions = (post: any) => {
    const isMyPost = post.author.username === username;
    const options: any[] = [{ text: "Cancel", style: "cancel" }];

    if (isMyPost) {
      options.push({ text: "Edit Caption", onPress: () => {
        setEditCaptionText(post.caption || '');
        setEditingPost(post.id);
      }});

      options.push({ text: "Delete Post", style: "destructive", onPress: async () => {
          Alert.alert("Ești sigur?", "Postarea va fi ștearsă definitiv.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                try {
                  await api.delete(`/posts/${post.id}`);
                  setPosts(curr => curr.filter(p => p.id !== post.id));
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) {
                  Alert.alert("Eroare", "Nu am putut șterge postarea.");
                }
              }
            }
          ]);
      }});
    } else {
      options.push({ text: "Report Post", style: "destructive", onPress: async () => {
          await api.post(`/safety/report/post/${post.id}`, { reason: "Inappropriate content" });
          Alert.alert("Reported", "Un admin va verifica această postare.");
      }});
      
      options.push({ text: `Block ${post.author.username}`, style: "destructive", onPress: async () => {
          Alert.alert("Block User", `Ești sigur că vrei să blochezi pe ${post.author.username}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Block", style: "destructive", onPress: async () => {
                try {
                  await api.post(`/safety/block/${post.author.id}`);
                  setPosts(curr => curr.filter(p => p.author.id !== post.author.id)); 
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch(e) {
                  Alert.alert("Eroare", "Nu am putut bloca utilizatorul.");
                }
            }}
          ]);
      }});
    }

    if (post.calories) {
      options.push({ text: "Save Meal to Nutrition Log", onPress: async () => {
          await api.post(`/nutrition/${post.id}/save`);
          Alert.alert("Saved", "Masa a fost adăugată în tracker-ul tău zilnic.");
      }});
    }

    Alert.alert("Options", "What would you like to do?", options);
  };

  const saveCaptionEdit = async (postId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await api.patch(`/posts/${postId}/caption?caption=${encodeURIComponent(editCaptionText)}`);
      setPosts(curr => curr.map(p => p.id === postId ? { ...p, caption: editCaptionText } : p));
      setEditingPost(null);
    } catch(e) { 
      Alert.alert("Eroare", "Nu am putut actualiza descrierea."); 
    }
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* BARA DE SEARCH */}
        <View className="px-6 mb-6 z-50">
          <BlurView intensity={50} tint="dark" className="flex-row items-center px-4 h-12 rounded-full border border-white/15 shadow-lg shadow-black/50">
            <Ionicons name="search" size={20} color="#bec8ce" />
            <TextInput 
              placeholder="Search friends..." 
              placeholderTextColor="#bec8ce80" 
              className="flex-1 ml-3 text-white font-body-md" 
              keyboardAppearance="dark" 
              value={searchQuery} 
              onChangeText={handleSearch} 
            />
          </BlurView>

          {/* REZULTATE CĂUTARE */}
          {searchResults.length > 0 && (
            <BlurView intensity={80} tint="dark" className="mt-2 rounded-2xl border border-white/20 p-2 overflow-hidden shadow-2xl absolute top-14 left-6 right-6 z-50">
              {searchResults.map(u => (
                <TouchableOpacity key={u.id} onPress={() => openUserProfile(u.username)} className="flex-row items-center justify-between p-3 border-b border-white/10">
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                      {u.profilePicUrl ? <Image source={{ uri: u.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white font-bold">{u.username.charAt(0).toUpperCase()}</Text>}
                    </View>
                    <Text className="text-white font-bold">{u.username}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="gray" />
                </TouchableOpacity>
              ))}
            </BlurView>
          )}
        </View>

        {/* VULSE CIRCLE (STORIES) */}
        <View className="mb-8 mt-2">
          <Text className="text-secondary text-xs font-bold tracking-widest uppercase mb-4 px-6">Vulse Circle</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
            {circleFriends.map((friend) => (
              <BouncyPressable key={friend.id} className="items-center" scaleTo={0.9} onPress={() => Alert.alert("Stories", "Aici se vor afișa postările efemere.")}>
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

        {/* FEED REAL (LATEST UPDATES) */}
        <View className="px-6">
          <Text className="text-secondary text-xs font-bold tracking-widest uppercase mb-4">Latest Updates</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#c5eaff" className="mt-10" />
          ) : posts.length === 0 ? (
            <Text className="text-on-surface-variant text-center mt-10">Încă nu sunt postări aici.</Text>
          ) : (
            posts.map((post) => (
              <BlurView key={post.id} intensity={40} tint="dark" className="rounded-[32px] border border-white/10 mb-6 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                
                {/* Header Post */}
                <View className="flex-row items-center justify-between p-4">
                  <TouchableOpacity onPress={() => openUserProfile(post.author.username)} className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                      {post.author.profilePicUrl ? <Image source={{ uri: post.author.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white font-bold">{post.author.username.charAt(0).toUpperCase()}</Text>}
                    </View>
                    <View>
                      <Text className="text-white font-bold text-sm">{post.author.username}</Text>
                      <Text className="text-on-surface-variant text-[10px] uppercase tracking-wider mt-0.5">
                        {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handlePostOptions(post)} className="p-2">
                    <Ionicons name="ellipsis-horizontal" size={20} color="#bec8ce" />
                  </TouchableOpacity>
                </View>

                {/* Imagine + BeReal Dual Cam */}
                <BouncyPressable onPress={() => handleDoubleTap(post.id, post.isLiked)}>
                  <View className="w-full h-80 bg-black/40 relative">
                    <Image source={{ uri: post.mediaUrl }} className="w-full h-full" resizeMode="cover" />
                    {post.frontMediaUrl && (
                      <View className="absolute top-4 left-4 w-24 h-32 rounded-2xl border-2 border-white/50 overflow-hidden shadow-lg">
                         <Image source={{ uri: post.frontMediaUrl }} className="w-full h-full" resizeMode="cover" />
                      </View>
                    )}
                  </View>
                </BouncyPressable>

                {/* Footer Actiuni */}
                <View className="p-4">
                  
                  {/* EDIT CAPTION SAU AFIȘARE CAPTION */}
                  {editingPost === post.id ? (
                    <View className="flex-row items-center bg-black/50 rounded-2xl border border-white/20 mb-4 overflow-hidden pr-2">
                      <TextInput 
                        autoFocus 
                        className="flex-1 text-white p-3 font-body-md" 
                        value={editCaptionText} 
                        onChangeText={setEditCaptionText} 
                        placeholder="Scrie ceva..." 
                        placeholderTextColor="#ccc"
                      />
                      <TouchableOpacity className="bg-primary/20 p-2 rounded-full" onPress={() => saveCaptionEdit(post.id)}>
                        <Ionicons name="checkmark" size={20} color="#7dd3fc" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    post.caption ? <Text className="text-white/90 font-body-md text-sm leading-6 mb-4">{post.caption}</Text> : null
                  )}
                  
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row gap-4">
                      <TouchableOpacity className="flex-row items-center gap-1.5" onPress={() => toggleLike(post.id, post.isLiked)}>
                        <Ionicons name={post.isLiked ? "heart" : "heart-outline"} size={22} color={post.isLiked ? "#ff4b4b" : "#bec8ce"} />
                        <Text className={`font-bold text-xs ${post.isLiked ? 'text-white' : 'text-on-surface-variant'}`}>{post.likesCount}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity className="flex-row items-center gap-1.5" onPress={() => openComments(post.id)}>
                        <Ionicons name="chatbubble-outline" size={20} color="#bec8ce" />
                        <Text className="text-on-surface-variant font-bold text-xs">{post.commentsCount}</Text>
                      </TouchableOpacity>
                    </View>

                    {post.calories && (
                      <TouchableOpacity onPress={() => handlePostOptions(post)} className="bg-secondary/20 border border-secondary/30 rounded-full px-3 py-1 flex-row items-center gap-1">
                        <Ionicons name="flame" size={12} color="#7ad7c6" />
                        <Text className="text-secondary font-black text-xs">{post.calories} kcal</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

              </BlurView>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL COMENTARII */}
      <Modal visible={activePostId !== null} animationType="slide" transparent={true} onRequestClose={() => setActivePostId(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1" onPress={() => setActivePostId(null)} />
          <BlurView intensity={90} tint="dark" className="h-[60%] rounded-t-[40px] border-t border-white/20 p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
            <View className="w-12 h-1.5 bg-white/30 rounded-full self-center mb-6" />
            <Text className="text-white font-bold text-lg mb-2 text-center">Comments</Text>
            <Text className="text-white/40 text-[10px] text-center mb-4 uppercase tracking-wider">Tine apăsat pe comentariul tău pentru a-l șterge</Text>

            {loadingComments ? (
               <ActivityIndicator color="#c5eaff" className="mt-10" />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    activeOpacity={0.8} 
                    onLongPress={() => handleCommentLongPress(item)} 
                    className="flex-row gap-3 mb-4"
                  >
                    <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                      {item.user.profilePicUrl ? <Image source={{ uri: item.user.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white text-xs font-bold">{item.user.username.charAt(0).toUpperCase()}</Text>}
                    </View>
                    <View className="flex-1 bg-white/5 p-3 rounded-2xl rounded-tl-sm border border-white/5">
                      <Text className="text-white/60 text-[10px] font-bold mb-1">{item.user.username}</Text>
                      <Text className="text-white text-sm leading-5">{item.text}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text className="text-on-surface-variant text-center mt-10">Nu sunt comentarii încă.</Text>}
              />
            )}

            <View className="flex-row items-center gap-3 mt-4 pt-2">
              <TextInput value={newComment} onChangeText={setNewComment} placeholder="Add a comment..." placeholderTextColor="#bec8ce80" keyboardAppearance="dark" className="flex-1 h-12 bg-black/40 rounded-full px-5 text-white border border-white/10" />
              <TouchableOpacity onPress={submitComment} disabled={!newComment.trim()} className={`w-12 h-12 rounded-full items-center justify-center ${newComment.trim() ? 'bg-primary' : 'bg-white/10'}`}>
                <Ionicons name="arrow-up" size={20} color={newComment.trim() ? '#0b1326' : '#ffffff80'} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL PROFIL UTILIZATOR ALTUL (NOU) */}
      <Modal visible={viewedProfile !== null} animationType="slide" transparent={true} onRequestClose={() => setViewedProfile(null)}>
        <BlurView intensity={90} tint="dark" className="flex-1 p-6 justify-center">
          <TouchableOpacity onPress={() => setViewedProfile(null)} className="absolute top-16 right-6 z-50 bg-white/10 p-2 rounded-full">
             <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {loadingProfile || !viewedProfile?.id ? (
            <ActivityIndicator size="large" color="#c5eaff" />
          ) : (
            <View className="items-center bg-surface/80 p-8 rounded-[40px] border border-white/10 shadow-2xl">
              <View className="w-24 h-24 rounded-full border border-white/20 mb-4 bg-white/10 items-center justify-center overflow-hidden">
                {viewedProfile.profilePicUrl ? (
                  <Image source={{ uri: viewedProfile.profilePicUrl }} className="w-full h-full" />
                ) : (
                  <Ionicons name="person" size={40} color="#7dd3fc" />
                )}
              </View>
              <Text className="text-3xl font-extrabold text-white mb-2">{viewedProfile.username}</Text>
              <Text className="text-on-surface-variant text-center mb-6">{viewedProfile.bio || 'No bio yet.'}</Text>
              
              <View className="flex-row gap-8 mb-8">
                <View className="items-center"><Text className="text-white font-bold text-xl">{viewedProfile.followersCount}</Text><Text className="text-white/50 text-xs">Followers</Text></View>
                <View className="items-center"><Text className="text-white font-bold text-xl">{viewedProfile.followingCount}</Text><Text className="text-white/50 text-xs">Following</Text></View>
              </View>

              <TouchableOpacity 
                onPress={() => handleFollow(viewedProfile.id)}
                className={`w-full py-4 rounded-2xl items-center ${viewedProfile.isFollowing ? 'bg-white/10 border border-white/20' : 'bg-primary shadow-[0_0_15px_rgba(197,234,255,0.3)]'}`}
              >
                <Text className={`font-bold text-lg ${viewedProfile.isFollowing ? 'text-white' : 'text-[#0b1326]'}`}>
                  {viewedProfile.isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </Modal>

    </Animated.View>
  );
}