import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';

interface UserListModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  users: any[];
  loading: boolean;
  onUserTap?: (userId: string) => void;
}

export default function UserListModal({ visible, onClose, title, users, loading, onUserTap }: UserListModalProps) {
  return (
    <SwipeableModal visible={visible} onClose={onClose} title={title} subtitle={`${users.length} ${users.length === 1 ? 'person' : 'people'}`} heightRatio={0.75}>
      {loading ? (
        <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
      ) : users.length === 0 ? (
        <View className="items-center mt-10">
          <Ionicons name="people-outline" size={32} color="rgba(255,255,255,0.06)" />
          <Text className="text-white/20 mt-3 text-[10px] font-semibold tracking-wider uppercase">No users found</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => onUserTap && onUserTap(item.id)} className="flex-row items-center justify-between py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.06]">
                  {item.profilePicUrl ? <Image source={{ uri: item.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white/60 font-semibold text-sm">{item.username.charAt(0).toUpperCase()}</Text>}
                </View>
                <Text className="text-white font-semibold text-[15px] tracking-wide">{item.username}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.15)" />
            </TouchableOpacity>
          )}
        />
      )}
    </SwipeableModal>
  );
}