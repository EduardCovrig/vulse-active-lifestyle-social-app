import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Animated, ActivityIndicator, Modal, Alert, FlatList, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import BouncyPressable from '../components/BouncyPressable';
import UserListModal from '../components/UserListModal';
import ImagePopoutModal from '../components/ImagePopoutModal';
import SwipeableModal from '../components/SwipeableModal';
import CalendarModal from '../components/CalendarModal';

const HEADER_HEIGHT = 180;
const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_GAP = 2;
const ITEM_WIDTH = (width - 4 - (GRID_GAP * 2)) / 3;

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { username: myUsername } = useContext(AuthContext);
  const { username } = route.params as { username: string };

  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [iHavePostedToday, setIHavePostedToday] = useState(false);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarSnaps, setCalendarSnaps] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any>(null);

  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, HEADER_HEIGHT],
    outputRange: [-50, 0, HEADER_HEIGHT * 0.5],
    extrapolate: 'clamp',
  });

  const profilePicScale = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes, circleRes] = await Promise.all([
        api.get(`/users/${username}/profile`),
        api.get(`/posts/user/${username}`),
        api.get('/users/circle')
      ]);
      setProfile(profileRes.data);
      setIsFollowing(profileRes.data.isFollowing || false);
      setUserPosts(postsRes.data || []);
      
      const me = circleRes.data.find((c: any) => c.isMe);
      setIHavePostedToday(me?.hasPosted || false);
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfileData(); }, [username]);

  const handleFollowUser = async () => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/users/${profile.id}/follow`);
      setIsFollowing(!isFollowing);
      setProfile((prev: any) => ({
        ...prev,
        followersCount: isFollowing ? Math.max(0, (prev.followersCount || 0) - 1) : (prev.followersCount || 0) + 1
      }));
    } catch (e) {}
  };

  const openFollowers = async () => {
    setShowFollowers(true); setLoadingLists(true);
    try { const res = await api.get(`/users/${username}/followers`); setFollowersList(res.data); } catch(e) {} finally { setLoadingLists(false); }
  };

  const openFollowing = async () => {
    setShowFollowing(true); setLoadingLists(true);
    try { const res = await api.get(`/users/${username}/following`); setFollowingList(res.data); } catch(e) {} finally { setLoadingLists(false); }
  };

  const openCalendar = async () => {
    setShowCalendar(true); setLoadingCalendar(true);
    try { const res = await api.get(`/users/${username}/calendar`); setCalendarSnaps(res.data); } catch(e) {} finally { setLoadingCalendar(false); }
  };

  const openComments = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const response = await api.get(`/comments/${postId}?page=0&size=50`);
      setComments(response.data.content);
    } catch (error) {} finally { setLoadingComments(false); }
  };

  const handleLikeToggled = (postId: string, newIsLiked: boolean) => {
    setUserPosts(curr => curr.map(p => p.id === postId ? { ...p, isLiked: newIsLiked, likesCount: newIsLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) } : p));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev: any) => ({ ...prev, isLiked: newIsLiked, likesCount: newIsLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1) }));
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activeCommentsPostId) return;
    const text = newComment;
    setNewComment('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post(`/comments/${activeCommentsPostId}`, { text });
      const response = await api.get(`/comments/${activeCommentsPostId}?page=0&size=50`);
      setComments(response.data.content);
      
      if (selectedPost && selectedPost.id === activeCommentsPostId) {
        setSelectedPost({ ...selectedPost, commentsCount: (selectedPost.commentsCount || 0) + 1 });
      }
      setUserPosts(curr => curr.map(p => p.id === activeCommentsPostId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
    } catch (error) {}
  };

  const isWithinLast24Hours = (dateStr: string) => {
    const postDate = new Date(dateStr).getTime();
    const now = Date.now();
    return (now - postDate) < 24 * 60 * 60 * 1000;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#090E17] items-center justify-center">
        <Animated.View style={{ opacity: pulseAnim }} className="w-24 h-24 rounded-full bg-[#7ad7c6]/20 items-center justify-center">
           <ActivityIndicator color="#7ad7c6" size="large" />
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#090E17]">
      <Animated.View style={{ transform: [{ translateY: headerTranslateY }], position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, zIndex: 1 }}>
        <LinearGradient colors={['rgba(122, 215, 198, 0.04)', 'transparent']} className="absolute inset-0" />
      </Animated.View>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingTop: insets.top + 10, paddingLeft: 20, zIndex: 50, position: 'absolute' }}>
        <View className="w-9 h-9 bg-white/[0.06] rounded-full items-center justify-center border border-white/[0.08]">
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
        </View>
      </TouchableOpacity>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + HEADER_HEIGHT * 0.4, paddingBottom: 100 }}
        className="z-10"
      >
        <View className="items-center px-6">
          <Animated.View style={{ transform: [{ scale: profilePicScale }] }} className="mb-3">
            <View className="p-[1.5px] rounded-full bg-white/15">
              <View className="w-[88px] h-[88px] rounded-full bg-[#0c1018] overflow-hidden items-center justify-center">
                {profile?.profilePicUrl ? <Image source={{ uri: profile.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white font-bold text-3xl">{profile?.username?.charAt(0).toUpperCase()}</Text>}
              </View>
            </View>
          </Animated.View>

          <Text className="text-white font-bold text-2xl tracking-tight mb-0.5">{profile?.username}</Text>
          <Text className="text-white/40 text-[13px] text-center max-w-[80%] mb-5">{profile?.bio || 'Living the active life'}</Text>

          <View className="flex-row items-center mb-5 bg-white/[0.02] py-2.5 px-2 rounded-[22px] border-[0.5px] border-white/[0.04] w-full">
            <BouncyPressable onPress={openFollowers} style={{ flex: 1 }} className="items-center">
              <Text className="text-white font-bold text-[16px]">{profile?.followersCount || 0}</Text>
              <Text className="text-white/30 text-[7.5px] font-bold tracking-[1.5px] uppercase mt-0.5">Followers</Text>
            </BouncyPressable>
            <View style={{ width: 0.5, height: 20, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <View style={{ flex: 1 }} className="items-center">
              <Text className="text-white font-bold text-[16px]">{userPosts.length}</Text>
              <Text className="text-white/30 text-[7.5px] font-bold tracking-[1.5px] uppercase mt-0.5">Posts</Text>
            </View>
            <View style={{ width: 0.5, height: 20, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <BouncyPressable onPress={openFollowing} style={{ flex: 1 }} className="items-center">
              <Text className="text-white font-bold text-[16px]">{profile?.followingCount || 0}</Text>
              <Text className="text-white/30 text-[7.5px] font-bold tracking-[1.5px] uppercase mt-0.5">Following</Text>
            </BouncyPressable>
          </View>

          {username !== myUsername && (
            <TouchableOpacity 
              onPress={handleFollowUser} 
              className={`px-8 py-2.5 rounded-full mb-8 ${isFollowing ? 'bg-white/[0.06] border border-white/[0.1]' : 'bg-[#7ad7c6]'}`}
              style={!isFollowing ? { shadowColor: '#7ad7c6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 10 } : {}}
            >
              <Text className={`font-bold text-sm tracking-wide ${isFollowing ? 'text-white/70' : 'text-[#090E17]'}`}>
                {isFollowing ? 'Following ✓' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="px-1">
          <View className="flex-row flex-wrap justify-start" style={{ gap: GRID_GAP }}>
             {userPosts.map((post) => {
               const isLocked = !iHavePostedToday && post.type === 'DAILY' && isWithinLast24Hours(post.createdAt);

               return (
                 <TouchableOpacity 
                   key={post.id} 
                   onPress={() => {
                     if (isLocked) {
                       Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                       Alert.alert("Locked 🔒", "Post your Daily Snap to unlock your friends' latest daily moments!");
                       return;
                     }
                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                     setSelectedPost(post);
                   }}
                   activeOpacity={0.8}
                   style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
                   className="bg-white/[0.03] rounded-lg overflow-hidden relative items-center justify-center"
                 >
                   <Image 
                     source={{ uri: post.mediaUrl }} 
                     className="absolute inset-0 w-full h-full" 
                     resizeMode="cover" 
                     blurRadius={isLocked ? 12 : 0}
                   />
                   
                   {isLocked && (
                     <View className="absolute inset-0 bg-black/40 items-center justify-center">
                       <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.9)" />
                     </View>
                   )}

                   <View className="absolute bottom-1.5 left-1.5 flex-row gap-1">
                     {post.calories && !isLocked && (
                        <View className="bg-black/40 rounded-full flex-row items-center px-1.5 py-0.5">
                          <Ionicons name="flame" size={7} color="#7ad7c6" />
                        </View>
                     )}
                     {post.type === 'REEL' && (
                        <View className="bg-black/40 rounded-full flex-row items-center px-1.5 py-0.5">
                          <Ionicons name="play" size={7} color="rgba(255,255,255,0.8)" />
                        </View>
                     )}
                   </View>
                 </TouchableOpacity>
               );
             })}
          </View>
        </View>
      </Animated.ScrollView>

      <CalendarModal 
        visible={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        loading={loadingCalendar} 
        snaps={calendarSnaps} 
        onSnapPress={(url) => {
           setShowCalendar(false);
           setTimeout(() => setSelectedPost({ mediaUrl: url }), 350); 
        }}
      />
      
      <UserListModal visible={showFollowers} onClose={() => setShowFollowers(false)} title="Followers" users={followersList} loading={loadingLists} onUserTap={(uid) => {}} />
      <UserListModal visible={showFollowing} onClose={() => setShowFollowing(false)} title="Following" users={followingList} loading={loadingLists} onUserTap={(uid) => {}} />

      {/* UNIFIED VIEWER MODAL */}
      <ImagePopoutModal 
        visible={selectedPost !== null} 
        post={selectedPost} 
        onLikeToggled={handleLikeToggled}
        onClose={() => setSelectedPost(null)} 
        onOpenComments={(id) => {
          setSelectedPost(null);
          setTimeout(() => openComments(id), 300);
        }}
      />

      {/* MODAL COMENTARII DIN UNIFIED VIEWER */}
      <SwipeableModal 
        visible={activeCommentsPostId !== null} 
        onClose={() => setActiveCommentsPostId(null)}
        title="Comments"
        heightRatio={0.65}
      >
        {loadingComments ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
            renderItem={({ item }) => (
              <View className="flex-row gap-3 mb-4">
                <View className="w-8 h-8 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.04]">
                  {item.user.profilePicUrl ? <Image source={{ uri: item.user.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white/60 text-xs font-semibold">{item.user.username.charAt(0).toUpperCase()}</Text>}
                </View>
                <View className="flex-1 bg-white/[0.03] p-3.5 rounded-2xl rounded-tl-sm border border-white/[0.04]">
                  <Text className="text-[#7dd3fc] text-[10px] font-bold mb-1 tracking-wider uppercase">{item.user.username}</Text>
                  <Text className="text-white/90 text-[13px] leading-5">{item.text}</Text>
                </View>
              </View>
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

    </View>
  );
}