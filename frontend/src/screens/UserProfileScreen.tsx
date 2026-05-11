import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Animated, ActivityIndicator, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import BouncyPressable from '../components/BouncyPressable';
import LiquidPostCard from '../components/LiquidPostCard';
import UserListModal from '../components/UserListModal';
import ImagePopoutModal from '../components/ImagePopoutModal';

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
  
  // Status-ul tau (daca ai postat azi)
  const [iHavePostedToday, setIHavePostedToday] = useState(false);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

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
      // Tragem datele profilului + log-ul tau zilnic (ca sa vedem daca ai postat)
      const [profileRes, postsRes, circleRes] = await Promise.all([
        api.get(`/users/${username}/profile`),
        api.get(`/posts/user/${username}`),
        api.get('/users/circle') // Folosim asta ca sa aflam statusul tau
      ]);
      setProfile(profileRes.data);
      setIsFollowing(profileRes.data.isFollowing || false);
      setUserPosts(postsRes.data || []);
      
      const me = circleRes.data.find((c: any) => c.isMe);
      setIHavePostedToday(me?.hasPosted || false);

    } catch (error: any) {
      console.log("UserProfile error:", error.response?.data || error.message);
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
        followersCount: isFollowing 
          ? Math.max(0, (prev.followersCount || 0) - 1) 
          : (prev.followersCount || 0) + 1
      }));
    } catch (e) {
      console.log("Error following");
    }
  };

  const openFollowers = async () => {
    setShowFollowers(true);
    setLoadingLists(true);
    try {
      const res = await api.get(`/users/${username}/followers`);
      setFollowersList(res.data);
    } catch(e) {} finally { setLoadingLists(false); }
  };

  const openFollowing = async () => {
    setShowFollowing(true);
    setLoadingLists(true);
    try {
      const res = await api.get(`/users/${username}/following`);
      setFollowingList(res.data);
    } catch(e) {} finally { setLoadingLists(false); }
  };

  // Helper pentru a verifica daca o postare e mai veche de 24h
  const isWithinLast24Hours = (dateStr: string) => {
    const postDate = new Date(dateStr).getTime();
    const now = Date.now();
    return (now - postDate) < 24 * 60 * 60 * 1000;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#090E17] items-center justify-center">
        <ActivityIndicator color="#7ad7c6" size="large" />
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
        {/* Profile Info */}
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

        {/* 3 Column Grid */}
        <View className="px-1">
          <View className="flex-row flex-wrap justify-start" style={{ gap: GRID_GAP }}>
             {userPosts.map((post) => {
               // VERIFICARE LOGICA PENTRU LOCK
               // Se blocheaza doar daca: tu nu ai postat azi + postarea prietenului e DAILY + pusa in ultimele 24h
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
                   style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
                   className="bg-white/[0.03] rounded-lg overflow-hidden relative items-center justify-center"
                 >
                   <Image 
                     source={{ uri: post.mediaUrl }} 
                     className="absolute inset-0 w-full h-full" 
                     resizeMode="cover" 
                     blurRadius={isLocked ? 12 : 0} // Bluram complet daca e locked
                   />
                   
                   {/* Dacă e locked, punem un overlay dark și lacătul */}
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
             {userPosts.length === 0 && (
               <View className="w-full py-16 items-center justify-center">
                 <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.08)" />
                 <Text className="text-white/20 mt-3 font-semibold tracking-widest uppercase text-[10px]">No posts yet</Text>
               </View>
             )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Post Viewer Modal */}
      <Modal visible={selectedPost !== null} animationType="fade" transparent={true} onRequestClose={() => setSelectedPost(null)}>
        <BlurView intensity={95} tint="dark" className="flex-1 justify-center relative">
          <View className="absolute inset-0 bg-[#090E17]/90" />
          <TouchableOpacity onPress={() => setSelectedPost(null)} style={{ top: insets.top + 10 }} className="absolute right-6 z-50 w-9 h-9 bg-white/[0.06] rounded-full items-center justify-center border border-white/[0.08]">
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <View className="px-4" style={{ height: SCREEN_HEIGHT * 0.75 }}>
            {selectedPost && (
               <LiquidPostCard 
                 post={selectedPost}
                 onOpenComments={() => Alert.alert("Comments", "View this post from the Friends tab for full interaction.")}
                 onPostDeleted={(id) => {
                   setUserPosts(curr => curr.filter(p => p.id !== id));
                   setSelectedPost(null);
                 }}
                 onUserBlocked={() => {}}
                 onEditCaption={() => {}}
                 onReactRequest={() => {}}
               />
            )}
          </View>
        </BlurView>
      </Modal>

      {/* Modals */}
      <UserListModal 
        visible={showFollowers} 
        onClose={() => setShowFollowers(false)} 
        title="Followers" 
        users={followersList} 
        loading={loadingLists} 
        onUserTap={(uid) => {}} 
      />
      
      <UserListModal 
        visible={showFollowing} 
        onClose={() => setShowFollowing(false)} 
        title="Following" 
        users={followingList} 
        loading={loadingLists} 
        onUserTap={(uid) => {}} 
      />

      {/* Image Popout */}
      <ImagePopoutModal visible={selectedImage !== null} imageUri={selectedImage} onClose={() => setSelectedImage(null)} />

    </View>
  );
}