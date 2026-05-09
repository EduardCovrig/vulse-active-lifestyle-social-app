import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, TextInput, Dimensions, Animated, ActivityIndicator, Modal, FlatList, PanResponder, ScrollView, Share } from 'react-native';
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

const HEADER_HEIGHT = 180;
const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const ITEM_WIDTH = (width - 4 - (GRID_GAP * 2)) / 3;

export default function ProfileScreen() {
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

  const [reactingToPostId, setReactingToPostId] = useState<string | null>(null);
  const [recordingReel, setRecordingReel] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const swipeDownToCloseSettings = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) setShowSettings(false);
      }
    })
  ).current;

  const swipeDownToCloseBlocked = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) setShowBlockedUsers(false);
      }
    })
  ).current;

  const swipeDownToCloseDiscover = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) setShowDiscoverModal(false);
      }
    })
  ).current;

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

  useEffect(() => { fetchProfileData(); }, []);

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
        { text: "Record Video", onPress: () => setRecordingReel(true) },
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
      <View className="absolute inset-0">
        <Image source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000' }} className="w-full h-full opacity-20" blurRadius={50} />
        <LinearGradient colors={['#090E17', '#06090E']} className="absolute inset-0 opacity-90" />
      </View>

      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, transform: [{ translateY: headerTranslateY }] }}>
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'transparent']} className="flex-1" />
      </Animated.View>

      {/* TOP LEFT ADD BUTTON */}
      <TouchableOpacity 
        onPress={handleOpenDiscover} 
        style={{ position: 'absolute', top: insets.top + 10, left: 20, zIndex: 100 }}
        className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 backdrop-blur-md"
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* TOP RIGHT SETTINGS BUTTON */}
      <TouchableOpacity 
        onPress={handleOpenSettings} 
        style={{ position: 'absolute', top: insets.top + 10, right: 20, zIndex: 100 }}
        className="w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20 backdrop-blur-md"
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="settings" size={20} color="white" />
        </Animated.View>
      </TouchableOpacity>

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Animated.View style={{ opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
          
          <View className="items-center px-6 mb-8 mt-4 flex-col gap-3">
            <Animated.View style={{ transform: [{ scale: profilePicScale }] }} className="relative mb-2 shadow-2xl shadow-black">
              <View className="p-[2px] rounded-full bg-white/20">
                <View className="w-32 h-32 rounded-full bg-[#06090E] items-center justify-center overflow-hidden">
                  {isUploadingPic ? (
                    <ActivityIndicator color="white" />
                  ) : profile?.profilePicUrl ? (
                    <Image source={{ uri: profile.profilePicUrl }} className="w-full h-full" />
                  ) : (
                    <Text className="text-white/80 text-5xl font-black">{profile?.username?.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={handleChangeProfilePic} disabled={isUploadingPic} className="absolute bottom-0 right-0 bg-white p-2.5 rounded-full shadow-lg border-[3px] border-[#090E17]">
                <Ionicons name="camera" size={16} color="#06090E" />
              </TouchableOpacity>
            </Animated.View>

            <Text className="text-white font-extrabold text-3xl tracking-tight text-center">{profile?.username}</Text>
            
            <View className="min-h-[40px] justify-center items-center w-full">
              {isEditingBio ? (
                <View className="flex-row items-center justify-center rounded-full border border-white/20 px-4 h-11 bg-white/5 w-[80%]">
                  <TextInput className="flex-1 text-white font-body-md text-center" value={newBio} onChangeText={setNewBio} autoFocus returnKeyType="done" onSubmitEditing={handleSaveBio} />
                  <TouchableOpacity onPress={handleSaveBio} className="ml-2"><Ionicons name="checkmark-circle" size={24} color="white" /></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingBio(true)} className="px-4 py-2 w-full">
                  <Text className="text-white/60 text-center font-body-md text-sm leading-5">{profile?.bio || "Tap here to write your bio..."}</Text>
                </TouchableOpacity>
              )}
            </View>

            {profile?.streak > 0 && (
              <View className="bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/30 flex-row items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(255,138,0,0.3)] mt-2">
                <Ionicons name="flame" size={16} color="#ff8a00" />
                <Text style={{ includeFontPadding: false, textAlignVertical: 'center' }} className="text-[#ff8a00] font-black text-xs uppercase tracking-widest leading-none mt-0.5">
                  {profile.streak} Day Streak
                </Text>
              </View>
            )}
          </View>

          <View className="px-5 mb-8">
            <View className="flex-row justify-between items-center py-5 px-6 rounded-full border border-white/10 bg-white/[0.03] shadow-lg shadow-black/50">
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{profile?.followersCount || 0}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Followers</Text></View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{profile?.followingCount || 0}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Following</Text></View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{myPosts.length}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Snaps</Text></View>
            </View>
          </View>

          {/* WEEKLY VIBE (INCREASED SIZE) */}
          <View className="px-6 mb-10">
            <BouncyPressable onPress={() => setShowVibeModal(true)}>
              <Text className="text-white font-bold text-lg mb-4 ml-2 pointer-events-none tracking-tight">Last 7 Days</Text>
              <View className="flex-row justify-between bg-white/[0.03] p-4 rounded-3xl border border-white/5 shadow-md shadow-black/30 pointer-events-none">
                 {Array.from({ length: 7 }).map((_, i) => (
                    <View key={i} className={`w-[13%] aspect-square rounded-full overflow-hidden items-center justify-center ${profile?.calendarSnaps && profile.calendarSnaps[i] ? 'border-2 border-white/20' : 'bg-white/5 border border-white/5'}`}>
                      {profile?.calendarSnaps && profile.calendarSnaps[i] ? (
                         <Image source={{ uri: profile.calendarSnaps[i] }} className="w-full h-full" />
                      ) : (
                         <View className="w-2 h-2 rounded-full bg-white/10" />
                      )}
                    </View>
                 ))}
              </View>
            </BouncyPressable>
          </View>

          {/* GLOBAL PROFILE GRID */}
          <View className="px-0.5">
            <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
              {/* FIRST ITEM: UPLOAD VIDEO */}
              <TouchableOpacity 
                onPress={handleUploadReelChoice}
                style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
                className="overflow-hidden bg-[#171f33] rounded-sm border border-dashed border-[#7dd3fc]/50 items-center justify-center shadow-lg"
              >
                <Ionicons name="videocam-outline" size={32} color="#7dd3fc" />
                <Text className="text-[#7dd3fc] text-[10px] uppercase font-bold mt-2 tracking-widest">Upload Video</Text>
              </TouchableOpacity>

              {myPosts.map((post) => (
                <TouchableOpacity 
                  key={post.id} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPost(post);
                  }}
                  style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
                  className="overflow-hidden bg-white/5 rounded-sm relative"
                >
                  <Image source={{ uri: post.mediaUrl }} className="w-full h-full" resizeMode="cover" />
                  
                  <View className="absolute bottom-2 left-2 flex-row gap-2">
                    {post.calories && (
                       <View className="bg-black/50 rounded flex-row items-center px-1.5 py-0.5 gap-1">
                         <Ionicons name="flame" size={8} color="#7ad7c6" />
                       </View>
                    )}
                    {post.type === 'REEL' && (
                       <View className="bg-black/50 rounded flex-row items-center px-1.5 py-0.5 gap-1">
                         <Ionicons name="globe-outline" size={8} color="#7dd3fc" />
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
      <Modal visible={showDiscoverModal} animationType="slide" transparent={true} onRequestClose={() => setShowDiscoverModal(false)}>
        <View className="flex-1 justify-end">
          <TouchableOpacity className="absolute inset-0 bg-black/60" activeOpacity={1} onPress={() => setShowDiscoverModal(false)} />
          <BlurView intensity={90} tint="dark" className="h-[85%] rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] overflow-hidden">
            <View className="absolute inset-0 bg-[#090E17]/90" />
            
            <View {...swipeDownToCloseDiscover.panHandlers} className="w-full pt-4 pb-2 items-center bg-transparent z-50">
              <View className="w-12 h-1.5 bg-white/20 rounded-full" />
            </View>

            <TouchableOpacity onPress={() => setShowDiscoverModal(false)} className="absolute top-4 right-6 z-50 w-8 h-8 bg-white/10 rounded-full items-center justify-center border border-white/20">
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>

            <View className="px-6 pb-2">
               <Text className="text-white font-black text-2xl text-center tracking-tight mt-2">Discover</Text>
               <Text className="text-white/40 text-sm text-center mb-6 mt-1">Find friends or invite your contacts</Text>

               <View className="bg-white/10 rounded-full px-4 h-11 flex-row items-center border border-white/10 mb-6">
                 <Ionicons name="search" size={18} color="#aaa" />
                 <TextInput 
                   placeholder="Search..." 
                   placeholderTextColor="#888"
                   value={searchQuery}
                   onChangeText={setSearchQuery}
                   className="flex-1 text-white ml-2 font-bold"
                 />
               </View>
            </View>

            {loadingDiscover ? (
               <ActivityIndicator color="#7dd3fc" className="mt-10" />
            ) : (
               <ScrollView className="px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                  
                  {/* SUGGESTED FRIENDS */}
                  {suggestedFriends.length > 0 && (
                     <View className="mb-8">
                        <Text className="text-white font-bold text-lg mb-4">Suggested for you</Text>
                        {suggestedFriends.filter(f => f.username.toLowerCase().includes(searchQuery.toLowerCase())).map(friend => (
                           <View key={friend.id} className="flex-row items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl mb-3">
                              <View className="flex-row items-center gap-3">
                                 <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                                   {friend.profilePicUrl ? <Image source={{ uri: friend.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white font-bold">{friend.username.charAt(0).toUpperCase()}</Text>}
                                 </View>
                                 <View>
                                    <Text className="text-white font-bold tracking-wider">{friend.username}</Text>
                                    {friend.mutuals > 0 && <Text className="text-white/40 text-xs mt-0.5">{friend.mutuals} mutual friends</Text>}
                                 </View>
                              </View>
                              <TouchableOpacity onPress={() => handleFollowUser(friend.id)} className="bg-blue-600 px-5 py-2 rounded-full">
                                 <Text className="text-white font-bold text-xs">Add</Text>
                              </TouchableOpacity>
                           </View>
                        ))}
                     </View>
                  )}

                  {/* PHONE CONTACTS */}
                  {contacts.length > 0 && (
                     <View>
                        <Text className="text-white font-bold text-lg mb-4">From your contacts</Text>
                        {contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((contact, i) => (
                           <View key={i} className="flex-row items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl mb-3">
                              <View className="flex-row items-center gap-3">
                                 <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                                   <Text className="text-white font-bold">{contact.name.charAt(0).toUpperCase()}</Text>
                                 </View>
                                 <Text className="text-white font-bold tracking-wider">{contact.name}</Text>
                              </View>
                              <TouchableOpacity onPress={() => handleInviteContact(contact)} className="bg-indigo-600 px-4 py-2 rounded-full">
                                 <Text className="text-white font-bold text-xs">Invite</Text>
                              </TouchableOpacity>
                           </View>
                        ))}
                     </View>
                  )}

               </ScrollView>
            )}
          </BlurView>
        </View>
      </Modal>

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
                 onReactRequest={(id) => setReactingToPostId(id)}
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

      {/* --- MODAL SETTINGS (ROTIȚA) --- */}
      <Modal visible={showSettings} animationType="slide" transparent={true} onRequestClose={() => setShowSettings(false)}>
        <View className="flex-1 justify-end">
          <TouchableOpacity className="absolute inset-0 bg-black/60" activeOpacity={1} onPress={() => setShowSettings(false)} />
          <BlurView intensity={90} tint="dark" className="p-6 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-10">
            <View className="absolute inset-0 bg-[#090E17]/80" />
            
            <View {...swipeDownToCloseSettings.panHandlers} className="w-full pt-4 pb-2 items-center bg-transparent z-50">
              <View className="w-12 h-1.5 bg-white/20 rounded-full" />
            </View>

            <TouchableOpacity onPress={() => setShowSettings(false)} className="absolute top-4 right-6 z-50 w-8 h-8 bg-white/10 rounded-full items-center justify-center border border-white/20">
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-black text-2xl mb-6 text-center tracking-tight mt-2">Settings</Text>

            <View className="bg-white/[0.03] rounded-[32px] border border-white/5 overflow-hidden">
              <BouncyPressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSettings(false); }}>
                <View className="flex-row items-center justify-between p-5 border-b border-white/5">
                  <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="notifications" size={18} color="white" /></View><Text className="text-white/90 font-bold text-base">Notifications</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#555" />
                </View>
              </BouncyPressable>

              <BouncyPressable onPress={handleOpenBlockedUsers}>
                <View className="flex-row items-center justify-between p-5 border-b border-white/5">
                  <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="shield-half" size={18} color="white" /></View><Text className="text-white/90 font-bold text-base">Blocked Users</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#555" />
                </View>
              </BouncyPressable>

              <BouncyPressable onPress={() => { setShowSettings(false); logout(); }}>
                <View className="flex-row items-center justify-between p-5 border-b border-white/5">
                  <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="log-out" size={18} color="white" /></View><Text className="text-white/90 font-bold text-base">Sign Out</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#555" />
                </View>
              </BouncyPressable>

              <BouncyPressable onPress={() => { setShowSettings(false); handleDeleteAccount(); }}>
                <View className="flex-row items-center justify-between p-5">
                  <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center"><Ionicons name="trash" size={18} color="#ff4b4b" /></View><Text className="text-[#ff4b4b] font-bold text-base">Delete Account</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#ff4b4b" />
                </View>
              </BouncyPressable>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* --- MODAL BLOCKED USERS --- */}
      <Modal visible={showBlockedUsers} animationType="slide" transparent={true} onRequestClose={() => setShowBlockedUsers(false)}>
        <View className="flex-1 justify-end">
          <TouchableOpacity className="absolute inset-0 bg-black/60" activeOpacity={1} onPress={() => setShowBlockedUsers(false)} />
          <BlurView intensity={90} tint="dark" className="h-[70%] p-6 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
            <View className="absolute inset-0 bg-[#090E17]/80" />
            
            <View {...swipeDownToCloseBlocked.panHandlers} className="w-full pt-4 pb-2 items-center bg-transparent z-50">
              <View className="w-12 h-1.5 bg-white/20 rounded-full" />
            </View>

            <TouchableOpacity onPress={() => setShowBlockedUsers(false)} className="absolute top-4 right-6 z-50 w-8 h-8 bg-white/10 rounded-full items-center justify-center border border-white/20">
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>

            <Text className="text-white font-black text-2xl mb-2 text-center tracking-tight mt-2">Blocked Users</Text>
            <Text className="text-white/40 text-sm text-center mb-6">These users cannot see your posts or profile.</Text>

            {loadingBlocked ? (
              <ActivityIndicator color="#7dd3fc" className="mt-10" />
            ) : blockedUsers.length === 0 ? (
              <View className="items-center mt-10">
                <Ionicons name="shield-checkmark" size={40} color="#555" />
                <Text className="text-white/40 mt-4 text-center">You have no blocked users.</Text>
              </View>
            ) : (
              <FlatList
                data={blockedUsers}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <View className="flex-row items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl mb-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                        {item.profilePicUrl ? <Image source={{ uri: item.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white font-bold">{item.username.charAt(0).toUpperCase()}</Text>}
                      </View>
                      <Text className="text-white font-bold tracking-wider">{item.username}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleUnblockUser(item.id)} className="bg-white/10 px-4 py-2 rounded-full border border-white/10">
                      <Text className="text-white font-bold text-xs">Unblock</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </BlurView>
        </View>
      </Modal>

      {/* REACTION CAMERA OVERLAY */}
      {reactingToPostId && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <CameraScreen 
            mode="reaction" 
            onClose={() => setReactingToPostId(null)} 
            onCapture={handleReactionCapture} 
          />
        </View>
      )}

      {/* REEL RECORDING CAMERA OVERLAY */}
      {recordingReel && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
          <CameraScreen 
            mode="reel" 
            onClose={() => {
               setRecordingReel(false);
               fetchProfileData();
            }} 
          />
        </View>
      )}

    </View>
  );
}
