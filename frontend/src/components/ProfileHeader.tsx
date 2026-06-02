import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface ProfileHeaderProps {
  insets: any;
  profile: any;
  isUploadingPic: boolean;
  isEditingBio: boolean;
  newBio: string;
  setNewBio: (text: string) => void;
  setIsEditingBio: (editing: boolean) => void;
  handleSaveBio: () => void;
  handleChangeProfilePic: () => void;
  handleOpenDiscover: () => void;
  handleOpenNotifications: () => void;
  handleOpenSettings: () => void;
  unreadCount: number;
  spin: any;
  profilePicScale: any;
  headerTranslateY: any;
}

export default function ProfileHeader({
  insets,
  profile,
  isUploadingPic,
  isEditingBio,
  newBio,
  setNewBio,
  setIsEditingBio,
  handleSaveBio,
  handleChangeProfilePic,
  handleOpenDiscover,
  handleOpenNotifications,
  handleOpenSettings,
  unreadCount,
  spin,
  profilePicScale,
  headerTranslateY,
}: ProfileHeaderProps) {
  return (
    <>
      <Animated.View style={{ transform: [{ translateY: headerTranslateY }], position: 'absolute', top: 0, left: 0, right: 0, height: 180, zIndex: 1 }}>
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

      <View className="items-center px-6 mb-6 mt-6">
        <Animated.View style={{ transform: [{ scale: profilePicScale }] }} className="relative mb-4">
          <View className="p-[2px] rounded-full bg-white/15 shadow-xl shadow-black/50">
            <View className="w-[100px] h-[100px] rounded-full bg-[#0c1018] items-center justify-center overflow-hidden">
              {isUploadingPic ? (
                <ActivityIndicator color="white" />
              ) : profile?.profilePicUrl ? (
                <Image source={{ uri: optimizedThumbUrl(profile.profilePicUrl, 200) }} className="w-full h-full" />
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
    </>
  );
}
