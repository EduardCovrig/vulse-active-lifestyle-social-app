import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

interface PinchableImageProps {
  uri: string;
}

export default function PinchableImage({ uri }: PinchableImageProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gs) => evt.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (evt, gs) => evt.nativeEvent.touches.length === 2,
      onPanResponderMove: (evt, gs) => {
        if (evt.nativeEvent.touches.length === 2) {
          const t1 = evt.nativeEvent.touches[0];
          const t2 = evt.nativeEvent.touches[1];
          // scale is proportional to the distance between the two fingers
          const distance = Math.sqrt(Math.pow(t2.pageX - t1.pageX, 2) + Math.pow(t2.pageY - t1.pageY, 2));
          const scaleValue = Math.max(1, distance / 150); // 150 is baseline distance for scale 1
          scale.setValue(scaleValue);

          // translateX and translateY are the average movement of the two fingers
          translateX.setValue(gs.dx);
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: () => {
       // When fingers are lifted, animate back to original state
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 20 }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 12, speed: 20 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 12, speed: 20 }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start();
      }
    })
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
      <Animated.Image 
        source={{ uri }} 
        style={[StyleSheet.absoluteFill, { transform: [{ scale }, { translateX }, { translateY }] }]} 
        resizeMode="cover" 
      />
    </View>
  );
}