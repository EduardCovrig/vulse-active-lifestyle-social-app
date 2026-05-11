import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import PinchableImage from './PinchableImage';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface ImagePopoutModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export default function ImagePopoutModal({ visible, imageUri, onClose }: ImagePopoutModalProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible && imageUri) {
      setIsAnimating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 8, speed: 16 })
      ]).start(() => setIsAnimating(false));
    } else if (!visible && !isAnimating && (opacityAnim as any)._value > 0) {
      closeAnim();
    }
  }, [visible, imageUri]);

  const closeAnim = () => {
    setIsAnimating(true);
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setIsAnimating(false);
      onClose();
    });
  };

  if (!visible && !isAnimating) return null;

  return (
    <Modal visible={visible || isAnimating} transparent={true} animationType="none" onRequestClose={closeAnim}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        
        <Animated.View style={{ position: 'absolute', inset: 0, opacity: opacityAnim }}>
          <BlurView intensity={90} tint="dark" style={{ flex: 1 }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeAnim} />
          </BlurView>
        </Animated.View>

        <Animated.View style={{ position: 'absolute', top: 50, right: 20, zIndex: 50, opacity: opacityAnim }}>
          <TouchableOpacity 
            onPress={closeAnim} 
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          style={{ 
            width: width * 0.92, 
            height: height * 0.78, 
            transform: [{ scale: scaleAnim }], 
            opacity: opacityAnim, 
            borderRadius: 36, 
            overflow: 'hidden', 
            backgroundColor: '#06090E', 
            borderWidth: 1, 
            borderColor: 'rgba(255,255,255,0.15)', 
            shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 30 
          }}
        >
           {imageUri && <PinchableImage uri={imageUri} />}
        </Animated.View>
      </View>
    </Modal>
  );
}