import React from 'react';
import { View, Text, Animated } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface CameraProgressRingProps {
  cameraRef: any;
  pulseAnim: any;
  loadingProgress: any;
}

export default function CameraProgressRing({
  cameraRef,
  pulseAnim,
  loadingProgress,
}: CameraProgressRingProps) {
  const CIRCLE_SIZE = 200;
  const STROKE = 6;

  return (
    <View style={{ flex: 1, backgroundColor: '#090E17' }}>
      {/* Hidden camera still mounted for auto-capture */}
      <CameraView
        ref={cameraRef}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        facing="front"
      />

      {/* Animated background blobs */}
      <Animated.View style={{
        position: 'absolute', width: 340, height: 340, borderRadius: 170,
        backgroundColor: 'rgba(122,215,198,0.12)',
        top: '10%', left: '-15%',
        transform: [{ scale: pulseAnim }],
      }} />
      <Animated.View style={{
        position: 'absolute', width: 280, height: 280, borderRadius: 140,
        backgroundColor: 'rgba(125,211,252,0.10)',
        bottom: '15%', right: '-10%',
        transform: [{ scale: pulseAnim.interpolate({ inputRange: [1, 1.1], outputRange: [1.1, 1] }) }],
      }} />
      <Animated.View style={{
        position: 'absolute', width: 180, height: 180, borderRadius: 90,
        backgroundColor: 'rgba(122,215,198,0.08)',
        top: '45%', right: '10%',
        transform: [{ scale: pulseAnim }],
      }} />

      {/* Center content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {/* Progress ring */}
        <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          {/* Track */}
          <View style={{
            position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2, borderWidth: STROKE,
            borderColor: 'rgba(255,255,255,0.08)',
          }} />
          {/* Vulse brand circle fill arc — using conic-like trick with rotation */}
          <Animated.View style={{
            position: 'absolute',
            width: CIRCLE_SIZE, height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            borderWidth: STROKE,
            borderColor: '#7ad7c6',
            borderRightColor: 'transparent',
            borderBottomColor: 'transparent',
            transform: [
              { rotate: '-45deg' },
              { rotate: loadingProgress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            ],
          }} />
          <Animated.View style={{
            position: 'absolute',
            width: CIRCLE_SIZE, height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            borderWidth: STROKE,
            borderColor: '#7dd3fc',
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [
              { rotate: '-45deg' },
              { rotate: loadingProgress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '0deg', '360deg'] }) },
            ],
            opacity: loadingProgress.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] }),
          }} />
          {/* Center icon */}
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(122,215,198,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(122,215,198,0.3)' }}>
            <Ionicons name="happy-outline" size={32} color="#7ad7c6" />
          </View>
        </View>

        {/* Text */}
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, marginBottom: 10 }}>
          Smile! 😄
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 }}>
          Capturing your selfie to share this moment
        </Text>
      </View>
    </View>
  );
}
