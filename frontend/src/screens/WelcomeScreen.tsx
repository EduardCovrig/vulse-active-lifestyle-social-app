import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  // Background floating animations
  const blob1Anim = useRef(new Animated.Value(0)).current;
  const blob2Anim = useRef(new Animated.Value(0)).current;
  const blob3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createLoop(blob1Anim, 14000),
      createLoop(blob2Anim, 18000),
      createLoop(blob3Anim, 22000),
    ]).start();
  }, []);

  // Sweeping larger translations and scaling for active liquid background movement
  const blob1Style = {
    transform: [
      {
        translateX: blob1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 80],
        }),
      },
      {
        translateY: blob1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, 110],
        }),
      },
      {
        scale: blob1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1.4],
        }),
      },
    ],
  };

  const blob2Style = {
    transform: [
      {
        translateX: blob2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [90, -70],
        }),
      },
      {
        translateY: blob2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [80, -70],
        }),
      },
      {
        scale: blob2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1.35, 0.85],
        }),
      },
    ],
  };

  const blob3Style = {
    transform: [
      {
        translateX: blob3Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-60, 70],
        }),
      },
      {
        translateY: blob3Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [130, -50],
        }),
      },
      {
        scale: blob3Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.75, 1.2],
        }),
      },
    ],
  };

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Register');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Login');
  };

  return (
    <View className="flex-1 bg-[#05080e] relative justify-between items-center px-8 py-16">
      {/* ── Dynamic Liquid Glassy Background ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Animated.View
          style={[
            blob1Style,
            {
              position: 'absolute',
              top: '15%',
              left: '-25%',
              width: 350,
              height: 350,
              borderRadius: 175,
              backgroundColor: '#7ad7c6',
              opacity: 0.25,
            },
          ]}
        />
        <Animated.View
          style={[
            blob2Style,
            {
              position: 'absolute',
              bottom: '15%',
              right: '-25%',
              width: 380,
              height: 380,
              borderRadius: 190,
              backgroundColor: '#7dd3fc',
              opacity: 0.20,
            },
          ]}
        />
        <Animated.View
          style={[
            blob3Style,
            {
              position: 'absolute',
              top: '35%',
              right: '5%',
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: '#fdba74',
              opacity: 0.16,
            },
          ]}
        />
        {/* Full-screen high-intensity Blur for deep premium glassy blend */}
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>

      {/* Top spacing / decoration */}
      <View style={{ height: 40 }} />

      {/* Brand Header */}
      <View className="items-center justify-center">
        <Text
          className="text-5xl font-extrabold text-white uppercase mb-4"
          style={{ letterSpacing: 12, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}
        >
          Vulse
        </Text>
        <Text className="text-white/60 text-base tracking-widest font-extrabold uppercase mt-1 text-center">
          Enter your healthy era.
        </Text>
      </View>

      {/* Welcome Buttons and Interactive CTAs */}
      <View className="w-full max-w-sm flex-col gap-5 mb-8">
        
        {/* "Join Vulse" - Primary Glassmorphic Gradient Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleJoin}
        >
          <LinearGradient
            colors={['#7ad7c6', '#7dd3fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: 60,
              borderRadius: 30,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7dd3fc',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            }}
          >
            <Text style={{ color: '#090E17', fontWeight: '900', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>
              Join Vulse
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* "Already a member? Log In" - Elegant Transparent Glass Button */}
        <BlurView
          intensity={20}
          tint="light"
          className="overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.01]"
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogin}
            style={{
              height: 60,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Already a member? Log In
            </Text>
          </TouchableOpacity>
        </BlurView>

      </View>
    </View>
  );
}
