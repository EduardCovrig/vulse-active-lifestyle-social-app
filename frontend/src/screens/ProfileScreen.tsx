import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, TextInput, Dimensions, Animated, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import BouncyPressable from '../components/BouncyPressable';
import LiquidPostCard from '../components/LiquidPostCard';

const HEADER_HEIGHT = 180;
const { width } = Dimensions.get('window');
const GRID_GAP = 4;
const ITEM_WIDTH = (width - 48 - (GRID_GAP * 2)) / 3;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout, username } = useContext(AuthContext);

  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isUploadingPic, setIsUploadingPic] = useState(false);

  const [isEditingMacros, setIsEditingMacros] = useState(false);
  const [macrosForm, setMacrosForm] = useState({ cal: '', pro: '', carb: '', fat: '' });
  const [isSavingMacros, setIsSavingMacros] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any>(null);

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
      setMacrosForm({
        cal: profileRes.data.dailyCaloriesGoal?.toString() || '',
        pro: profileRes.data.proteinGoal?.toString() || '',
        carb: profileRes.data.carbsGoal?.toString() || '',
        fat: profileRes.data.fatGoal?.toString() || ''
      });
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
    } catch (error) { Alert.alert("Eroare", "Serverul nu a putut salva schimbarile."); }
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
        Alert.alert("Eroare", "Nu am putut actualiza poza de profil.");
      } finally {
        setIsUploadingPic(false);
      }
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Avertizare", "Ștergerea contului este ireversibilă. Continuăm?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await api.delete('/users/me'); logout(); } catch (error) { Alert.alert("Eroare", "Verifică logurile pe backend."); }
      }}
    ]);
  };

  const handleSaveMacros = async () => {
    setIsSavingMacros(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      let queryParams = [];
      if (macrosForm.cal) queryParams.push(`dailyCaloriesGoal=${macrosForm.cal}`);
      if (macrosForm.pro) queryParams.push(`proteinGoal=${macrosForm.pro}`);
      if (macrosForm.carb) queryParams.push(`carbsGoal=${macrosForm.carb}`);
      if (macrosForm.fat) queryParams.push(`fatGoal=${macrosForm.fat}`);
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      await api.put(`/users/me${queryString}`);
      
      setProfile({
        ...profile,
        dailyCaloriesGoal: macrosForm.cal ? parseInt(macrosForm.cal) : null,
        proteinGoal: macrosForm.pro ? parseInt(macrosForm.pro) : null,
        carbsGoal: macrosForm.carb ? parseInt(macrosForm.carb) : null,
        fatGoal: macrosForm.fat ? parseInt(macrosForm.fat) : null,
      });
      
      setIsEditingMacros(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Eroare", "Nu am putut salva obiectivele.");
    } finally {
      setIsSavingMacros(false);
    }
  };

  const handleOpenBlockedUsers = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSettings(false); 
    setTimeout(() => {
      setShowBlockedUsers(true);
      setLoadingBlocked(true);
      api.get('/safety/blocked')
        .then(res => setBlockedUsers(res.data))
        .catch(() => Alert.alert("Eroare", "Nu am putut aduce lista."))
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
      Alert.alert("Eroare", "Nu am putut debloca utilizatorul.");
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
          
          {/* USER INFO */}
          <View className="items-center px-6 mb-8 mt-4">
            <Animated.View style={{ transform: [{ scale: profilePicScale }] }} className="relative mb-5 shadow-2xl shadow-black">
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

            <View className="flex-row items-center gap-3">
              <Text className="text-white font-extrabold text-3xl tracking-tight">{profile?.username}</Text>
            </View>
            
            {isEditingBio ? (
              <View className="flex-row items-center rounded-full border border-white/20 mt-4 px-5 py-2 bg-white/5">
                <TextInput className="text-white font-body-md py-1 w-56 text-center" value={newBio} onChangeText={setNewBio} autoFocus returnKeyType="done" onSubmitEditing={handleSaveBio} />
                <TouchableOpacity onPress={handleSaveBio} className="ml-3"><Ionicons name="checkmark-circle" size={24} color="white" /></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingBio(true)} className="mt-4 px-8 items-center">
                <Text className="text-white/60 text-center font-body-md text-sm leading-6">{profile?.bio || "Tap here to write your bio..."}</Text>
              </TouchableOpacity>
            )}

            {/* STREAK BADGE */}
            {profile?.streak > 0 && (
              <View className="mt-4 bg-orange-500/20 px-3 py-1.5 rounded-full border border-orange-500/30 flex-row items-center gap-1.5 shadow-[0_0_10px_rgba(255,138,0,0.3)]">
                <Ionicons name="flame" size={14} color="#ff8a00" />
                <Text className="text-[#ff8a00] font-black text-xs uppercase tracking-widest">{profile.streak} Day Streak</Text>
              </View>
            )}
          </View>

          {/* COUNTERS */}
          <View className="px-5 mb-8">
            <View className="flex-row justify-between items-center py-5 px-6 rounded-full border border-white/10 bg-white/[0.03] shadow-lg shadow-black/50">
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{profile?.followersCount || 0}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Followers</Text></View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{profile?.followingCount || 0}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Following</Text></View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{myPosts.length}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Snaps</Text></View>
            </View>
          </View>

          {/* WEEKLY VIBE (VISUAL CALENDAR) INTEGRATION */}
          <View className="px-6 mb-8">
            <Text className="text-white/30 text-[11px] font-black tracking-[4px] uppercase mb-4 ml-4">Weekly Vibe</Text>
            <View className="flex-row justify-between bg-white/[0.03] p-4 rounded-3xl border border-white/5 shadow-md shadow-black/30">
               {Array.from({ length: 7 }).map((_, i) => (
                  <View key={i} className={`w-[12%] aspect-square rounded-full overflow-hidden items-center justify-center ${profile?.calendarSnaps && profile.calendarSnaps[i] ? 'border border-white/20' : 'bg-white/5 border border-white/5'}`}>
                    {profile?.calendarSnaps && profile.calendarSnaps[i] ? (
                       <Image source={{ uri: profile.calendarSnaps[i] }} className="w-full h-full" />
                    ) : (
                       <View className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    )}
                  </View>
               ))}
            </View>
          </View>

          {/* MACRO GOALS CARD */}
          <View className="px-6 mb-10">
            <View className="flex-row justify-between items-end mb-4 ml-4">
              <Text className="text-white/30 text-[11px] font-black tracking-[4px] uppercase">Nutrition Targets</Text>
              <TouchableOpacity onPress={() => setIsEditingMacros(true)}>
                <Text className="text-[#7dd3fc] text-[10px] font-bold uppercase tracking-widest">Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View className="bg-white/[0.03] rounded-[32px] border border-white/5 overflow-hidden p-6">
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-full bg-[#7ad7c6]/20 items-center justify-center border border-[#7ad7c6]/30">
                    <Ionicons name="flame" size={20} color="#7ad7c6" />
                  </View>
                  <View>
                    <Text className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-1">Daily Calories</Text>
                    <Text className="text-white font-black text-2xl">{profile?.dailyCaloriesGoal || '---'} <Text className="text-white/40 text-sm font-bold">kcal</Text></Text>
                  </View>
                </View>
              </View>

              <View className="flex-row justify-between border-t border-white/5 pt-5">
                <View className="items-center flex-1">
                  <Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Protein</Text>
                  <Text className="text-white font-bold text-lg">{profile?.proteinGoal || '-'}g</Text>
                </View>
                <View className="items-center flex-1 border-x border-white/5">
                  <Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Carbs</Text>
                  <Text className="text-white font-bold text-lg">{profile?.carbsGoal || '-'}g</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Fats</Text>
                  <Text className="text-white font-bold text-lg">{profile?.fatGoal || '-'}g</Text>
                </View>
              </View>
            </View>
          </View>

          {/* GALLERY GRID */}
          <View className="px-6">
            <View className="flex-row justify-between items-end mb-6 px-2">
              <View><Text className="text-white/50 text-[10px] font-black tracking-[3px] uppercase mb-1">Portfolio</Text><Text className="text-white text-2xl font-bold tracking-tight">Gallery</Text></View>
            </View>
            
            {myPosts.length === 0 ? (
              <View className="rounded-[40px] p-10 border border-dashed border-white/10 items-center bg-white/[0.02]">
                <Ionicons name="images-outline" size={40} color="#555" />
                <Text className="text-white/40 mt-4 font-body-md text-center">Your gallery is empty.</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
                {myPosts.map((post) => (
                  <TouchableOpacity 
                    key={post.id} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPost(post);
                    }}
                    style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }} 
                    className="overflow-hidden bg-white/5 rounded-xl"
                  >
                    <Image source={{ uri: post.mediaUrl }} className="w-full h-full" />
                    
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
            )}
          </View>

        </Animated.View>
      </Animated.ScrollView>

      {/* --- MODAL POST VIEWER (FULL SCREEN) --- */}
      <Modal visible={selectedPost !== null} animationType="fade" transparent={true} onRequestClose={() => setSelectedPost(null)}>
        <BlurView intensity={95} tint="dark" className="flex-1 justify-center relative">
          <View className="absolute inset-0 bg-[#090E17]/80" />
          
          <TouchableOpacity 
            onPress={() => setSelectedPost(null)} 
            style={{ top: insets.top + 10 }}
            className="absolute right-6 z-50 w-10 h-10 bg-white/10 rounded-full items-center justify-center border border-white/20"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="px-4" style={{ height: Dimensions.get('window').height * 0.75 }}>
            {selectedPost && (
               <LiquidPostCard 
                 post={selectedPost}
                 onOpenComments={() => Alert.alert("Comentarii", "Pentru a lăsa un comentariu, accesează postarea din tab-ul de Feed.")}
                 onPostDeleted={(id) => {
                   setMyPosts(curr => curr.filter(p => p.id !== id));
                   setSelectedPost(null);
                 }}
                 onUserBlocked={() => {}}
                 onEditCaption={(id, text) => {
                   Alert.alert("Info", "Te rugăm să editezi descrierea din meniul postării de pe Feed.");
                 }}
               />
            )}
          </View>
        </BlurView>
      </Modal>

      {/* --- MODAL SETTINGS (ROTIȚA) --- */}
      <Modal visible={showSettings} animationType="slide" transparent={true} onRequestClose={() => setShowSettings(false)}>
        <View className="flex-1 justify-end">
          <TouchableOpacity className="flex-1 bg-black/60" onPress={() => setShowSettings(false)} />
          <BlurView intensity={90} tint="dark" className="p-6 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-10">
            <View className="absolute inset-0 bg-[#090E17]/80" />
            <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6" />
            <Text className="text-white font-black text-2xl mb-6 text-center tracking-tight">Settings</Text>

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

      {/* --- MODAL EDITARE MACROS --- */}
      <Modal visible={isEditingMacros} animationType="slide" transparent={true} onRequestClose={() => setIsEditingMacros(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1 bg-black/60" onPress={() => setIsEditingMacros(false)} />
          <BlurView intensity={90} tint="dark" className="p-8 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
            <View className="absolute inset-0 bg-[#090E17]/80" />
            <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6" />
            <Text className="text-white font-black text-2xl mb-2 text-center tracking-tight">Daily Targets</Text>
            <Text className="text-white/40 text-sm text-center mb-8">Set your nutrition goals for AI analysis.</Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              <View className="w-[48%]">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Calories</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={macrosForm.cal} onChangeText={(v) => setMacrosForm(p => ({ ...p, cal: v }))} className="text-white font-bold text-lg" placeholder="e.g. 2500" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
              <View className="w-[48%]">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Protein (g)</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={macrosForm.pro} onChangeText={(v) => setMacrosForm(p => ({ ...p, pro: v }))} className="text-white font-bold text-lg" placeholder="e.g. 150" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
              <View className="w-[48%]">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Carbs (g)</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={macrosForm.carb} onChangeText={(v) => setMacrosForm(p => ({ ...p, carb: v }))} className="text-white font-bold text-lg" placeholder="e.g. 250" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
              <View className="w-[48%]">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Fats (g)</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={macrosForm.fat} onChangeText={(v) => setMacrosForm(p => ({ ...p, fat: v }))} className="text-white font-bold text-lg" placeholder="e.g. 80" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={handleSaveMacros} disabled={isSavingMacros} className="mt-8 mb-4">
              <LinearGradient colors={['#7ad7c6', '#7dd3fc']} className="w-full h-14 rounded-2xl items-center justify-center flex-row shadow-[0_0_20px_rgba(122,215,198,0.3)]">
                {isSavingMacros ? <ActivityIndicator color="#090E17" /> : <Text className="text-[#090E17] font-black text-lg tracking-wider">SAVE TARGETS</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MODAL BLOCKED USERS --- */}
      <Modal visible={showBlockedUsers} animationType="slide" transparent={true} onRequestClose={() => setShowBlockedUsers(false)}>
        <View className="flex-1 justify-end">
          <TouchableOpacity className="flex-1 bg-black/60" onPress={() => setShowBlockedUsers(false)} />
          <BlurView intensity={90} tint="dark" className="h-[70%] p-6 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
            <View className="absolute inset-0 bg-[#090E17]/80" />
            <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6" />
            <Text className="text-white font-black text-2xl mb-2 text-center tracking-tight">Blocked Users</Text>
            <Text className="text-white/40 text-sm text-center mb-6">These users cannot see your posts or profile.</Text>

            {loadingBlocked ? (
              <ActivityIndicator color="#7dd3fc" className="mt-10" />
            ) : blockedUsers.length === 0 ? (
              <View className="items-center mt-10">
                <Ionicons name="shield-checkmark" size={40} color="#555" />
                <Text className="text-white/40 mt-4 text-center">Nu ai niciun utilizator blocat.</Text>
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

    </View>
  );
}