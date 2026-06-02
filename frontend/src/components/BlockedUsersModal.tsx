import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal, { ModalScrollContext } from './SwipeableModal';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface BlockedUsersModalProps {
  visible: boolean;
  onClose: () => void;
  blockedUsers: any[];
  loadingBlocked: boolean;
  onUnblockUser: (userId: string) => void;
}

export default function BlockedUsersModal({ visible, onClose, blockedUsers, loadingBlocked, onUnblockUser }: BlockedUsersModalProps) {
  return (
    <SwipeableModal visible={visible} onClose={onClose} title="Blocked Users" subtitle="These users cannot see your posts" heightRatio={0.65}>
      <ModalScrollContext.Consumer>
        {(scrollContext) => loadingBlocked ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : blockedUsers.length === 0 ? (
          <View className="items-center mt-10">
            <Ionicons name="shield-checkmark-outline" size={32} color="rgba(255,255,255,0.06)" />
            <Text className="text-white/20 mt-3 text-[10px] font-semibold tracking-wider uppercase">No blocked users</Text>
          </View>
        ) : (
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onScroll={scrollContext?.onScroll}
            scrollEventThrottle={scrollContext?.scrollEventThrottle}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 8 }}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between py-3" style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.06]">
                    {item.profilePicUrl ? <Image source={{ uri: optimizedThumbUrl(item.profilePicUrl, 100) }} className="w-full h-full" /> : <Text className="text-white/60 font-semibold text-sm">{item.username.charAt(0).toUpperCase()}</Text>}
                  </View>
                  <Text className="text-white font-semibold text-[15px] tracking-wide">{item.username}</Text>
                </View>
                <TouchableOpacity onPress={() => onUnblockUser(item.id)} style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 11 }}>Unblock</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </ModalScrollContext.Consumer>
    </SwipeableModal>
  );
}