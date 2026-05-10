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
      tension: 100, // Slightly snappier
      friction: 12,
    }).start();
  };

  const closeAnim = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      panY.setValue(0); // Reset for next open
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        // Only take over if dragging down and not a sideways swipe
        return gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx);
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          // Responsive but slightly dampened feel
          panY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        // 20% height threshold or high velocity
        if (gs.dy > SCREEN_HEIGHT * 0.2 || gs.vy > 0.5) {
          closeAnim();
        } else {
          resetPositionAnim();
        }
      },
      onPanResponderTerminate: () => resetPositionAnim(),
    })
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

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
          
          <Animated.View 
            style={{ 
              transform: [{ translateY: panY }], 
              width: '100%',
              backgroundColor: 'transparent'
            }}
            {...panResponder.panHandlers}
          >
            {/* Content area */}
            <View onStartShouldSetResponder={() => true}>
              {children}
            </View>
            
            {/* Safe area filler at the bottom so it doesn't show a gap when bouncing */}
            <View style={{ height: 100, backgroundColor: 'rgba(9,14,23,0.95)', marginTop: -1 }} />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
