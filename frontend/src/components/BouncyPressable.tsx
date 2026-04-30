import React, { useRef } from 'react';
import { Animated, Pressable, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';

interface BouncyPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  scaleTo?: number; // Cât de mult se "turtiește" (default 0.90)
}

export default function BouncyPressable({ 
  children, 
  onPress, 
  onLongPress, 
  style, 
  className, 
  scaleTo = 0.90 
}: BouncyPressableProps) {
  // Definim valoarea animată pentru scalare
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    // Când pui degetul, se micșorează rapid
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 40,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    // Când iei degetul, sare înapoi ca un arc
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 18, // Asta dă efectul ăla specific "Bump/Zenly"
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        // Vibrație extrem de fină (ca un click de mouse)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) onPress();
      }}
      onLongPress={() => {
        // Vibrație mai puternică pentru acțiuni "ascunse"
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (onLongPress) onLongPress();
      }}
      className={className}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}