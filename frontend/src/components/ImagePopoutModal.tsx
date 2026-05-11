import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, TouchableOpacity, Dimensions, Animated, Easing, Text, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import PinchableImage from './PinchableImage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

interface ImagePopoutModalProps {
  visible: boolean;
  imageUri?: string | null;
  post?: any;
  onClose: () => void;
  onOpenComments?: (postId: string) => void;
  onReactRequest?: (postId: string) => void;
}

export default function ImagePopoutModal({ visible, imageUri, post, onClose, onOpenComments, onReactRequest }: ImagePopoutModalProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked || false);
      setLikesCount(post.likesCount || 0);
    }
  }, [post]);

  const targetUri = post ? post.mediaUrl : imageUri;

  useEffect(() => {
    if (visible && targetUri) {
      setIsAnimating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 8, speed: 16 })
      ]).start(() => setIsAnimating(false));
    } else if (!visible && !isAnimating && (opacityAnim as any)._value > 0) {
      closeAnim();
    }
  }, [visible, targetUri]);

  const closeAnim = () => {
    setIsAnimating(true);
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setIsAnimating(false);
      onClose();
    });
  };

  const toggleLike = async () => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    try { await api.post(`/interactions/${post.id}/like`); } 
    catch (error) {}
  };

  if (!visible && !isAnimating) return null;

  return (
    <Modal visible={visible || isAnimating} transparent={true} animationType="none" onRequestClose={closeAnim}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Fundal Blurat - Tapping outside the image closes it */}
        <Animated.View style={{ position: 'absolute', inset: 0, opacity: opacityAnim }}>
          <BlurView intensity={90} tint="dark" style={{ flex: 1 }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeAnim} />
          </BlurView>
        </Animated.View>

        {/* Containerul Pozei */}
        <Animated.View 
          style={{ 
            width: width * 0.95, 
            height: height * 0.82, 
            transform: [{ scale: scaleAnim }], 
            opacity: opacityAnim, 
            borderRadius: 36, 
            overflow: 'hidden', 
            backgroundColor: '#06090E', 
            borderWidth: 1, 
            borderColor: 'rgba(255,255,255,0.15)', 
            shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 30 
          }}
        >
           {/* THE IMAGE GESTURE LAYER - A simple tap here closes the modal */}
           {targetUri && <PinchableImage uri={targetUri} onSingleTap={closeAnim} />}

           {/* THE INTERACTIVE LAYER OVER TOP */}
           {post && (
             <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
               <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']} locations={[0, 0.4, 1]} style={{ position: 'absolute', inset: 0 }} pointerEvents="none" />
               
               {/* Header (Author) */}
               <View style={{ position: 'absolute', top: 20, left: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }} pointerEvents="box-none">
                 <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                   {post.author?.profilePicUrl ? (
                     <Image source={{ uri: post.author.profilePicUrl }} style={{ width: '100%', height: '100%' }} />
                   ) : (
                     <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{post.author?.username?.charAt(0).toUpperCase()}</Text>
                   )}
                 </View>
                 <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 4 }}>{post.author?.username}</Text>
               </View>

               {/* Footer (Interactions & Caption) */}
               <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }} pointerEvents="box-none">
                 {post.caption && (
                   <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: '500', marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 4 }}>
                     {post.caption}
                   </Text>
                 )}
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} pointerEvents="box-none">
                   
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }} pointerEvents="box-none">
                     <TouchableOpacity onPress={toggleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                       <Ionicons name={isLiked ? "heart" : "heart-outline"} size={30} color={isLiked ? "#ff4b4b" : "white"} />
                       <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{likesCount}</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity onPress={() => { closeAnim(); setTimeout(() => onOpenComments && onOpenComments(post.id), 250); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                       <Ionicons name="chatbubble-outline" size={28} color="white" />
                       <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>{post.commentsCount || 0}</Text>
                     </TouchableOpacity>

                     <TouchableOpacity onPress={() => { closeAnim(); setTimeout(() => onReactRequest && onReactRequest(post.id), 250); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                       <Ionicons name="camera-outline" size={18} color="white" />
                     </TouchableOpacity>
                   </View>

                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} pointerEvents="box-none">
                     {post.recentReactions?.length > 0 && (
                        <View style={{ flexDirection: 'row-reverse' }}>
                          {post.recentReactions.slice(0,3).map((uri: string, idx: number) => (
                            <View key={idx} style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginLeft: idx > 0 ? -12 : 0 }}>
                              <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                            </View>
                          ))}
                        </View>
                     )}
                     {post.calories && (
                        <View style={{ backgroundColor: 'rgba(122,215,198,0.25)', borderWidth: 0.5, borderColor: 'rgba(122,215,198,0.5)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="flame" size={12} color="#7ad7c6" />
                          <Text style={{ color: '#7ad7c6', fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>{post.calories}</Text>
                        </View>
                     )}
                   </View>
                 </View>
               </View>
             </View>
           )}
        </Animated.View>
      </View>
    </Modal>
  );
}