import React from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import BouncyPressable from './BouncyPressable';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

const { width } = Dimensions.get('window');
const GRID_GAP = 2;
const ITEM_WIDTH = (width - 8 - (GRID_GAP * 2)) / 3;

interface ProfileGridProps {
  profile: any;
  myPosts: any[];
  calendarSnaps: any[];
  animateStreak: () => void;
  streakScale: any;
  spinInterpolate: any;
  openCalendar: () => void;
  handleUploadReelChoice: () => void;
  setSelectedPost: (post: any) => void;
}

export default function ProfileGrid({
  profile,
  myPosts,
  calendarSnaps,
  animateStreak,
  streakScale,
  spinInterpolate,
  openCalendar,
  handleUploadReelChoice,
  setSelectedPost,
}: ProfileGridProps) {
  return (
    <>
      {/* WEEKLY VIBE - WITH STREAK ANIMATION */}
      <BouncyPressable onPress={openCalendar} className="mx-6 bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-5 mb-8 overflow-hidden relative shadow-sm shadow-black/20">
        <LinearGradient colors={['rgba(122, 215, 198, 0.04)', 'transparent']} className="absolute inset-0" />
        <View className="flex-row items-center justify-between mb-4 relative z-10">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={16} color="#7ad7c6" />
            <Text className="text-[#7ad7c6] font-bold text-[11px] tracking-widest uppercase">Your Week</Text>
          </View>
          {profile?.streak > 0 && (
            <TouchableOpacity onPress={animateStreak} activeOpacity={1}>
              <Animated.View style={{ transform: [{ scale: streakScale }, { rotate: spinInterpolate }] }} className="bg-orange-500/20 border border-orange-500/30 px-2.5 rounded-full flex-row items-center justify-center py-2.5 gap-x-1.5 shadow-[0_0_10px_rgba(255,138,0,0.2)]">
                 <Ionicons name="flame" size={11} color="#ff8a00" />
                 <Text className="text-[#ff8a00] font-black text-[10px] uppercase pt-0.5">{profile.streak} STREAK  </Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
        <View className="flex-row justify-between relative z-10">
          {[...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
            const snap = calendarSnaps.find((s: any) => s.date === dateStr);
            return (
              <View key={i} style={{ width: '12.5%', aspectRatio: 0.75, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: snap ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' }}>
                {snap ? (
                  <Image source={{ uri: optimizedThumbUrl(snap.mediaUrl, 150) }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
                ) : (
                  <Ionicons name="camera-outline" size={12} color="rgba(255,255,255,0.1)" />
                )}
                <View style={{ position: 'absolute', bottom: 4 }}>
                  <Text style={{ fontSize: 8, fontWeight: '700', color: snap ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{dayLabel}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </BouncyPressable>

      {/* GLOBAL PROFILE GRID */}
      <View className="px-1">
        <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
          <TouchableOpacity 
            onPress={handleUploadReelChoice}
            style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
            className="overflow-hidden bg-white/[0.03] rounded-lg border border-dashed border-white/[0.1] items-center justify-center"
          >
            <Ionicons name="videocam-outline" size={28} color="rgba(255,255,255,0.3)" />
            <Text className="text-white/30 text-[9px] uppercase font-bold mt-2 tracking-widest">Upload</Text>
          </TouchableOpacity>

          {myPosts.map((post) => (
            <TouchableOpacity 
              key={post.id} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPost(post);
              }}
              activeOpacity={0.8}
              style={{ width: ITEM_WIDTH, height: ITEM_WIDTH, marginBottom: GRID_GAP }} 
              className="overflow-hidden bg-white/[0.03] rounded-lg relative"
            >
              <Image source={{ uri: optimizedThumbUrl(post.mediaUrl) }} className="w-full h-full" resizeMode="cover" />
              
              <View className="absolute bottom-1.5 left-1.5 flex-row gap-1">
                {post.calories && (
                   <View className="bg-black/50 rounded-full flex-row items-center px-1.5 py-0.5 gap-1">
                     <Ionicons name="flame" size={8} color="#7ad7c6" />
                   </View>
                )}
                {post.type === 'REEL' && (
                   <View className="bg-black/50 rounded-full flex-row items-center px-1.5 py-0.5 gap-1">
                     <Ionicons name="play" size={8} color="rgba(255,255,255,0.8)" />
                   </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}
