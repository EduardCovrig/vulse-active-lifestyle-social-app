/**
 * ImagePopoutModal - A self-contained, crash-safe image viewer with pinch-to-zoom.
 *
 * KEY DESIGN DECISIONS:
 * - Never renders nested Modals (they fight gesture responders)
 * - Uses isClosing + isOpen refs to guarantee onClose fires exactly once
 * - ReactionsPanel is an absolute overlay inside the same Modal (not a nested Modal)
 * - PinchableImage handles all zoom/pan gestures, single-tap closes the modal
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { api } from '../services/api';
import PinchableImage from './PinchableImage';
import { optimizedImageUrl, optimizedThumbUrl } from '../utils/cloudinaryUrl';

const { width, height } = Dimensions.get('window');

interface ImagePopoutModalProps {
  visible: boolean;
  imageUri?: string | null;
  post?: any;
  onClose: () => void;
  onOpenComments?: (postId: string) => void;
  onReactRequest?: (postId: string) => void;
  onLikeToggled?: (postId: string, isLiked: boolean) => void;
}

// Inline Reactions Panel — rendered as an absolute view inside the SAME Modal.
// This avoids the nested-Modal gesture-responder freeze entirely.
function ReactionsPanel({ postId, onClose }: { postId: string; onClose: () => void }) {
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/interactions/${postId}/reactions`)
      .then(res => setReactions(res.data))
      .catch(() => setReactions([]))
      .finally(() => setLoading(false));
  }, [postId]);

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
    <View style={{ position: 'absolute', inset: 0, zIndex: 999, borderRadius: 36, overflow: 'hidden' }}>
      <BlurView intensity={85} tint="dark" style={{ flex: 1 }}>
        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(9,14,23,0.92)' }} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Reactions</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
          ) : reactions.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="heart-outline" size={36} color="rgba(255,255,255,0.1)" />
              <Text style={{ color: 'rgba(255,255,255,0.2)', marginTop: 12, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>No reactions yet</Text>
            </View>
          ) : (
            <FlatList
              data={reactions}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
                    {item.profilePicUrl
                      ? <Image source={{ uri: optimizedThumbUrl(item.profilePicUrl, 100) }} style={{ width: '100%', height: '100%' }} />
                      : <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 14 }}>{item.username?.charAt(0)?.toUpperCase()}</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>{item.username}</Text>
                    {item.message ? <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }} numberOfLines={2}>{item.message}</Text> : null}
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{getRelativeTime(item.createdAt)}</Text>
                  </View>
                  {item.mediaUrl && (
                    <View style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                      <Image source={{ uri: optimizedThumbUrl(item.mediaUrl, 200) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </BlurView>
    </View>
  );
}

export default function ImagePopoutModal({
  visible,
  imageUri,
  post,
  onClose,
  onOpenComments,
  onReactRequest,
  onLikeToggled,
}: ImagePopoutModalProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.92)).current;
  const isClosing  = useRef(false);
  const isOpen     = useRef(false);

  const [internalVisible, setInternalVisible] = useState(false);
  const [showReactions, setShowReactions]     = useState(false);
  const [isLiked, setIsLiked]                 = useState(false);
  const [likesCount, setLikesCount]           = useState(0);

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked || false);
      setLikesCount(post.likesCount || 0);
    }
  }, [post?.id, post?.isLiked, post?.likesCount]);

  const targetUri = post ? optimizedImageUrl(post.mediaUrl) : optimizedImageUrl(imageUri);

  // ── Open ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible && targetUri && !isOpen.current) {
      isOpen.current    = true;
      isClosing.current = false;
      setShowReactions(false);
      setInternalVisible(true);
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.92);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.spring(scaleAnim,  { toValue: 1, useNativeDriver: true, bounciness: 10, speed: 14 }),
      ]).start();
    }

    if (!visible && isOpen.current && !isClosing.current) {
      performClose();
    }
  }, [visible, targetUri]);

  // ── Close ─────────────────────────────────────────────────────────────
  const performClose = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    isOpen.current    = false;
    setShowReactions(false);

    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim,   { toValue: 0.94, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      isClosing.current = false;
      setInternalVisible(false);
      onClose();
    });
  }, [onClose]);

  const toggleLike = async () => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    if (onLikeToggled) onLikeToggled(post.id, newLiked);
    try { await api.post(`/interactions/${post.id}/like`); } catch (_) {}
  };

  if (!internalVisible) return null;

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={performClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>

        {/* Blurred backdrop — tap to close */}
        <Animated.View style={{ position: 'absolute', inset: 0, opacity: opacityAnim }}>
          <BlurView intensity={80} tint="dark" style={{ flex: 1 }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={performClose} />
          </BlurView>
        </Animated.View>

        {/* Image card */}
        <Animated.View
          style={{
            width: width * 0.94,
            height: height * 0.80,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            borderRadius: 36,
            overflow: 'hidden',
            backgroundColor: '#06090E',
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.12)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.6,
            shadowRadius: 30,
          }}
        >
          {/* ── Main image with pinch-to-zoom. Single-tap closes. ── */}
          {targetUri && (
            <PinchableImage uri={targetUri} onSingleTap={performClose} />
          )}

          {/* Front camera overlay (BeReal thumbnail) */}
          {post?.frontMediaUrl && (
            <View style={{ position: 'absolute', top: 20, right: 20, width: 100, height: 130, borderRadius: 16, borderWidth: 2, borderColor: 'white', overflow: 'hidden', zIndex: 10 }}>
              {post.frontMediaUrl.toLowerCase().endsWith('.mp4') || post.frontMediaUrl.toLowerCase().endsWith('.mov') ? (
                <Video source={{ uri: post.frontMediaUrl }} style={{ width: '100%', height: '100%' }} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={true} />
              ) : (
                <Image source={{ uri: optimizedThumbUrl(post.frontMediaUrl) }} style={{ width: '100%', height: '100%' }} />
              )}
            </View>
          )}

          {/* Gradient overlays */}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.75)']}
            locations={[0, 0.4, 1]}
            style={{ position: 'absolute', inset: 0 }}
            pointerEvents="none"
          />

          {/* Close button (top-right) */}
          <TouchableOpacity
            onPress={performClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ position: 'absolute', top: 16, right: 16, zIndex: 50, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>

          {/* Author info (top-left) */}
          {post?.author && (
            <View style={{ position: 'absolute', top: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 20 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                {post.author.profilePicUrl
                  ? <Image source={{ uri: optimizedThumbUrl(post.author.profilePicUrl, 100) }} style={{ width: '100%', height: '100%' }} />
                  : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{post.author.username?.charAt(0)?.toUpperCase() || 'V'}</Text>
                }
              </View>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                {post.author.username}
              </Text>
            </View>
          )}

          {/* Footer: caption + interactions */}
          {post && (
            <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 20 }}>
              {post.caption && (
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500', marginBottom: 16, lineHeight: 20 }}>
                  {post.caption}
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Left: like, comment, react */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                  <TouchableOpacity onPress={toggleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? '#ff4b4b' : 'white'} />
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{likesCount}</Text>
                  </TouchableOpacity>

                  {post.type !== 'DAILY' && onOpenComments && (
                    <TouchableOpacity
                      onPress={() => { performClose(); setTimeout(() => onOpenComments(post.id), 300); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Ionicons name="chatbubble-outline" size={26} color="white" />
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{post.commentsCount || 0}</Text>
                    </TouchableOpacity>
                  )}

                  {post.type !== 'REEL' && onReactRequest && (
                    <TouchableOpacity
                      onPress={() => { performClose(); setTimeout(() => onReactRequest(post.id), 300); }}
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Ionicons name="camera-outline" size={18} color="white" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Right: reactions + calories */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {post.recentReactions?.length > 0 && post.type !== 'REEL' && (
                    <TouchableOpacity onPress={() => setShowReactions(true)} style={{ flexDirection: 'row' }} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                      {post.recentReactions.slice(0, 3).map((uri: string, idx: number) => (
                        <View key={idx} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginLeft: idx > 0 ? -10 : 0 }}>
                          <Image source={{ uri: optimizedThumbUrl(uri, 100) }} style={{ width: '100%', height: '100%' }} />
                        </View>
                      ))}
                    </TouchableOpacity>
                  )}
                  {post.calories && (
                    <View style={{ backgroundColor: 'rgba(122,215,198,0.2)', borderWidth: 0.5, borderColor: 'rgba(122,215,198,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="flame" size={12} color="#7ad7c6" />
                      <Text style={{ color: '#7ad7c6', fontWeight: '900', fontSize: 11 }}>{post.calories}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Inline Reactions Panel — no nested Modal */}
          {showReactions && post?.id && (
            <ReactionsPanel postId={post.id} onClose={() => setShowReactions(false)} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
