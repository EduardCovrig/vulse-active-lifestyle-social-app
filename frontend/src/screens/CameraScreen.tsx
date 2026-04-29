import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BouncyPressable from '../components/BouncyPressable';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ onClose }: { onClose: () => void }) {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  const cameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!permission) return <View className="flex-1 bg-background" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6 relative">
        <View className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
        <BlurView intensity={40} tint="dark" className="p-8 rounded-[32px] items-center border border-white/10 w-full">
          <Ionicons name="camera-outline" size={64} color="#c5eaff" className="mb-4" />
          <Text className="text-white text-2xl font-extrabold tracking-widest text-center mb-2">VULSE VISION</Text>
          <Text className="text-on-surface-variant text-center mb-8">We need access to your camera to capture your healthy era.</Text>
          <TouchableOpacity onPress={requestPermission} className="w-full">
            <LinearGradient colors={['#7ad7c6', '#7dd3fc']} className="py-4 rounded-full items-center">
              <Text className="text-[#0b1326] font-bold text-lg">GRANT ACCESS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setPhotoUri(photo.uri);
    }
  };

  const retakePicture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotoUri(null);
  };

  const handlePostDailySnap = async () => {
    if (!photoUri) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const formData = new FormData();
      
      const filename = photoUri.split('/').pop() || 'snap.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('file', {
        uri: photoUri,
        name: filename,
        type: type,
      } as any);

      formData.append('type', 'DAILY');
      formData.append('caption', 'Entering my healthy era! 🚀'); 

      console.log("Se trimite poza la server...");

      const response = await api.post('/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("Upload cu succes!", response.data);
      Alert.alert("Awesome!", "Your Daily Snap is live.");
      onClose(); 
      
    } catch (error: any) {
      console.error("Eroare la upload:", error.response?.data || error.message);
      Alert.alert("Eroare", "Nu am putut posta imaginea. Verifica conexiunea.");
    }
  };

  if (photoUri) {
    return (
      <View className="flex-1 bg-black relative">
        <Image source={{ uri: photoUri }} className="flex-1" resizeMode="cover" />
        
        <View className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        
        <View className="absolute z-50 flex-row justify-between w-full px-6" style={{ top: insets.top + 10 }}>
          <BouncyPressable onPress={retakePicture} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 backdrop-blur-md">
            <Ionicons name="close" size={24} color="white" />
          </BouncyPressable>
        </View>

        <View className="absolute bottom-0 inset-x-0 z-50 pb-10 pt-6 px-6">
          <BlurView intensity={70} tint="dark" className="rounded-[32px] p-6 border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
             <View className="absolute inset-0 bg-primary/5" />
             
             <Text className="text-white font-headline-lg text-2xl tracking-tight mb-1">Ready to ignite?</Text>
             <Text className="text-on-surface-variant font-body-md text-sm mb-6">Choose how you want to post this moment.</Text>
             
             <View className="flex-row gap-3">
               <TouchableOpacity activeOpacity={0.8} className="flex-1">
                 <LinearGradient colors={['#344767', '#1d314f']} start={{x:0, y:0}} end={{x:1, y:1}} className="rounded-2xl p-4 items-center justify-center border border-white/10 h-24">
                    <Ionicons name="sparkles" size={24} color="#7dd3fc" className="mb-2" />
                    <Text className="text-[#7dd3fc] font-bold text-xs tracking-wider">AI ANALYSIS</Text>
                 </LinearGradient>
               </TouchableOpacity>

               <TouchableOpacity activeOpacity={0.8} className="flex-1" onPress={handlePostDailySnap}>
                 <LinearGradient colors={['#7ad7c6', '#7dd3fc']} start={{x:0, y:0}} end={{x:1, y:1}} className="rounded-2xl p-4 items-center justify-center shadow-[0_0_20px_rgba(122,215,198,0.3)] h-24">
                    <Ionicons name="flash" size={24} color="#0b1326" className="mb-2" />
                    <Text className="text-[#0b1326] font-bold text-xs tracking-wider">DAILY SNAP</Text>
                 </LinearGradient>
               </TouchableOpacity>
             </View>
          </BlurView>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={facing} />
      
      <View className="absolute inset-0 border-[20px] border-black/10 pointer-events-none" />

      <View className="absolute z-50 flex-row justify-between w-full px-6" style={{ top: insets.top + 10 }}>
        <BouncyPressable onPress={onClose} className="w-12 h-12 bg-black/30 rounded-full items-center justify-center backdrop-blur-md border border-white/10">
          <Ionicons name="chevron-down" size={28} color="white" />
        </BouncyPressable>
        <BouncyPressable className="w-12 h-12 bg-black/30 rounded-full items-center justify-center backdrop-blur-md border border-white/10">
          <Ionicons name="flash-off" size={22} color="white" />
        </BouncyPressable>
      </View>

      <View className="absolute bottom-16 inset-x-0 flex-row justify-center items-center px-10">
        
        <View className="flex-1 items-start">
          <View className="w-12 h-12 rounded-xl border border-white/30 overflow-hidden bg-white/10 backdrop-blur-md">
          </View>
        </View>

        <BouncyPressable onPress={takePicture} scaleTo={0.85}>
          <View className="relative items-center justify-center">
            <Animated.View 
              style={{ transform: [{ scale: pulseAnim }] }} 
              className="absolute w-24 h-24 rounded-full border-[3px] border-primary/50" 
            />
            <View className="w-20 h-20 rounded-full border-[4px] border-white items-center justify-center p-1 bg-black/20 backdrop-blur-sm">
               <View className="w-full h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
            </View>
          </View>
        </BouncyPressable>

        <View className="flex-1 items-end">
          <BouncyPressable onPress={toggleCameraFacing} className="w-14 h-14 bg-black/30 rounded-full items-center justify-center backdrop-blur-md border border-white/10">
            <Ionicons name="sync" size={26} color="white" />
          </BouncyPressable>
        </View>

      </View>
    </View>
  );
}