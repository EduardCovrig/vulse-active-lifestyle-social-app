import React, { useRef } from 'react';
import { StyleSheet, Animated, PanResponder, Image, Dimensions } from 'react-native';

interface PinchableImageProps {
  uri: string;
  className?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}

const PinchableImage: React.FC<PinchableImageProps> = ({ uri, className = "", resizeMode = 'cover' }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const initialDistance = useRef<number | null>(null);

  const getDistance = (touches: any[]) => {
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          initialDistance.current = getDistance(evt.nativeEvent.touches);
        }
      },
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent.touches.length === 2 && initialDistance.current !== null) {
          const distance = getDistance(evt.nativeEvent.touches);
          const newScale = distance / initialDistance.current;
          scale.setValue(Math.max(1, newScale));
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = null;
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 12,
        }).start();
      },
      onPanResponderTerminate: () => {
        initialDistance.current = null;
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 12,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View 
      {...panResponder.panHandlers} 
      style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}
    >
      <Animated.Image
        source={{ uri }}
        className={className}
        style={[{ flex: 1, transform: [{ scale }] }]}
        resizeMode={resizeMode as any}
      />
    </Animated.View>
  );
};

export default PinchableImage;
