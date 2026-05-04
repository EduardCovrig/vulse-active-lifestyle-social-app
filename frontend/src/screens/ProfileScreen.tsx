import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useContext(AuthContext);
  
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stări pentru Editare Profil
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [isUploadingPic, setIsUploadingPic] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/posts/my-posts')
      ]);
      setProfile(profileRes.data);
      setNewBio(profileRes.data.bio || '');
      setMyPosts(postsRes.data);
    } catch (error) {
      console.error("Eroare load profil:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGICĂ UPLOAD POZĂ DE PROFIL REALĂ ---
  const handleUpdateProfilePic = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission needed", "We need access to your gallery to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsUploadingPic(true);
      try {
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('profilePic', { uri, name: filename, type } as any);

        await api.put('/users/me', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchProfileData(); // Refresh să vedem poza nouă de pe cloud
      } catch (error) {
        Alert.alert("Eroare", "Nu am putut actualiza poza.");
      } finally {
        setIsUploadingPic(false);
      }
    }
  };

  // --- LOGICĂ ACTUALIZARE BIO ---
  const handleUpdateBio = async () => {
    if (newBio === profile.bio) {
      setIsEditingBio(false);
      return;
    }
    
    try {
      // Backend-ul se așteaptă la x-www-form-urlencoded sau query params pt bio, aşa că îl trimitem corect
      await api.put(`/users/me?bio=${encodeURIComponent(newBio)}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditingBio(false);
      fetchProfileData();
    } catch (error) {
      Alert.alert("Eroare", "Nu am putut actualiza biografia.");
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Ștergere Cont", 
      "Ești sigur? Această acțiune va șterge definitiv toate postările și datele tale.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", style: "destructive", 
          onPress: async () => {
            try {
              await api.delete('/users/me');
              logout();
            } catch (e) {
              Alert.alert("Eroare", "Nu am putut șterge contul.");
            }
          } 
        }
      ]
    );
  };

  if (loading) return <View className="flex-1 bg-background justify-center items-center"><ActivityIndicator size="large" color="#c5eaff" /></View>;

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 150, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* PROFILE INFO */}
      <View className="items-center justify-center mb-10">
        <TouchableOpacity 
          className="w-32 h-32 rounded-full border border-white/20 p-1 bg-white/5 mb-4 overflow-hidden relative"
          onPress={handleUpdateProfilePic}
          disabled={isUploadingPic}
        >
          {profile?.profilePicUrl ? (
            <Image source={{ uri: profile.profilePicUrl }} className="w-full h-full rounded-full" />
          ) : (
            <View className="w-full h-full bg-primary/20 items-center justify-center rounded-full">
              <Ionicons name="camera" size={40} color="#7dd3fc" />
            </View>
          )}
          {isUploadingPic && (
            <View className="absolute inset-0 bg-black/60 items-center justify-center rounded-full">
              <ActivityIndicator color="white" />
            </View>
          )}
        </TouchableOpacity>
        
        <Text className="text-3xl font-extrabold text-primary tracking-tight">{profile?.username}</Text>
        
        {/* EDIT BIO INLINE */}
        {isEditingBio ? (
          <View className="flex-row items-center mt-2 border-b border-white/30 pb-1">
            <TextInput 
              value={newBio}
              onChangeText={setNewBio}
              className="text-white text-base text-center min-w-[200px]"
              autoFocus
              onSubmitEditing={handleUpdateBio}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleUpdateBio} className="ml-2 bg-primary/20 p-1.5 rounded-full">
               <Ionicons name="checkmark" size={16} color="#7dd3fc" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditingBio(true)} className="flex-row items-center mt-1">
            <Text className="text-on-surface-variant text-base">{profile?.bio || 'Tap to add bio ✍️'}</Text>
          </TouchableOpacity>
        )}
        
        <View className="flex-row gap-6 mt-6">
          <View className="items-center"><Text className="text-white font-bold text-lg">{myPosts.length}</Text><Text className="text-white/50 text-xs">Posts</Text></View>
          <View className="items-center"><Text className="text-white font-bold text-lg">{profile?.followersCount || 0}</Text><Text className="text-white/50 text-xs">Followers</Text></View>
          <View className="items-center"><Text className="text-white font-bold text-lg">{profile?.followingCount || 0}</Text><Text className="text-white/50 text-xs">Following</Text></View>
        </View>
      </View>

      {/* MY POSTS */}
      <Text className="text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-2">My Posts</Text>
      <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
        {myPosts.map(post => (
          <View key={post.id} className="w-[48%] h-48 rounded-2xl overflow-hidden border border-white/10 relative">
             <Image source={{ uri: post.mediaUrl }} className="w-full h-full" />
             <TouchableOpacity 
               className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full"
               onPress={async () => {
                 await api.delete(`/posts/${post.id}`);
                 fetchProfileData();
               }}
             >
               <Ionicons name="trash" size={16} color="#ff4b4b" />
             </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* SETTINGS */}
      <Text className="text-secondary text-xs font-bold tracking-widest uppercase mb-3 ml-2">Settings</Text>
      <BlurView intensity={40} tint="dark" className="rounded-3xl border border-white/15 overflow-hidden">
        <TouchableOpacity onPress={logout} className="flex-row justify-between items-center p-5 border-b border-white/10">
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="log-out" size={20} color="white" /></View>
            <Text className="text-white font-bold text-base">Sign Out</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteAccount} className="flex-row justify-between items-center p-5">
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center border border-red-500/30">
              <Ionicons name="trash" size={20} color="#ff4b4b" />
            </View>
            <Text className="text-[#ff4b4b] font-bold text-base">Delete Account</Text>
          </View>
        </TouchableOpacity>
      </BlurView>
    </ScrollView>
  );
}