/**
 * SwipeableModal - Crash-safe bottom sheet modal.
 *
 * DESIGN RULES:
 * - Uses a single `isClosing` ref to prevent double-close calls
 * - `onClose` is fired exactly once, after the exit animation finishes
 * - Keyboard is always dismissed before animating out
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
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

export default function SwipeableModal({
  visible,
  onClose,
  children,
  title,
  subtitle,
  heightRatio = 0.75,
}: SwipeableModalProps) {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [internalVisible, setInternalVisible] = useState(false);
  const isClosing = useRef(false);
  const isOpen = useRef(false);

  const runCloseAnim = useCallback((callback?: () => void) => {
    if (isClosing.current) return;
    isClosing.current = true;
    isOpen.current = false;
    Keyboard.dismiss();

    Animated.parallel([
      Animated.spring(panY, { toValue: SCREEN_HEIGHT, useNativeDriver: true, bounciness: 0, speed: 22 }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      isClosing.current = false;
      setInternalVisible(false);
      onClose();
      callback?.();
    });
  }, [onClose]);

  useEffect(() => {
    if (visible && !isOpen.current) {
      isOpen.current = true;
      isClosing.current = false;
      panY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      setInternalVisible(true);

      Animated.parallel([
        Animated.spring(panY, { toValue: 0, useNativeDriver: true, bounciness: 6, speed: 14 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();
    } else if (!visible && isOpen.current && !isClosing.current) {
      runCloseAnim();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 6,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) panY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SCREEN_HEIGHT * 0.18 || gs.vy > 0.7) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          runCloseAnim();
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true, bounciness: 8, speed: 18 }).start();
        }
      },
    })
  ).current;

  if (!internalVisible) return null;

  return (
    <Modal
      transparent
      visible={internalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => runCloseAnim()}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', opacity: backdropOpacity }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => runCloseAnim()} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Animated.View style={{ transform: [{ translateY: panY }], height: SCREEN_HEIGHT * heightRatio, width: '100%' }}>
            <BlurView intensity={85} tint="dark" style={{ flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(9,14,23,0.88)' }} />

              {/* Drag handle area */}
              <View {...panResponder.panHandlers} style={{ paddingBottom: 10, zIndex: 10 }}>
                <View style={{ width: '100%', height: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' }} />
                </View>
                {title && (
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 17, textAlign: 'center', letterSpacing: -0.3 }}>{title}</Text>
                )}
                {subtitle && (
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 }}>{subtitle}</Text>
                )}
              </View>

              {/* Close button */}
              <TouchableOpacity
                onPress={() => runCloseAnim()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ position: 'absolute', top: 10, right: 16, zIndex: 50, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                {children}
              </View>
            </BlurView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
