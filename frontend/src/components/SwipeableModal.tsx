import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Modal, PanResponder, Animated, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SwipeableModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  avoidKeyboard?: boolean;
  showClose?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function SwipeableModal({ visible, onClose, children, avoidKeyboard = false, showClose = true }: SwipeableModalProps) {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(panY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      closeAnim();
    }
  }, [visible]);

  const resetPositionAnim = () => {
    Animated.timing(panY, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeAnim = () => {
    Animated.parallel([
      Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dy) > 5 && Math.abs(gs.dy) > Math.abs(gs.dx);
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) panY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.5) {
          closeAnim();
        } else {
          resetPositionAnim();
        }
      },
      onPanResponderTerminate: () => resetPositionAnim(),
    })
  ).current;

  const interpolatedBackdrop = panY.interpolate({
    inputRange: [0, SCREEN_HEIGHT * 0.5],
    outputRange: [0.6, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* Backdrop */}
        <Animated.View 
          style={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'black', 
            opacity: Animated.multiply(backdropOpacity, interpolatedBackdrop)
          }} 
        />
        <TouchableOpacity 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
          activeOpacity={1} 
          onPress={closeAnim} 
        />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={avoidKeyboard}
        >
          <Animated.View 
            style={{ 
              transform: [{ translateY: panY }], 
              width: '100%',
              backgroundColor: 'transparent',
              maxHeight: SCREEN_HEIGHT - 60
            }}
          >
            {/* DRAG HANDLE ZONE */}
            <View 
              {...panResponder.panHandlers}
              style={{ width: '100%', height: 45, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} 
            >
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 10 }} />
            </View>

            {/* Content area */}
            <View style={{ flexShrink: 1 }}>
              {children}
            </View>
            
            <View style={{ height: 100, backgroundColor: 'rgba(9,14,23,0.95)', marginTop: -1 }} />
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
