import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, PanResponder, ActivityIndicator, FlatList, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface BlockedUsersModalProps {
  visible: boolean;
  onClose: () => void;
  blockedUsers: any[];
  loadingBlocked: boolean;
  onUnblockUser: (userId: string) => void;
}

import SwipeableModal from './SwipeableModal';

export default function BlockedUsersModal({ visible, onClose, blockedUsers, loadingBlocked, onUnblockUser }: BlockedUsersModalProps) {

  return (
    <SwipeableModal visible={visible} onClose={onClose}>
        <BlurView intensity={90} tint="dark" className="h-[70%] p-6 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pt-12">
          <View className="absolute inset-0 bg-[#090E17]/80" />

          <TouchableOpacity onPress={onClose} className="absolute top-4 right-6 z-50 w-8 h-8 bg-white/10 rounded-full items-center justify-center border border-white/20">
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
                  <TouchableOpacity onPress={() => onUnblockUser(item.id)} className="bg-white/10 px-4 py-2 rounded-full border border-white/10">
                    <Text className="text-white font-bold text-xs">Unblock</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </BlurView>
    </SwipeableModal>
  );
}
