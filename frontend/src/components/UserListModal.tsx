import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    <SwipeableModal visible={visible} onClose={onClose}>
      <BlurView 
        intensity={80} 
        tint="dark" 
        style={{ height: SCREEN_HEIGHT * 0.7, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,14,23,0.93)' }} />
        
        {/* Drag handle */}
        <View style={{ width: '100%', alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </View>
        
        {/* X button */}
        <TouchableOpacity 
          onPress={onClose} 
          style={{ position: 'absolute', top: 14, right: 18, zIndex: 50, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={15} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 4 }}>
          <Text className="text-white font-bold text-lg text-center tracking-tight">{title}</Text>
          <Text className="text-white/25 text-[9px] text-center mt-1 uppercase tracking-widest">{users.length} {users.length === 1 ? 'person' : 'people'}</Text>
        </View>

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
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => onUserTap && onUserTap(item.id)}
                className="flex-row items-center justify-between py-3"
                style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.06]">
                    {item.profilePicUrl ? (
                      <Image source={{ uri: item.profilePicUrl }} className="w-full h-full" />
                    ) : (
                      <Text className="text-white/60 font-semibold text-sm">{item.username.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <Text className="text-white font-semibold text-[15px] tracking-wide">{item.username}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.15)" />
              </TouchableOpacity>
            )}
          />
        )}
      </BlurView>
    </SwipeableModal>
  );
}
