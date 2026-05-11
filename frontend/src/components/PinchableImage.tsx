import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

interface PinchableImageProps {
  uri: string;
  onSingleTap?: () => void;
}

export default function PinchableImage({ uri, onSingleTap }: PinchableImageProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const initialDistance = useRef<number | null>(null);
  const touchStartRef = useRef<{x: number, y: number, time: number} | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          touchStartRef.current = { x: touches[0].pageX, y: touches[0].pageY, time: Date.now() };
        } else if (touches.length === 2) {
          touchStartRef.current = null; // Anulam tap-ul
          const t1 = touches[0];
          const t2 = touches[1];
          initialDistance.current = Math.sqrt(Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2));
          scale.stopAnimation();
          translateX.stopAnimation();
          translateY.stopAnimation();
        }
      },
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2 && initialDistance.current) {
          const t1 = touches[0];
          const t2 = touches[1];
          const distance = Math.sqrt(Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2));
          const scaleValue = Math.max(1, distance / initialDistance.current);
          scale.setValue(scaleValue);

          translateX.setValue(gs.dx);
          translateY.setValue(gs.dy);
        } else if (touches.length === 1 && touchStartRef.current) {
           const dist = Math.abs(touches[0].pageX - touchStartRef.current.x) + Math.abs(touches[0].pageY - touchStartRef.current.y);
           if (dist > 15) touchStartRef.current = null; // A miscat prea mult degetul, nu e tap
        }
      },
      onPanResponderRelease: () => {
         if (touchStartRef.current) {
            const timeDiff = Date.now() - touchStartRef.current.time;
            if (timeDiff < 250 && onSingleTap) {
               onSingleTap();
            }
         }
        
        // Reset super rapid stil Instagram
        initialDistance.current = null;
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8, speed: 24 }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 8, speed: 24 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 8, speed: 24 }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        initialDistance.current = null;
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 8, speed: 24 }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 8, speed: 24 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 8, speed: 24 }),
        ]).start();
      }
    })
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} collapsable={false}>
      <Animated.Image 
        source={{ uri }} 
        style={[StyleSheet.absoluteFill, { transform: [{ scale }, { translateX }, { translateY }] }]} 
        resizeMode="cover" 
      />
    </View>
  );
}