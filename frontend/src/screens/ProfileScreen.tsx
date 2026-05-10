import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, TextInput, Dimensions, Animated, ActivityIndicator, Modal, FlatList, PanResponder, ScrollView, Share } from 'react-native';
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
import LiquidPostCard from '../components/LiquidPostCard';
import CameraScreen from './CameraScreen';
import SettingsModal from '../components/SettingsModal';
import BlockedUsersModal from '../components/BlockedUsersModal';
import DiscoverModal from '../components/DiscoverModal';
import UserListModal from '../components/UserListModal';
import CalendarModal from '../components/CalendarModal';

const HEADER_HEIGHT = 180;
const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const ITEM_WIDTH = (width - 4 - (GRID_GAP * 2)) / 3;

interface ProfileScreenProps {
  onHideBottomBar?: (hide: boolean) => void;
}

export default function ProfileScreen({ onHideBottomBar }: ProfileScreenProps = {}) {
  const insets = useSafeAreaInsets();
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

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showVibeModal, setShowVibeModal] = useState(false);

  // New states for discover & camera
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

  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

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

  const fetchProfileData = async () => {
    setLoading(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true })
      ])
    ).start();

    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/posts/my-posts').catch(() => ({ data: [] }))
      ]);
      setProfile(profileRes.data);
      setNewBio(profileRes.data.bio || '');
      setMyPosts(postsRes.data);
    } catch (error) {
      setProfile({ username: username || "Explorer", bio: "Welcome to Vulse", followersCount: 0, followingCount: 0 });
    } finally {
      setLoading(false);
      Animated.spring(enterAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
    }, [])
  );

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

  const handleSaveBio = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.put(`/users/me?bio=${encodeURIComponent(newBio)}`);
      setProfile({ ...profile, bio: newBio });
      setIsEditingBio(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) { Alert.alert("Error", "Server could not save changes."); }
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
        Alert.alert("Error", "Could not update profile picture.");
      } finally {
        setIsUploadingPic(false);
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Warning", "Deleting your account is irreversible. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await api.delete('/users/me'); logout(); } catch (error) { Alert.alert("Error", "Check backend logs."); }
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
        .catch(() => Alert.alert("Error", "Could not fetch list."))
        .finally(() => setLoadingBlocked(false));
    }, 400); 
  };

  const handleUnblockUser = async (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/safety/block/${userId}`);
      setBlockedUsers(curr => curr.filter(u => u.id !== userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Error", "Could not unblock user.");
    }
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
      console.log(e);
    } finally {
      setLoadingDiscover(false);
    }
  };

  const handleInviteContact = async (contact: any) => {
    try {
      await Share.share({
        message: `Hey ${contact.name}! Join me on Vulse. Let's start our healthy era together! 🚀\nhttps://vulse.app`,
      });
    } catch (error) {
      console.error(error);
    }
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
    } catch(e) {
      Alert.alert("Error", "Could not upload video.");
    }
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

      setMyPosts(curr => curr.map(p => p.id === postId ? { ...p, recentReactions: [uri, ...(p.recentReactions || [])].slice(0, 3) } : p));

      await api.post(`/interactions/${postId}/react`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (selectedPost && selectedPost.id === postId) {
         setSelectedPost((prev: any) => ({ ...prev, recentReactions: [uri, ...(prev.recentReactions || [])].slice(0,3) }));
      }
    } catch (error) {
      Alert.alert("Error", "Could not add reaction.");
    }
  };

  const handleFollowUser = async (userId: string) => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
     try {
       await api.post(`/users/${userId}/follow`);
       setSuggestedFriends(curr => curr.filter(u => u.id !== userId));
     } catch (e) {
       console.log(e);
     }
  };

  const openFollowers = async () => {
    if (!profile) return;
    setShowFollowers(true);
    setLoadingLists(true);
    try {
      const res = await api.get(`/users/${profile.username}/followers`);
      setFollowersList(res.data);
    } catch(e) {} finally { setLoadingLists(false); }
  };

  const openFollowing = async () => {
    if (!profile) return;
    setShowFollowing(true);
    setLoadingLists(true);
    try {
      const res = await api.get(`/users/${profile.username}/following`);
      setFollowingList(res.data);
    } catch(e) {} finally { setLoadingLists(false); }
  };

  const openCalendar = async () => {
    if (!profile) return;
    setShowCalendar(true);
    setLoadingCalendar(true);
    try {
      const res = await api.get(`/users/${profile.username}/calendar`);
      setCalendarSnaps(res.data);
    } catch(e) {} finally { setLoadingCalendar(false); }
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
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, transform: [{ translateY: headerTranslateY }] }}>
        <LinearGradient colors={['rgba(122,215,198,0.04)', 'transparent']} className="flex-1" />
      </Animated.View>

      {/* TOP LEFT ADD BUTTON */}
      <TouchableOpacity 
        onPress={handleOpenDiscover} 
        style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 100 }}
        className="w-9 h-9 bg-white/[0.06] rounded-full items-center justify-center border border-white/[0.08]"
      >
        <Ionicons name="add" size={20} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      {/* TOP RIGHT SETTINGS BUTTON */}
      <TouchableOpacity 
        onPress={handleOpenSettings} 
        style={{ position: 'absolute', top: insets.top + 10, right: 20, zIndex: 100 }}
        className="w-9 h-9 bg-white/[0.06] rounded-full items-center justify-center border border-white/[0.08]"
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="settings-outline" size={18} color="rgba(255,255,255,0.7)" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Animated.View style={{ opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
          
          <View className="items-center px-6 mb-6 mt-2">
            <Animated.View style={{ transform: [{ scale: profilePicScale }] }} className="relative mb-3">
              <View className="p-[1.5px] rounded-full bg-white/15">
                <View className="w-[88px] h-[88px] rounded-full bg-[#0c1018] items-center justify-center overflow-hidden">
                  {isUploadingPic ? (
                    <ActivityIndicator color="white" />
                  ) : profile?.profilePicUrl ? (
                    <Image source={{ uri: profile.profilePicUrl }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white/80 text-4xl font-bold">{profile?.username?.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={handleChangeProfilePic} disabled={isUploadingPic} className="absolute bottom-0 right-0 bg-white p-2 rounded-full border-2 border-[#090E17]">
                <Ionicons name="camera" size={13} color="#090E17" />
              </TouchableOpacity>
            </Animated.View>

            <Text className="text-white font-bold text-2xl tracking-tight text-center">{profile?.username}</Text>
            
            <View className="min-h-[32px] justify-center items-center w-full mt-1">
              {isEditingBio ? (
                <View className="flex-row items-center justify-center rounded-full border border-white/15 px-4 h-10 bg-white/[0.04] w-[75%]">
                  <TextInput className="flex-1 text-white text-[13px] text-center" value={newBio} onChangeText={setNewBio} autoFocus returnKeyType="done" onSubmitEditing={handleSaveBio} />
                  <TouchableOpacity onPress={handleSaveBio} className="ml-2"><Ionicons name="checkmark-circle" size={20} color="white" /></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingBio(true)} className="px-4 py-1.5">
                  <Text className="text-white/45 text-center text-[13px] leading-5">{profile?.bio || "Tap to add bio..."}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stats section — properly centered */}
            <View className="flex-row items-center mt-4 mb-6 bg-white/[0.04] py-3.5 px-2 rounded-[28px] border border-white/[0.05] w-full">
              <BouncyPressable onPress={openFollowers} className="flex-1 items-center">
                <Text className="text-white font-bold text-lg">{profile?.followersCount || 0}</Text>
                <Text className="text-white/40 text-[9px] font-semibold tracking-widest uppercase mt-0.5">Followers</Text>
              </BouncyPressable>
              <View className="w-[1px] h-8 bg-white/[0.06]" />
              <View className="flex-1 items-center">
                <Text className="text-white font-bold text-lg">{myPosts.length}</Text>
                <Text className="text-white/40 text-[9px] font-semibold tracking-widest uppercase mt-0.5">Posts</Text>
              </View>
              <View className="w-[1px] h-8 bg-white/[0.06]" />
              <BouncyPressable onPress={openFollowing} className="flex-1 items-center">
                <Text className="text-white font-bold text-lg">{profile?.followingCount || 0}</Text>
                <Text className="text-white/40 text-[9px] font-semibold tracking-widest uppercase mt-0.5">Following</Text>
              </BouncyPressable>
            </View>

            {/* Weekly Vibe (Last 7 Days) */}
            <BouncyPressable onPress={openCalendar} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-4 mb-6 overflow-hidden relative">
              <LinearGradient colors={['rgba(122, 215, 198, 0.06)', 'transparent']} className="absolute inset-0" />
              <View className="flex-row items-center justify-between mb-3 relative z-10">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={14} color="#7ad7c6" />
                  <Text className="text-[#7ad7c6] font-bold text-[10px] tracking-widest uppercase">Your Week</Text>
                </View>
                <View className="bg-white/[0.06] px-2.5 py-1 rounded-full"><Text className="text-white/60 font-semibold text-[9px]">{profile?.streak || 0}🔥</Text></View>
              </View>
              <View className="flex-row justify-between relative z-10">
                {[...Array(7)].map((_, i) => (
                  <View key={i} className="w-[12.5%] aspect-[3/4] rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.04] items-center justify-center">
                    {calendarSnaps[i] ? (
                      <Image source={{ uri: calendarSnaps[i].mediaUrl }} className="w-full h-full object-cover" />
                    ) : (
                      <Ionicons name="camera-outline" size={10} color="rgba(255,255,255,0.12)" />
                    )}
                  </View>
                ))}
              </View>
            </BouncyPressable>
          </View>

          {/* GLOBAL PROFILE GRID */}
          <View className="px-1">
            <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
              {/* FIRST ITEM: UPLOAD VIDEO */}
              <TouchableOpacity 
                onPress={handleUploadReelChoice}
                style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
                className="overflow-hidden bg-white/[0.03] rounded-lg border border-dashed border-white/[0.1] items-center justify-center"
              >
                <Ionicons name="videocam-outline" size={24} color="rgba(255,255,255,0.3)" />
                <Text className="text-white/30 text-[8px] uppercase font-semibold mt-1.5 tracking-widest">Upload</Text>
              </TouchableOpacity>

              {myPosts.map((post) => (
                <TouchableOpacity 
                  key={post.id} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPost(post);
                  }}
                  style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
                  className="overflow-hidden bg-white/[0.03] rounded-lg relative"
                >
                  <Image source={{ uri: post.mediaUrl }} className="w-full h-full" resizeMode="cover" />
                  
                  <View className="absolute bottom-1.5 left-1.5 flex-row gap-1">
                    {post.calories && (
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
              ))}
            </View>
          </View>

        </Animated.View>
      </Animated.ScrollView>

      {/* --- MODAL DISCOVER / INVITE --- */}
      <DiscoverModal 
        visible={showDiscoverModal} 
        onClose={() => setShowDiscoverModal(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loadingDiscover={loadingDiscover}
        suggestedFriends={suggestedFriends}
        contacts={contacts}
        handleFollowUser={handleFollowUser}
        handleInviteContact={handleInviteContact}
      />

      <UserListModal 
        visible={showFollowers} 
        onClose={() => setShowFollowers(false)} 
        title="Followers" 
        users={followersList} 
        loading={loadingLists} 
      />

      <UserListModal 
        visible={showFollowing} 
        onClose={() => setShowFollowing(false)} 
        title="Following" 
        users={followingList} 
        loading={loadingLists} 
      />

      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        loading={loadingCalendar}
        snaps={calendarSnaps}
      />

      {/* --- MODAL POST VIEWER --- */}
      <Modal visible={selectedPost !== null} animationType="fade" transparent={true} onRequestClose={() => setSelectedPost(null)}>
        <BlurView intensity={95} tint="dark" className="flex-1 justify-center relative">
          <View className="absolute inset-0 bg-[#090E17]/80" />
          <TouchableOpacity onPress={() => setSelectedPost(null)} style={{ top: insets.top + 10 }} className="absolute right-6 z-50 w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="px-4" style={{ height: Dimensions.get('window').height * 0.75 }}>
            {selectedPost && (
               <LiquidPostCard 
                 post={selectedPost}
                 onOpenComments={() => Alert.alert("Comments", "To leave a comment, please access the post from the Feed tab.")}
                 onPostDeleted={(id) => {
                   setMyPosts(curr => curr.filter(p => p.id !== id));
                   setSelectedPost(null);
                 }}
                 onUserBlocked={() => {}}
                 onEditCaption={() => Alert.alert("Info", "Please edit the caption from the post menu on the Feed.")}
                 onReactRequest={(id) => {
                   setReactingToPostId(id);
                   if (onHideBottomBar) onHideBottomBar(true);
                 }}
               />
            )}
          </View>
        </BlurView>
      </Modal>

      {/* MODAL WEEKLY VIBE CALENDAR */}
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

      {/* --- MODAL SETTINGS --- */}
      <SettingsModal 
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onOpenBlockedUsers={handleOpenBlockedUsers}
        onLogout={logout}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* --- MODAL BLOCKED USERS --- */}
      <BlockedUsersModal 
        visible={showBlockedUsers}
        onClose={() => setShowBlockedUsers(false)}
        blockedUsers={blockedUsers}
        loadingBlocked={loadingBlocked}
        onUnblockUser={handleUnblockUser}
      />

      {/* REACTION CAMERA OVERLAY */}
      <Modal visible={reactingToPostId !== null} transparent={true} animationType="fade" onRequestClose={() => {
        setReactingToPostId(null);
        if (onHideBottomBar) onHideBottomBar(false);
      }}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          {reactingToPostId && (
            <CameraScreen 
              mode="reaction" 
              onClose={() => {
                setReactingToPostId(null);
                if (onHideBottomBar) onHideBottomBar(false);
              }} 
              onCapture={handleReactionCapture} 
            />
          )}
        </View>
      </Modal>

      {/* REEL RECORDING CAMERA OVERLAY */}
      <Modal visible={recordingReel} transparent={true} animationType="fade" onRequestClose={() => {
        setRecordingReel(false);
        if (onHideBottomBar) onHideBottomBar(false);
      }}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          {recordingReel && (
            <CameraScreen 
              mode="reel" 
              onClose={() => {
                 setRecordingReel(false);
                 if (onHideBottomBar) onHideBottomBar(false);
                 fetchProfileData();
              }} 
            />
          )}
        </View>
      </Modal>

    </View>
  );
}
