import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface LockedFeedViewProps {
  circle: any[];
  onOpenCamera?: () => void;
}

export default function LockedFeedView({ circle, onOpenCamera }: LockedFeedViewProps) {
  // Filter out the current user and simulate friends' posts
  const friendsToSimulate = circle.filter(c => !c.isMe);
  
  // if there are no friends, show a default message card
  const displayFriends = friendsToSimulate.length > 0 ? friendsToSimulate : [
    { id: 'mock1', name: 'Add friends to see their snaps!', img: null },
  ];

  return (
    <View className="px-5 mt-2 mb-20">
      <Text className="text-white text-[28px] font-black text-center mb-2 tracking-tight px-4 leading-8">
        See what your friends are doing.
      </Text>
      <Text className="text-white/70 text-center mb-8 text-[15px] px-4">
        Share your active <Text className="text-[#7dd3fc] font-black">moment of the day</Text> with them!
      </Text>

      <TouchableOpacity 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (onOpenCamera) onOpenCamera();
        }} 
        className="w-full mb-10"
      >
        <LinearGradient 
          colors={['#7ad7c6', '#7dd3fc']} 
          start={{x:0, y:0}} 
          end={{x:1, y:1}} 
          className="rounded-[24px] items-center justify-center h-[64px] shadow-[0_0_30px_rgba(125,211,252,0.3)] border border-white/20"
        >
          <Text className="text-[#090E17] font-black text-[17px] tracking-widest">POST NOW</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* BLURRED CARDS SIMULATION */}
      <View className="flex-col gap-6">
        {displayFriends.map((f, i) => (
          <View key={f.id || i} className="w-full h-[400px] rounded-[36px] overflow-hidden bg-[#06090E] border border-white/10 relative items-center justify-center shadow-2xl">
            
            {/* Poza de profil pe fundal - Acum se foloseste transform scale pentru centrare perfecta */}
            {f.img ? (
              <Image 
                source={{ uri: f.img }} 
                className="absolute inset-0 w-full h-full opacity-60"
                style={{ transform: [{ scale: 1.6 }] }} // Mărește poza cu 60% pornind exact din centru
                blurRadius={15}
                resizeMode="cover"
              />
            ) : (
              <View className="absolute inset-0 w-full h-full bg-white/[0.03] items-center justify-center">
                 <Text className="text-white/10 font-bold text-6xl">{f.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            
            {/* Overlay negru pentru a face textul lizibil */}
            <View className="absolute inset-0 bg-black/40" />
            
            <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center border border-white/20 mb-4 backdrop-blur-md shadow-lg z-10">
              <Ionicons name="lock-closed" size={32} color="rgba(255,255,255,0.9)" />
            </View>
            <Text className="text-white/70 font-black tracking-[4px] uppercase text-xs text-center px-4 z-10">{f.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}