import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';
import ImagePopoutModal from './ImagePopoutModal';
import { api } from '../services/api';

interface ReactionListModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReactionListModal({ visible, onClose, postId }: ReactionListModalProps) {
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (visible && postId) {
      setLoading(true);
      api.get(`/interactions/${postId}/reactions`)
        .then(res => setReactions(res.data))
        .catch(() => setReactions([]))
        .finally(() => setLoading(false));
    }
  }, [visible, postId]);

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d`;
  };

  return (
    <>
      <SwipeableModal visible={visible} onClose={onClose}>
        <BlurView 
          intensity={80} 
          tint="dark" 
          style={{ height: SCREEN_HEIGHT * 0.6, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}
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
            <Text className="text-white font-bold text-lg text-center tracking-tight">Reactions</Text>
            <Text className="text-white/25 text-[9px] text-center mt-1 uppercase tracking-widest">{reactions.length} reaction{reactions.length !== 1 ? 's' : ''}</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
          ) : reactions.length === 0 ? (
            <View className="items-center mt-10">
              <Ionicons name="heart-outline" size={32} color="rgba(255,255,255,0.06)" />
              <Text className="text-white/20 mt-3 text-[10px] font-semibold tracking-wider uppercase">No reactions yet</Text>
            </View>
          ) : (
            <FlatList
              data={reactions}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16, paddingTop: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => setSelectedImage(item.mediaUrl)}
                  className="flex-row items-center py-3"
                  style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' }}
                >
                  <View className="w-9 h-9 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.06] mr-3">
                    {item.profilePicUrl ? (
                      <Image source={{ uri: item.profilePicUrl }} className="w-full h-full" />
                    ) : (
                      <Text className="text-white/60 font-semibold text-sm">{item.username?.charAt(0)?.toUpperCase()}</Text>
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-[14px] tracking-wide">{item.username}</Text>
                    <Text className="text-white/30 text-[9px] font-semibold uppercase tracking-widest mt-0.5">{getRelativeTime(item.createdAt)}</Text>
                  </View>

                  <View style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <Image source={{ uri: item.mediaUrl }} className="w-full h-full" resizeMode="cover" />
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </BlurView>
      </SwipeableModal>

      <ImagePopoutModal visible={selectedImage !== null} imageUri={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
}
