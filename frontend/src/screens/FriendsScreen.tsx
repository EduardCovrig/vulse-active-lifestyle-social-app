import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, Text, TextInput, Image, Animated, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, RefreshControl, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import BouncyPressable from '../components/BouncyPressable';
import LiquidPostCard from '../components/LiquidPostCard'; 
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';

interface FriendsScreenProps {
  onOpenCamera?: () => void;
}

export default function FriendsScreen({ onOpenCamera }: FriendsScreenProps) {
  const insets = useSafeAreaInsets();
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

  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editCaptionText, setEditCaptionText] = useState('');

  const [activeStory, setActiveStory] = useState<any>(null);
  const storyProgress = useRef(new Animated.Value(0)).current;

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
    } catch (e) { 
      console.error("Eroare search:", e); 
    }
  };

  const openUserProfile = async (targetUsername: string) => {
    if (targetUsername === myUsername) {
      Alert.alert("Ești tu!", "Mergi în tab-ul de profil pentru a-ți vedea datele.");
      return; 
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss(); 
    setSearchQuery(''); 
    setSearchResults([]); 
    
    setLoadingProfile(true);
    setViewedProfile({ username: targetUsername, followersCount: 0, followingCount: 0, bio: '' }); 
    
    try {
      const res = await api.get(`/users/${encodeURIComponent(targetUsername)}/profile`);
      if (res.data) setViewedProfile(res.data); 
    } catch (e: any) {
      console.error("Eroare Backend Profil:", e.response?.data || e.message);
      
      if (e.response?.status === 500) {
         Alert.alert(
           "Atenție (Backend Issue)", 
           "Serverul a returnat o eroare internă la calcularea statisticilor acestui profil, dar funcția de frontend este activă."
         );
      } else {
         Alert.alert("Indisponibil", e.response?.data?.message || "Utilizatorul nu a putut fi găsit.");
         setViewedProfile(null);
      }
    } finally { 
      setLoadingProfile(false); 
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
      fetchData(); 
    } catch (e) { Alert.alert("Eroare", "Nu am putut actualiza statusul."); }
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
    } catch (error) {}
  };

  const handleCommentLongPress = (comment: any) => {
    if (comment.user.username !== myUsername) return; 
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

  const saveCaptionEdit = async (postId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await api.patch(`/posts/${postId}/caption?caption=${encodeURIComponent(editCaptionText)}`);
      setPosts(curr => curr.map(p => p.id === postId ? { ...p, caption: editCaptionText } : p));
      setEditingPost(null);
    } catch(e) { Alert.alert("Eroare", "Nu am putut actualiza descrierea."); }
  };

  const handleOpenStory = (friend: any) => {
    if (!friend.hasPosted || !friend.img) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveStory(friend);
    
    storyProgress.setValue(0);
    Animated.timing(storyProgress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) setActiveStory(null);
    });
  };

  const closeStory = () => {
    storyProgress.stopAnimation();
    setActiveStory(null);
  };

  // Vulse Circle 
  const renderCircleHeader = () => (
    <View className="mb-4 mt-2">
      <Text className="text-[#7ad7c6] text-[10px] font-black tracking-[3px] uppercase mb-4 px-6">Daily Circle</Text>
      <FlatList 
        horizontal
        data={circle}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
        renderItem={({ item }) => (
          <BouncyPressable 
            className="items-center" 
            scaleTo={0.9} 
            onPress={() => {
              if (item.isMe && !item.hasPosted) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (onOpenCamera) onOpenCamera();
              } else {
                handleOpenStory(item);
              }
            }}
          >
            <View className="relative w-16 h-16 rounded-full items-center justify-center mb-2 shadow-lg shadow-black">
              {item.hasPosted ? (
                <LinearGradient colors={['#7ad7c6', '#7dd3fc']} className="absolute inset-0 rounded-full" style={{ padding: 2 }}>
                  <View className="flex-1 bg-[#090E17] rounded-full border-[3px] border-[#090E17] overflow-hidden">
                    {item.img ? <Image source={{ uri: item.img }} className="w-full h-full object-cover" /> : <View className="w-full h-full bg-white/10" />}
                  </View>
                </LinearGradient>
              ) : (
                <View className="absolute inset-0 rounded-full border-2 border-white/10 p-0.5">
                  <View className="flex-1 rounded-full overflow-hidden opacity-40 bg-white/5">
                    {item.img ? <Image source={{ uri: item.img }} className="w-full h-full object-cover" /> : null}
                  </View>
                </View>
              )}
              {item.isMe && !item.hasPosted && (
                <View className="absolute bottom-0 right-0 bg-[#7dd3fc] w-5 h-5 rounded-full items-center justify-center border-2 border-[#090E17]">
                  <Ionicons name="add" size={12} color="#090E17" />
                </View>
              )}
            </View>
            <Text className={`text-[10px] font-bold text-center w-16 ${item.hasPosted ? 'text-white' : 'text-white/40'}`} numberOfLines={1}>
              {item.name}
            </Text>
          </BouncyPressable>
        )}
      />
      <Text className="text-secondary text-[10px] font-black tracking-[3px] uppercase mb-4 px-6 mt-6">Latest Updates</Text>
    </View>
  );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: '#090E17' }}>
      {/* SEARCH BAR */ }
      <View className="px-6 mb-2 z-[200]" style={{ paddingTop: insets.top + 10 }}>
        <BlurView intensity={50} tint="dark" className="flex-row items-center px-4 h-12 rounded-full border border-white/15 shadow-lg shadow-black/50 bg-white/5">
          <Ionicons name="search" size={20} color="#bec8ce" />
          <TextInput 
            placeholder="Search friends..." 
            placeholderTextColor="#bec8ce80" 
            className="flex-1 ml-3 text-white font-body-md" 
            keyboardAppearance="dark" 
            value={searchQuery} 
            onChangeText={handleSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); Keyboard.dismiss(); }}>
              <Ionicons name="close-circle" size={20} color="#bec8ce80" />
            </TouchableOpacity>
          )}
        </BlurView>

        {/* SEARCH RESULTS ABSOLUTE (Over the feed) */}
        {searchResults.length > 0 && (
          <BlurView intensity={95} tint="dark" className="mt-2 rounded-2xl border border-white/20 p-2 overflow-hidden shadow-2xl absolute top-[60px] left-6 right-6 z-[300]">
            {searchResults.map(u => (
              <TouchableOpacity key={u.id} onPress={() => openUserProfile(u.username)} className="flex-row items-center justify-between p-3 border-b border-white/10">
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center overflow-hidden border border-white/5">
                    {u.profilePicUrl ? <Image source={{ uri: u.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white font-bold">{u.username.charAt(0).toUpperCase()}</Text>}
                  </View>
                  <Text className="text-white font-bold tracking-wider">{u.username}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="gray" />
              </TouchableOpacity>
            ))}
          </BlurView>
        )}
      </View>

      {/* FEED LIST */}
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderCircleHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7dd3fc" />}
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color="#7dd3fc" className="mt-20" /> : <Text className="text-white/40 text-center mt-20">Nicio postare în cercul tău astăzi.</Text>
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
              onOpenComments={() => openComments(item.id)}
              onPostDeleted={(id) => setPosts(curr => curr.filter(p => p.id !== id))}
              onUserBlocked={(id) => setPosts(curr => curr.filter(p => p.author.id !== id))}
              onEditCaption={(id, text) => {
                setEditCaptionText(text);
                setEditingPost(id);
              }}
            />
          </View>
        )}
      />

      {/* STORY VIEWER MODAL */}
      <Modal visible={activeStory !== null} animationType="fade" transparent={true} onRequestClose={closeStory}>
        <View className="flex-1 bg-black">
          {activeStory?.img && (
            <Image source={{ uri: activeStory.img }} className="w-full h-full" resizeMode="cover" />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} className="absolute top-0 inset-x-0 h-40 pointer-events-none" />

          <View className="absolute flex-row w-full px-2" style={{ top: insets.top }}>
            <View className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden mx-1">
              <Animated.View 
                style={{ 
                  width: storyProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  height: '100%',
                  backgroundColor: 'white'
                }} 
              />
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

      {/* MODAL COMMENTS */}
      <Modal visible={activePostId !== null} animationType="slide" transparent={true} onRequestClose={() => setActivePostId(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1 bg-black/40" onPress={() => setActivePostId(null)} />
          <BlurView intensity={90} tint="dark" className="h-[60%] rounded-t-[40px] border-t border-white/10 p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] overflow-hidden">
            <View className="absolute inset-0 bg-[#090E17]/60" />
            
            <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6" />
            <Text className="text-white font-black text-xl mb-1 text-center tracking-tight">Comments</Text>
            <Text className="text-white/30 text-[10px] text-center mb-6 uppercase tracking-[2px]">Tine apăsat pe comentariul tău pentru a-l șterge</Text>

            {loadingComments ? (
               <ActivityIndicator color="#7dd3fc" className="mt-10" />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity activeOpacity={0.8} onLongPress={() => handleCommentLongPress(item)} className="flex-row gap-3 mb-5">
                    <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center overflow-hidden border border-white/5">
                      {item.user.profilePicUrl ? <Image source={{ uri: item.user.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white text-xs font-bold">{item.user.username.charAt(0).toUpperCase()}</Text>}
                    </View>
                    <View className="flex-1 bg-white/[0.03] p-3.5 rounded-2xl rounded-tl-sm border border-white/5 shadow-sm">
                      <Text className="text-white/40 text-[10px] font-bold mb-1 tracking-wider uppercase">{item.user.username}</Text>
                      <Text className="text-white/90 text-sm leading-5">{item.text}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text className="text-white/30 text-center mt-10">Nu sunt comentarii încă.</Text>}
              />
            )}

            <View className="flex-row items-center gap-3 mt-4 pt-2 border-t border-white/5">
              <TextInput value={newComment} onChangeText={setNewComment} placeholder="Add a comment..." placeholderTextColor="rgba(255,255,255,0.3)" keyboardAppearance="dark" className="flex-1 h-12 bg-white/5 rounded-full px-5 text-white border border-white/10" />
              <TouchableOpacity onPress={submitComment} disabled={!newComment.trim()} className={`w-12 h-12 rounded-full items-center justify-center shadow-lg ${newComment.trim() ? 'bg-[#7dd3fc]' : 'bg-white/5'}`}>
                <Ionicons name="arrow-up" size={20} color={newComment.trim() ? '#090E17' : 'rgba(255,255,255,0.2)'} />
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL PROFIL */}
      <Modal visible={viewedProfile !== null} animationType="slide" transparent={true} onRequestClose={() => setViewedProfile(null)}>
        <BlurView intensity={90} tint="dark" className="flex-1 p-6 justify-center">
          <View className="absolute inset-0 bg-[#090E17]/40" />
          <TouchableOpacity onPress={() => setViewedProfile(null)} className="absolute top-16 right-6 z-50 bg-white/10 p-2 rounded-full border border-white/10">
             <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {loadingProfile || !viewedProfile?.id ? (
            <ActivityIndicator size="large" color="#7dd3fc" />
          ) : (
            <View className="items-center bg-[#06090E] p-8 rounded-[40px] border border-white/10 shadow-2xl">
              <View className="w-24 h-24 rounded-full border border-white/20 mb-4 bg-white/10 items-center justify-center overflow-hidden">
                {viewedProfile.profilePicUrl ? (
                  <Image source={{ uri: viewedProfile.profilePicUrl }} className="w-full h-full" />
                ) : (
                  <Ionicons name="person" size={40} color="#7dd3fc" />
                )}
              </View>
              <Text className="text-3xl font-extrabold text-white mb-2">{viewedProfile.username}</Text>
              <Text className="text-white/60 text-center mb-6">{viewedProfile.bio || 'No bio yet.'}</Text>
              
              <View className="flex-row gap-8 mb-8">
                <View className="items-center"><Text className="text-white font-bold text-xl">{viewedProfile.followersCount}</Text><Text className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Followers</Text></View>
                <View className="items-center"><Text className="text-white font-bold text-xl">{viewedProfile.followingCount}</Text><Text className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Following</Text></View>
              </View>

              <TouchableOpacity 
                onPress={() => handleFollow(viewedProfile.id)}
                className={`w-full py-4 rounded-2xl items-center ${viewedProfile.isFollowing ? 'bg-white/10 border border-white/20' : 'bg-[#7ad7c6] shadow-[0_0_15px_rgba(122,215,198,0.3)]'}`}
              >
                <Text className={`font-black tracking-wider text-lg ${viewedProfile.isFollowing ? 'text-white' : 'text-[#090E17]'}`}>
                  {viewedProfile.isFollowing ? 'UNFOLLOW' : 'FOLLOW'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </Modal>

    </Animated.View>
  );
}