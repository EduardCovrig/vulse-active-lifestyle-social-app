/**
 * SwipeableModal - High-performance JS-only bottom sheet modal with zero touch delay.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

export const ModalScrollContext = React.createContext<{
  onScroll: (event: any) => void;
  scrollEventThrottle: number;
} | null>(null);

interface SwipeableModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called after the modal animation is fully done */
  afterClose?: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  heightRatio?: number;
}

export default function SwipeableModal({
  visible,
  onClose,
  afterClose,
  children,
  title,
  subtitle,
  heightRatio = 0.75,
}: SwipeableModalProps) {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [modalVisible, setModalVisible] = useState(false);
  const [touchable, setTouchable] = useState(true);
  const isClosing = useRef(false);
  const isOpen = useRef(false);

  const scrollY = useRef(0);
  const isScrollAtTop = useRef(true);

  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent?.contentOffset?.y ?? 0;
    scrollY.current = y;
    isScrollAtTop.current = y <= 0;
  }, []);

  const runCloseAnim = useCallback((callback?: () => void) => {
    if (isClosing.current) return;
    isClosing.current = true;
    isOpen.current = false;
    setTouchable(false);
    Keyboard.dismiss();

    Animated.parallel([
      Animated.spring(panY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        damping: 26,
        mass: 0.8,
        stiffness: 170,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      isClosing.current = false;
      setModalVisible(false);
      onClose();
      callback?.();
    });
  }, [onClose]);

  useEffect(() => {
    if (visible && !isOpen.current) {
      isOpen.current = true;
      isClosing.current = false;
      scrollY.current = 0;
      isScrollAtTop.current = true;
      panY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      setTouchable(true);
      setModalVisible(true);

      Animated.parallel([
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          mass: 0.7,
          stiffness: 140,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible && isOpen.current && !isClosing.current) {
      runCloseAnim(afterClose);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gs) => {
        const { pageY } = evt.nativeEvent;
        const modalTop = SCREEN_HEIGHT * (1 - heightRatio);
        const isHeaderTouch = pageY >= modalTop && pageY <= modalTop + 75;

        // If swiping down and list is at the top
        if (gs.dy > 4 && isScrollAtTop.current) {
          return true;
        }
        // If swiping on the header grab area
        if (Math.abs(gs.dy) > 4 && isHeaderTouch) {
          return true;
        }
        return false;
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          panY.setValue(gs.dy);
        } else {
          // Elastic rubber-banding when pulling up
          panY.setValue(gs.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SCREEN_HEIGHT * 0.18 || gs.vy > 0.7) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          runCloseAnim(afterClose);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            mass: 0.8,
            stiffness: 140,
          }).start();
        }
      },
    })
  ).current;

  if (!modalVisible) return null;

  return (
    <View 
      pointerEvents={touchable ? 'auto' : 'none'}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      {/* Backdrop */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', opacity: backdropOpacity }}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => runCloseAnim(afterClose)} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Animated.View 
          {...panResponder.panHandlers}
          style={{ transform: [{ translateY: panY }], height: SCREEN_HEIGHT * heightRatio, width: '100%' }}
        >
          <BlurView intensity={85} tint="dark" style={{ flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,14,23,0.88)' }} />

            {/* Drag handle & Header grab area */}
            <View 
              style={{ 
                width: '100%', 
                paddingTop: 12,
                paddingBottom: 16, 
                backgroundColor: 'transparent',
                borderBottomWidth: 0.5, 
                borderBottomColor: 'rgba(255,255,255,0.06)',
                zIndex: 10 
              }}
            >
              <View style={{ width: 38, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: 12 }} />
              {title && (
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 18, textAlign: 'center', letterSpacing: -0.3, paddingHorizontal: 40 }}>{title}</Text>
              )}
              {subtitle && (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.2 }}>{subtitle}</Text>
              )}
            </View>

            {/* Close button */}
            <TouchableOpacity
              onPress={() => runCloseAnim(afterClose)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ position: 'absolute', top: 12, right: 16, zIndex: 50, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <ModalScrollContext.Provider value={{ onScroll: handleScroll, scrollEventThrottle: 16 }}>
                {children}
              </ModalScrollContext.Provider>
            </View>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
