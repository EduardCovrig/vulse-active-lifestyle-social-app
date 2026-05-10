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
  const panY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = () => {
    Animated.spring(panY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeAnim = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          // Rubber-band effect: slower as you drag further
          const dampened = gs.dy * 0.7;
          panY.setValue(dampened);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SCREEN_HEIGHT * 0.25 || gs.vy > 0.8) {
          closeAnim();
        } else {
          resetPositionAnim();
        }
      }
    })
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      backdropOpacity.setValue(0);
    }
  }, [visible]);

  // Interpolate backdrop opacity based on drag
  const interpolatedOpacity = panY.interpolate({
    inputRange: [0, SCREEN_HEIGHT * 0.5],
    outputRange: [0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        enabled={avoidKeyboard}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <Animated.View 
            style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: 'black', 
              opacity: interpolatedOpacity 
            }} 
          />
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            activeOpacity={1} 
            onPress={onClose} 
          />
          
          <Animated.View style={{ transform: [{ translateY: panY }], width: '100%' }}>
            {/* The entire sheet content with drag handle INSIDE */}
            <View {...panResponder.panHandlers}>
              {children}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
