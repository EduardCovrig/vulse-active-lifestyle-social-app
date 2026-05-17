import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

const AnimatedVideo = Animated.createAnimatedComponent(Video);

interface PinchableImageProps {
  uri: string;
  onSingleTap?: () => void;
}

export default function PinchableImage({ uri, onSingleTap }: PinchableImageProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const pinchData = useRef({
    isPinching: false,
    initialDistance: 0,
    hasMoved: false,
    touchStartTime: 0
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        return Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        pinchData.hasMoved = false;
        pinchData.touchStartTime = Date.now();
        
        if (touches.length === 2) {
          pinchData.isPinching = true;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          pinchData.initialDistance = Math.sqrt(dx * dx + dy * dy);
          
          scale.stopAnimation();
          translateX.stopAnimation();
          translateY.stopAnimation();
        } else {
          pinchData.isPinching = false;
        }
      },
      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;
        if (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) {
          pinchData.hasMoved = true;
        }

        if (touches.length === 2) {
          if (!pinchData.isPinching) {
            pinchData.isPinching = true;
            const dx = touches[0].pageX - touches[1].pageX;
            const dy = touches[0].pageY - touches[1].pageY;
            pinchData.initialDistance = Math.sqrt(dx * dx + dy * dy);
          }
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);

          const newScale = Math.max(1, currentDistance / pinchData.initialDistance);
          scale.setValue(newScale);
          translateX.setValue(gs.dx);
          translateY.setValue(gs.dy);
        } else if (touches.length === 1 && pinchData.isPinching) {
          // Permite mutarea imaginii daca ramane un deget pe ecran dupa pinch
          translateX.setValue(gs.dx);
          translateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: () => {
        const isTap = !pinchData.hasMoved && (Date.now() - pinchData.touchStartTime) < 250;
        pinchData.isPinching = false;
        
        if (isTap && onSingleTap) {
          onSingleTap();
        }

        // Ricoșeu fluid înapoi la dimensiunea inițială
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 20 }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 12, speed: 20 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 12, speed: 20 }),
        ]).start();
      },
      onPanResponderTerminate: () => {
        pinchData.isPinching = false;
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 20 }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 12, speed: 20 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 12, speed: 20 }),
        ]).start();
      }
    })
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} collapsable={false}>
      {uri && (uri.toLowerCase().endsWith('.mp4') || uri.toLowerCase().endsWith('.mov')) ? (
        <AnimatedVideo
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { translateY }, { scale }] }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
        />
      ) : (
        <Animated.Image 
          source={{ uri }} 
          style={[StyleSheet.absoluteFill, { transform: [{ translateX }, { translateY }, { scale }] }]} 
          resizeMode="cover" 
        />
      )}
    </View>
  );
}