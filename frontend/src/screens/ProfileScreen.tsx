import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, TextInput, Dimensions, Animated, ActivityIndicator, Modal, FlatList, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import BouncyPressable from '../components/BouncyPressable';
import CameraScreen from './CameraScreen';
import SettingsModal from '../components/SettingsModal';
import BlockedUsersModal from '../components/BlockedUsersModal';
import DiscoverModal from '../components/DiscoverModal';
import UserListModal from '../components/UserListModal';
import CalendarModal from '../components/CalendarModal';
import ImagePopoutModal from '../components/ImagePopoutModal';
import SwipeableModal from '../components/SwipeableModal';
import NotificationListModal from '../components/NotificationListModal';

const HEADER_HEIGHT = 180;
const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_GAP = 2;
const ITEM_WIDTH = (width - 8 - (GRID_GAP * 2)) / 3;

interface ProfileScreenProps {
  onHideBottomBar?: (hide: boolean) => void;
}

export default function ProfileScreen({ onHideBottomBar }: ProfileScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const navigation = require('@react-navigation/native').useNavigation();
  const { logout, username } = useContext(AuthContext);

  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isUploadingPic, setIsUploadingPic] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showVibeModal, setShowVibeModal] = useState(false);

  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarSnaps, setCalendarSnaps] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [reactingToPostId, setReactingToPostId] = useState<string | null>(null);
  const [recordingReel, setRecordingReel] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Streak Animation Refs
  const streakScale = useRef(new Animated.Value(1)).current;
  const streakRotate = useRef(new Animated.Value(0)).current;

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

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const spinInterpolate = streakRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg']
  });

  const fetchProfileData = async () => {
    setLoading(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true })
      ])
    ).start();

    try {
      const [profileRes, postsRes, notifRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/posts/my-posts').catch(() => ({ data: [] })),
        api.get('/notifications').catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setNewBio(profileRes.data.bio || '');
      setMyPosts(postsRes.data);
      
      const unread = notifRes.data.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);

      if (profileRes.data.username) {
        api.get(`/users/${profileRes.data.username}/calendar`)
          .then(res => setCalendarSnaps(res.data))
          .catch(() => {});
      }
    } catch (error) {
      setProfile({ username: username || "Explorer", bio: "Welcome to Vulse", followersCount: 0, followingCount: 0 });
    } finally {
      setLoading(false);
      Animated.spring(enterAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    }
  };

  useFocusEffect(React.useCallback(() => { fetchProfileData(); }, []));

  const animateStreak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(streakScale, { toValue: 1.2, useNativeDriver: true }),
        Animated.timing(streakRotate, { toValue: 1, duration: 40, useNativeDriver: true })
      ]),
      Animated.timing(streakRotate, { toValue: -1, duration: 40, useNativeDriver: true }),
      Animated.timing(streakRotate, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(streakRotate, { toValue: 0, duration: 40, useNativeDriver: true }),
      Animated.spring(streakScale, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  const handleOpenSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      spinAnim.setValue(0);
      setShowSettings(true);
    });
  };

  const handleOpenNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNotifications(true);
    setUnreadCount(0); // Reset UI optimistic
  };

  const handleSaveBio = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.put(`/users/me?bio=${encodeURIComponent(newBio)}`);
      setProfile({ ...profile, bio: newBio });
      setIsEditingBio(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {}
  };

  const handleChangeProfilePic = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsUploadingPic(true);
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'profile.jpg';
        const type = `image/${filename.split('.').pop()}`;

        formData.append('file', { uri, name: filename, type } as any);

        const response = await api.patch('/users/me/picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        setProfile({ ...profile, profilePicUrl: response.data.profilePicUrl });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error: any) {
      } finally {
        setIsUploadingPic(false);
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Warning", "Deleting your account is irreversible. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await api.delete('/users/me'); logout(); } catch (error) {}
      }}
    ]);
  };

  const handleOpenBlockedUsers = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettings(false); 
    setTimeout(() => {
      setShowBlockedUsers(true);
      setLoadingBlocked(true);
      api.get('/safety/blocked')
        .then(res => setBlockedUsers(res.data))
        .catch(() => {})
        .finally(() => setLoadingBlocked(false));
    }, 400); 
  };

  const handleUnblockUser = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/safety/block/${userId}`);
      setBlockedUsers(curr => curr.filter(u => u.id !== userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {}
  };

  const handleOpenDiscover = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDiscoverModal(true);
    setLoadingDiscover(true);
    try {
      const suggRes = await api.get('/users/suggestions');
      setSuggestedFriends(suggRes.data);

      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
        if (data.length > 0) {
          const validContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0).slice(0, 30);
          setContacts(validContacts);
        }
      }
    } catch (e) {
    } finally {
      setLoadingDiscover(false);
    }
  };

  const handleInviteContact = async (contact: any) => {
    try {
      await Share.share({
        message: `Hey ${contact.name}! Join me on Vulse. Let's start our healthy era together! 🚀\nhttps://vulse.app`,
      });
    } catch (error) {}
  };

  const handleFollowUser = async (userId: string) => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
     try {
       await api.post(`/users/${userId}/follow`);
       setSuggestedFriends(curr => curr.filter(u => u.id !== userId));
     } catch (e) {}
  };

  const handleUploadReelChoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Upload Video",
      "Choose a method to upload your reel",
      [
        { text: "Record Video", onPress: () => {
            setRecordingReel(true);
            if (onHideBottomBar) onHideBottomBar(true);
        }},
        { text: "Upload from Library", onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0].uri) {
               uploadVideoDirectly(result.assets[0].uri);
            }
        }},
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const uploadVideoDirectly = async (uri: string) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'upload.mp4';
      const type = `video/${filename.split('.').pop()}`;
      formData.append('file', { uri, name: filename, type } as any);
      formData.append('type', 'REEL');
      formData.append('caption', 'New post on Vulse! ⚡');

      await api.post('/posts/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchProfileData(); 
    } catch(e) {}
  };

  const handleReactionCapture = async (uri: string, message?: string) => {
    if (!reactingToPostId) return;
    const postId = reactingToPostId;
    setReactingToPostId(null);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'reaction.jpg';
      const type = `image/${filename.split('.').pop()}`;
      formData.append('file', { uri, name: filename, type } as any);
      if (message) {
         formData.append('message', message);
      }

      setMyPosts(curr => curr.map(p => p.id === postId ? { ...p, recentReactions: [uri, ...(p.recentReactions || [])].slice(0, 3) } : p));

      await api.post(`/interactions/${postId}/react`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (selectedPost && selectedPost.id === postId) {
         setSelectedPost((prev: any) => ({ ...prev, recentReactions: [uri, ...(prev.recentReactions || [])].slice(0,3) }));
      }
    } catch (error) {}
  };

  const openFollowers = async () => {
    if (!profile) return;
    setShowFollowers(true); setLoadingLists(true);
    try { const res = await api.get(`/users/${profile.username}/followers`); setFollowersList(res.data); } catch(e) {} finally { setLoadingLists(false); }
  };

  const openFollowing = async () => {
    if (!profile) return;
    setShowFollowing(true); setLoadingLists(true);
    try { const res = await api.get(`/users/${profile.username}/following`); setFollowingList(res.data); } catch(e) {} finally { setLoadingLists(false); }
  };

  const openCalendar = async () => {
    if (!profile) return;
    setShowCalendar(true); setLoadingCalendar(true);
    try { const res = await api.get(`/users/${profile.username}/calendar`); setCalendarSnaps(res.data); } catch(e) {} finally { setLoadingCalendar(false); }
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
      setMyPosts(curr => curr.map(p => p.id === activeCommentsPostId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
    } catch (error) {}
  };

  const handleLikeToggled = (postId: string, newIsLiked: boolean) => {
    setMyPosts(curr => curr.map(p => p.id === postId ? { ...p, isLiked: newIsLiked, likesCount: newIsLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) } : p));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev: any) => ({ ...prev, isLiked: newIsLiked, likesCount: newIsLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1) }));
    }
  };

  const handleCommentLongPress = (comment: any) => {
    if (comment.user.username !== username) return; 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Comment", "Do you want to delete this comment?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await api.delete(`/comments/${comment.id}`);
          setComments(curr => curr.filter(c => c.id !== comment.id));
          if (selectedPost && selectedPost.id === activeCommentsPostId) {
            setSelectedPost({ ...selectedPost, commentsCount: Math.max(0, (selectedPost.commentsCount || 0) - 1) });
          }
          setMyPosts(curr => curr.map(p => p.id === activeCommentsPostId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p));
        } catch (e) {}
      }}
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#090E17]">
        <Animated.View style={{ opacity: pulseAnim, paddingTop: insets.top + 50 }} className="items-center px-6">
          <View className="w-32 h-32 rounded-full bg-white/10 mb-6" />
          <View className="w-40 h-8 bg-white/10 rounded-full mb-3" />
          <View className="w-64 h-4 bg-white/5 rounded-full mb-10" />
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#090E17]">
      <Animated.View style={{ transform: [{ translateY: headerTranslateY }], position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, zIndex: 1 }}>
        <LinearGradient colors={['rgba(122, 215, 198, 0.04)', 'transparent']} className="absolute inset-0" />
      </Animated.View>

      {/* TOP LEFT - ADD FRIENDS */}
      <TouchableOpacity onPress={handleOpenDiscover} style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 100 }} className="w-10 h-10 bg-white/[0.08] rounded-full items-center justify-center border border-white/[0.1] backdrop-blur-md shadow-lg">
        <Ionicons name="person-add" size={18} color="rgba(255,255,255,0.9)" />
      </TouchableOpacity>

      {/* TOP RIGHT - NOTIFICATIONS & SETTINGS */}
      <View style={{ position: 'absolute', top: insets.top + 10, right: 20, zIndex: 100, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={handleOpenNotifications} className="relative w-10 h-10 bg-white/[0.08] rounded-full items-center justify-center border border-white/[0.1] backdrop-blur-md shadow-lg">
          <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.9)" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-[#ff4b4b] min-w-[16px] h-4 rounded-full items-center justify-center border border-[#090E17] px-1">
              <Text className="text-white text-[8px] font-black">{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleOpenSettings} className="w-10 h-10 bg-white/[0.08] rounded-full items-center justify-center border border-white/[0.1] backdrop-blur-md shadow-lg">
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.9)" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Animated.View style={{ opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
          
          <View className="items-center px-6 mb-6 mt-6">
            <Animated.View style={{ transform: [{ scale: profilePicScale }] }} className="relative mb-4">
              <View className="p-[2px] rounded-full bg-white/15 shadow-xl shadow-black/50">
                <View className="w-[100px] h-[100px] rounded-full bg-[#0c1018] items-center justify-center overflow-hidden">
                  {isUploadingPic ? (
                    <ActivityIndicator color="white" />
                  ) : profile?.profilePicUrl ? (
                    <Image source={{ uri: profile.profilePicUrl }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white/80 text-5xl font-black">{profile?.username?.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={handleChangeProfilePic} disabled={isUploadingPic} className="absolute bottom-0 right-0 bg-white w-9 h-9 rounded-full items-center justify-center border-[2.5px] border-[#090E17] shadow-lg">
                <Ionicons name="camera" size={15} color="#090E17" />
              </TouchableOpacity>
            </Animated.View>

            <Text className="text-white font-extrabold text-[28px] tracking-tight mb-2">{profile?.username}</Text>
            
            {/* BIO SECTION */}
            <View className="items-center justify-center w-full mt-2 mb-2 px-8">
              {isEditingBio ? (
                <View className="flex-row items-center justify-center rounded-2xl border border-white/20 px-4 py-2 bg-white/5 w-[80%]">
                  <TextInput 
                    className="flex-1 text-white text-[14px] text-center font-medium" 
                    value={newBio} 
                    onChangeText={setNewBio} 
                    autoFocus 
                    returnKeyType="done" 
                    onSubmitEditing={handleSaveBio} 
                    multiline={true}
                    maxLength={150}
                  />
                  <TouchableOpacity onPress={handleSaveBio} className="ml-3">
                    <Ionicons name="checkmark-circle" size={24} color="#7ad7c6" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingBio(true)} activeOpacity={0.7} className="px-6 py-2">
                  <Text className="text-white/70 text-center text-[14px] font-medium leading-5">{profile?.bio || "Tap to add your bio..."}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* COUNTERS */}
          <View className="px-5 mb-8 w-full">
            <View className="flex-row justify-evenly items-center py-4 px-2 rounded-full border border-white/10 bg-white/[0.03] shadow-lg shadow-black/50">
              <BouncyPressable onPress={openFollowers} className="items-center w-24">
                <Text className="text-white font-black text-[20px]">{profile?.followersCount || 0}</Text>
                <Text className="text-white/40 text-[10px] uppercase font-bold mt-1">Followers</Text>
              </BouncyPressable>
              
              <View className="w-[1px] h-6 bg-white/20" />
              
              <View className="items-center w-24">
                <Text className="text-white font-black text-[20px]">{myPosts.length}</Text>
                <Text className="text-white/40 text-[10px] uppercase font-bold mt-1">Posts</Text>
              </View>

              <View className="w-[1px] h-6 bg-white/20" />
              
              <BouncyPressable onPress={openFollowing} className="items-center w-24">
                <Text className="text-white font-black text-[20px]">{profile?.followingCount || 0}</Text>
                <Text className="text-white/40 text-[10px] uppercase font-bold mt-1">Following</Text>
              </BouncyPressable>
            </View>
          </View>

          {/* WEEKLY VIBE - WITH STREAK ANIMATION */}
          <BouncyPressable onPress={openCalendar} className="mx-6 bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-5 mb-8 overflow-hidden relative shadow-sm shadow-black/20">
            <LinearGradient colors={['rgba(122, 215, 198, 0.04)', 'transparent']} className="absolute inset-0" />
            <View className="flex-row items-center justify-between mb-4 relative z-10">
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={16} color="#7ad7c6" />
                <Text className="text-[#7ad7c6] font-bold text-[11px] tracking-widest uppercase">Your Week</Text>
              </View>
              {profile?.streak > 0 && (
                <TouchableOpacity onPress={animateStreak} activeOpacity={1}>
                  <Animated.View style={{ transform: [{ scale: streakScale }, { rotate: spinInterpolate }] }} className="bg-orange-500/20 border border-orange-500/30 px-3 py-1 rounded-full flex-row items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(255,138,0,0.2)]">
                     <Ionicons name="flame" size={12} color="#ff8a00" />
                     <Text className="text-[#ff8a00] font-black text-[10px] uppercase pt-0.5">{profile.streak} STREAK</Text>
                  </Animated.View>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row justify-between relative z-10">
              {[...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                const dateStr = d.toISOString().split('T')[0];
                const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
                const snap = calendarSnaps.find((s: any) => s.date === dateStr);
                return (
                  <View key={i} style={{ width: '12.5%', aspectRatio: 0.75, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: snap ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                    {snap ? (
                      <Image source={{ uri: snap.mediaUrl }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
                    ) : (
                      <Ionicons name="camera-outline" size={12} color="rgba(255,255,255,0.1)" />
                    )}
                    <View style={{ position: 'absolute', bottom: 4 }}>
                      <Text style={{ fontSize: 8, fontWeight: '700', color: snap ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{dayLabel}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </BouncyPressable>

          {/* GLOBAL PROFILE GRID */}
          <View className="px-1">
            <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
              <TouchableOpacity 
                onPress={handleUploadReelChoice}
                style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
                className="overflow-hidden bg-white/[0.03] rounded-lg border border-dashed border-white/[0.1] items-center justify-center"
              >
                <Ionicons name="videocam-outline" size={28} color="rgba(255,255,255,0.3)" />
                <Text className="text-white/30 text-[9px] uppercase font-bold mt-2 tracking-widest">Upload</Text>
              </TouchableOpacity>

              {myPosts.map((post) => (
                <TouchableOpacity 
                  key={post.id} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPost(post);
                  }}
                  activeOpacity={0.8}
                  style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
                  className="overflow-hidden bg-white/[0.03] rounded-lg relative"
                >
                  <Image source={{ uri: post.mediaUrl }} className="w-full h-full" resizeMode="cover" />
                  
                  <View className="absolute bottom-1.5 left-1.5 flex-row gap-1">
                    {post.calories && (
                       <View className="bg-black/50 rounded-full flex-row items-center px-1.5 py-0.5 gap-1">
                         <Ionicons name="flame" size={8} color="#7ad7c6" />
                       </View>
                    )}
                    {post.type === 'REEL' && (
                       <View className="bg-black/50 rounded-full flex-row items-center px-1.5 py-0.5 gap-1">
                         <Ionicons name="play" size={8} color="rgba(255,255,255,0.8)" />
                       </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </Animated.View>
      </Animated.ScrollView>

      {/* MODALS */}
      <DiscoverModal visible={showDiscoverModal} onClose={() => setShowDiscoverModal(false)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} loadingDiscover={loadingDiscover} suggestedFriends={suggestedFriends} contacts={contacts} handleFollowUser={handleFollowUser} handleInviteContact={handleInviteContact} />
      
      <UserListModal 
        visible={showFollowers} 
        onClose={() => setShowFollowers(false)} 
        title="Followers" 
        users={followersList} 
        loading={loadingLists} 
        onUserTap={(u) => { setShowFollowers(false); navigation.navigate('UserProfile', { username: u }); }}
      />
      <UserListModal 
        visible={showFollowing} 
        onClose={() => setShowFollowing(false)} 
        title="Following" 
        users={followingList} 
        loading={loadingLists} 
        onUserTap={(u) => { setShowFollowing(false); navigation.navigate('UserProfile', { username: u }); }}
      />
      
      <CalendarModal 
        visible={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        loading={loadingCalendar} 
        snaps={calendarSnaps} 
        onSnapPress={(url) => setSelectedImage(url)}
      />
      
      <Modal visible={showVibeModal} animationType="fade" transparent={true} onRequestClose={() => setShowVibeModal(false)}>
        <BlurView intensity={95} tint="dark" className="flex-1 justify-center relative p-6">
          <View className="absolute inset-0 bg-[#090E17]/80" />
          <TouchableOpacity onPress={() => setShowVibeModal(false)} style={{ top: insets.top + 10 }} className="absolute right-6 z-50 w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-black text-3xl mb-8 text-center tracking-tight">Your Visual Journey</Text>
          <View className="flex-row flex-wrap justify-center gap-4">
            {profile?.calendarSnaps?.map((img: string, i: number) => (
              <View key={i} className="w-[28%] aspect-square rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg shadow-black">
                {img ? <Image source={{ uri: img }} className="w-full h-full" /> : <View className="flex-1 bg-white/5" />}
              </View>
            ))}
          </View>
        </BlurView>
      </Modal>

      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} onOpenBlockedUsers={handleOpenBlockedUsers} onLogout={logout} onDeleteAccount={handleDeleteAccount} />
      <BlockedUsersModal visible={showBlockedUsers} onClose={() => setShowBlockedUsers(false)} blockedUsers={blockedUsers} loadingBlocked={loadingBlocked} onUnblockUser={handleUnblockUser} />
      
      <NotificationListModal visible={showNotifications} onClose={() => setShowNotifications(false)} />

      <Modal visible={reactingToPostId !== null} transparent={true} animationType="fade" onRequestClose={() => { setReactingToPostId(null); if (onHideBottomBar) onHideBottomBar(false); }}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          {reactingToPostId && <CameraScreen mode="reaction" onClose={() => { setReactingToPostId(null); if (onHideBottomBar) onHideBottomBar(false); }} onCapture={handleReactionCapture} />}
        </View>
      </Modal>

      <Modal visible={recordingReel} transparent={true} animationType="fade" onRequestClose={() => { setRecordingReel(false); if (onHideBottomBar) onHideBottomBar(false); }}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          {recordingReel && <CameraScreen mode="reel" onClose={() => { setRecordingReel(false); if (onHideBottomBar) onHideBottomBar(false); fetchProfileData(); }} />}
        </View>
      </Modal>

      {/* UNIFIED VIEWER MODAL AICI */}
      <ImagePopoutModal 
        visible={selectedPost !== null || selectedImage !== null} 
        post={selectedPost} 
        imageUri={selectedImage}
        onClose={() => {
           setSelectedPost(null);
           setSelectedImage(null);
        }} 
        onOpenComments={(id) => {
          setSelectedPost(null);
          setTimeout(() => openComments(id), 300);
        }}
        onReactRequest={(id) => {
          setSelectedPost(null);
          setTimeout(() => {
             setReactingToPostId(id);
             if (onHideBottomBar) onHideBottomBar(true);
          }, 300);
        }}
      />

      {/* COMMENTS MODAL */}
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
                  {item?.user?.profilePicUrl ? (
                    <Image source={{ uri: item.user.profilePicUrl }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white/60 text-xs font-semibold">{item?.user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
                  )}
                </View>
                <View className="flex-1 bg-white/[0.03] p-3.5 rounded-2xl rounded-tl-sm border border-white/[0.04]">
                  <Text className="text-[#7dd3fc] text-[10px] font-bold mb-1 tracking-wider uppercase">{item?.user?.username || 'Unknown'}</Text>
                  <Text className="text-white/90 text-[13px] leading-5">{item?.text || ''}</Text>
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