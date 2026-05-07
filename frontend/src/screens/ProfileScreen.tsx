import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, TextInput, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import BouncyPressable from '../components/BouncyPressable';

const HEADER_HEIGHT = 180;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout, username } = useContext(AuthContext);

  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isUploadingPic, setIsUploadingPic] = useState(false);

  // --- ANIMATIONS ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;

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
      mediaTypes: ['images'],
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

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Animated.View style={{ opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
          
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
              <TouchableOpacity onPress={() => setIsEditingBio(true)} className="mt-4 px-8">
                <Text className="text-white/60 text-center font-body-md text-sm leading-6">{profile?.bio || "Tap here to write your bio..."}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="px-5 mb-10">
            <View className="flex-row justify-between items-center py-5 px-6 rounded-full border border-white/10 bg-white/[0.03] shadow-lg shadow-black/50">
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{profile?.followersCount || 0}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Followers</Text></View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{profile?.followingCount || 0}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Following</Text></View>
              <View className="w-[1px] h-8 bg-white/10" />
              <View className="items-center flex-1"><Text className="text-white font-black text-2xl">{myPosts.length}</Text><Text className="text-white/40 text-[10px] uppercase tracking-widest font-bold mt-1">Snaps</Text></View>
            </View>
          </View>

          <View className="px-6 mb-10">
            <Text className="text-white/30 text-[11px] font-black tracking-[4px] uppercase mb-4 ml-4">Settings</Text>
            <View className="bg-white/[0.03] rounded-[32px] border border-white/5 overflow-hidden">
              <BouncyPressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <View className="flex-row items-center justify-between p-5 border-b border-white/5">
                  <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="notifications" size={18} color="white" /></View><Text className="text-white/90 font-bold text-base">Notifications</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#555" />
                </View>
              </BouncyPressable>
              <BouncyPressable onPress={logout}>
                <View className="flex-row items-center justify-between p-5 border-b border-white/5">
                  <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="log-out" size={18} color="white" /></View><Text className="text-white/90 font-bold text-base">Sign Out</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#555" />
                </View>
              </BouncyPressable>
              <BouncyPressable onPress={handleDeleteAccount}>
                <View className="flex-row items-center justify-between p-5">
                  <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center"><Ionicons name="trash" size={18} color="#ff4b4b" /></View><Text className="text-[#ff4b4b] font-bold text-base">Delete Account</Text></View>
                  <Ionicons name="chevron-forward" size={18} color="#ff4b4b" />
                </View>
              </BouncyPressable>
            </View>
          </View>

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
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {myPosts.map((post) => (
                  <BouncyPressable key={post.id} className="w-[48%] aspect-[0.75] rounded-[32px] overflow-hidden border border-white/5 bg-white/5">
                    <Image source={{ uri: post.mediaUrl }} className="w-full h-full" />
                    <LinearGradient colors={['transparent', 'rgba(6,9,14,0.9)']} className="absolute inset-0 justify-end p-4">
                      {post.calories && (
                        <View className="absolute top-3 right-3 bg-white/10 px-2 py-1 rounded-md flex-row items-center gap-1">
                          <Ionicons name="flame" size={10} color="white" />
                          <Text className="text-white text-[10px] font-bold">{post.calories}</Text>
                        </View>
                      )}
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons name="heart" size={14} color="white" />
                        <Text className="text-white text-xs font-bold">{post.likesCount}</Text>
                      </View>
                    </LinearGradient>
                  </BouncyPressable>
                ))}
              </View>
            )}
          </View>

        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}