import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { optimizedImageUrl } from '../utils/cloudinaryUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LockedFeedViewProps {
  circle: any[];
  onOpenCamera?: () => void;
}

export default function LockedFeedView({ circle, onOpenCamera }: LockedFeedViewProps) {
  const friendsToSimulate = circle.filter(c => !c.isMe);
  const displayFriends = friendsToSimulate.length > 0 ? friendsToSimulate : [
    { id: 'mock1', name: 'Add friends to see their snaps!', img: null },
  ];

  return (
    // No horizontal padding here — the parent FlatList already provides px-5 on each card
    // Use explicit width calculation to ensure cards stay within screen bounds
    <View style={{ width: '100%', marginTop: 8, marginBottom: 80, paddingHorizontal: 20 }}>
      <Text style={{ color: 'white', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5, lineHeight: 32 }}>
        See what your friends are doing.
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.65)', textAlign: 'center', marginBottom: 28, fontSize: 15, lineHeight: 22, paddingHorizontal: 16 }}>
        Share your active{' '}
        <Text style={{ color: '#7dd3fc', fontWeight: '900' }}>moment of the day</Text>
        {' '}with them!
      </Text>

      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (onOpenCamera) onOpenCamera();
        }}
        activeOpacity={0.85}
        style={{ width: '100%', marginBottom: 32 }}
      >
        <LinearGradient
          colors={['#7ad7c6', '#7dd3fc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            height: 64,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#7dd3fc',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
          }}
        >
          <Text style={{ color: '#090E17', fontWeight: '900', fontSize: 17, letterSpacing: 2 }}>POST NOW</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Locked friend cards */}
      <View style={{ gap: 20 }}>
        {displayFriends.map((f, i) => (
          <View
            key={f.id || i}
            style={{
              width: '100%',
              height: 380,
              borderRadius: 32,
              overflow: 'hidden',
              backgroundColor: '#06090E',
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {f.img ? (
              <Image
                source={{ uri: optimizedImageUrl(f.img, 400) }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 }}
                blurRadius={14}
                resizeMode="cover"
              />
            ) : (
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.06)', fontWeight: 'bold', fontSize: 80 }}>
                  {f.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 14, zIndex: 10 }}>
              <Ionicons name="lock-closed" size={30} color="rgba(255,255,255,0.85)" />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase', fontSize: 11, textAlign: 'center', paddingHorizontal: 24, zIndex: 10 }}>
              {f.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}