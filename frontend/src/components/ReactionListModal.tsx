/**
 * ReactionListModal
 *
 * IMPORTANT: No nested Modals or ImagePopoutModals here.
 * Tapping a reaction image shows a full-screen preview INSIDE this same modal
 * using a local "selectedReaction" state + an absolute View overlay.
 * This avoids the nested-Modal gesture-responder freeze.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal, { ModalScrollContext } from './SwipeableModal';
import { api } from '../services/api';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface ReactionListModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null | undefined;
}

export default function ReactionListModal({ visible, onClose, postId }: ReactionListModalProps) {
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      setLoading(true);
      api.get(`/interactions/${postId}/reactions`)
        .then(res => setReactions(res.data))
        .catch(() => setReactions([]))
        .finally(() => setLoading(false));
    } else if (!visible) {
      // Reset when hidden so stale data doesn't flash
      setReactions([]);
    }
  }, [visible, postId]);

  const getRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    return `${Math.floor(diffH / 24)}d`;
  };

  return (
    <SwipeableModal
      visible={visible}
      onClose={onClose}
      title="Reactions"
      heightRatio={0.75}
    >
      <ModalScrollContext.Consumer>
        {(scrollContext) => loading ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : reactions.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="heart-outline" size={36} color="rgba(255,255,255,0.06)" />
            <Text style={{ color: 'rgba(255,255,255,0.2)', marginTop: 12, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
              No reactions yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={reactions}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            onScroll={scrollContext?.onScroll}
            scrollEventThrottle={scrollContext?.scrollEventThrottle}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 0.5,
                  borderBottomColor: 'rgba(255,255,255,0.04)',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderWidth: 0.5,
                    borderColor: 'rgba(255,255,255,0.06)',
                    marginRight: 12,
                  }}
                >
                  {item.profilePicUrl
                    ? <Image source={{ uri: optimizedThumbUrl(item.profilePicUrl, 100) }} style={{ width: '100%', height: '100%' }} />
                    : <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 14 }}>{item.username?.charAt(0)?.toUpperCase()}</Text>
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 14, letterSpacing: 0.2 }}>{item.username}</Text>
                  {item.message ? (
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                      {item.message}
                    </Text>
                  ) : null}
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                    {getRelativeTime(item.createdAt)}
                  </Text>
                </View>
                {item.mediaUrl && (
                  <View style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <Image source={{ uri: optimizedThumbUrl(item.mediaUrl, 200) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </View>
                )}
              </View>
            )}
          />
        )}
      </ModalScrollContext.Consumer>
    </SwipeableModal>
  );
}