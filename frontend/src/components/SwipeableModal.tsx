import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, PanResponder, Animated, Dimensions, KeyboardAvoidingView, Platform, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeableModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  heightRatio?: number;
}

export default function SwipeableModal({ visible, onClose, children, title, subtitle, heightRatio = 0.75 }: SwipeableModalProps) {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      Animated.parallel([
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
          speed: 14,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        })
      ]).start(() => setIsAnimating(false));
    } else {
      if (!isAnimating && panY._value === 0) {
        closeAnim();
      }
    }
  }, [visible]);

  const closeAnim = () => {
    setIsAnimating(true);
    Animated.parallel([
      Animated.spring(panY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsAnimating(false);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) panY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SCREEN_HEIGHT * 0.2 || gs.vy > 0.8) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          closeAnim();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10,
            speed: 16,
          }).start();
        }
      },
    })
  ).current;

  if (!visible && !isAnimating) return null;

  return (
    <Modal transparent visible={visible || isAnimating} animationType="none" onRequestClose={closeAnim}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        
        {/* Backdrop animat */}
        <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', opacity: backdropOpacity }}>
           <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeAnim} />
        </Animated.View>

        {/* Modalul propriu-zis */}
        <Animated.View style={{ transform: [{ translateY: panY }], height: SCREEN_HEIGHT * heightRatio, width: '100%' }}>
          <BlurView intensity={85} tint="dark" style={{ flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(9,14,23,0.85)' }} />

            {/* HEADER DRAGGABLE */}
            <View {...panResponder.panHandlers} style={{ width: '100%', paddingBottom: 16, backgroundColor: 'transparent', zIndex: 10 }}>
              <View style={{ width: '100%', height: 30, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 40, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </View>
              
              {title && <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center', letterSpacing: -0.5 }}>{title}</Text>}
              {subtitle && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{subtitle}</Text>}
            </View>

            {/* X Button fixat */}
            <TouchableOpacity onPress={closeAnim} style={{ position: 'absolute', top: 12, right: 20, zIndex: 50, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            {/* Aici intra restul continutului (liste, texte) */}
            <View style={{ flex: 1 }}>
              {children}
            </View>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}