import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BouncyPressable from '../components/BouncyPressable';
import { api } from '../services/api';

export default function CameraScreen({ onClose }: { onClose: () => void }) {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [mode, setMode] = useState<'picture' | 'video'>('picture');
  const [permission, requestPermission] = useCameraPermissions();
  
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isFromGallery, setIsFromGallery] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
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

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-6 relative">
        <View className="absolute w-96 h-96 bg-[#7dd3fc]/20 rounded-full blur-[100px]" />
        <BlurView intensity={40} tint="dark" className="p-8 rounded-[32px] items-center border border-white/10 w-full">
          <Ionicons name="camera-outline" size={64} color="#c5eaff" className="mb-4" />
          <Text className="text-white text-2xl font-extrabold tracking-widest text-center mb-2">VULSE VISION</Text>
          <Text className="text-white/60 text-center mb-8">We need access to your camera to capture your healthy era.</Text>
          <TouchableOpacity onPress={requestPermission} className="w-full">
            <LinearGradient colors={['#7ad7c6', '#7dd3fc']} className="py-4 rounded-full items-center">
              <Text className="text-[#0b1326] font-bold text-lg">GRANT ACCESS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  // --- CAMERA CONTROLS ---
  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(f => (f === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (cameraRef.current && mode === 'picture') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setMediaUri(photo.uri);
      setMediaType('image');
      setIsFromGallery(false);
    }
  };

  const toggleRecording = async () => {
    if (!cameraRef.current || mode !== 'video') return;

    if (isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
        setMediaUri(video.uri);
        setMediaType('video');
        setIsFromGallery(false);
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  const pickFromGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
      setIsFromGallery(true); // FLAG pentru a ascunde Daily Snap
    }
  };

  // --- UPLOAD LOGIC ---
  const handleUpload = async (type: 'DAILY' | 'REEL' | 'MEAL') => {
    if (!mediaUri || isUploading) return;
    setIsUploading(true);
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const formData = new FormData();
      
      const filename = mediaUri.split('/').pop() || (mediaType === 'video' ? 'upload.mp4' : 'upload.jpg');
      const ext = filename.split('.').pop();
      let mime = mediaType === 'video' ? `video/${ext}` : `image/${ext}`;
      
      formData.append('file', { uri: mediaUri, name: filename, type: mime } as any);
      formData.append('type', type); 
      
      //Dynamic captions
      let caption = "New post on Vulse! ⚡";
      if (type === 'DAILY') caption = "My Daily Snap! 🚀";
      if (type === 'MEAL') caption = "Analyzing my nutrition... 🥗";
      if (type === 'REEL') caption = "Check this out! #GlobalDrop";
      
      formData.append('caption', caption);

      const response = await api.post('/posts/create', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      // AI NUTRITION
      if (type === 'MEAL' && response.data?.id) {
        try {
          await api.post(`/nutrition/${response.data.id}/save`);
          Alert.alert("Analiză Completă!", "Masa a fost postată și adăugată automat în Jurnalul tău de Nutriție!");
        } catch (e) {
          Alert.alert("Postat!", "Postarea a apărut, dar jurnalul nu a putut fi actualizat.");
        }
      }
    
      onClose(); 
      
    } catch (error: any) {
      console.error("Eroare upload:", error.response?.data);
      Alert.alert("Eroare", error.response?.data?.message || "Upload failed. Verificați conexiunea.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- PREVIEW SCREEN ---
  if (mediaUri) {
    return (
      <View className="flex-1 bg-black relative">
        <Image source={{ uri: mediaUri }} className="flex-1" resizeMode="cover" />
        <View className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        
        <View className="absolute z-50 flex-row justify-between w-full px-6" style={{ top: insets.top + 10 }}>
          <BouncyPressable onPress={() => setMediaUri(null)} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 backdrop-blur-md">
            <Ionicons name="close" size={24} color="white" />
          </BouncyPressable>
        </View>

        <View className="absolute bottom-0 inset-x-0 z-50 pb-10 pt-6 px-4">
          <BlurView intensity={80} tint="dark" className="rounded-[40px] p-6 border border-white/20 overflow-hidden shadow-2xl">
            <View className="absolute inset-0 bg-[#090E17]/60" />
            
            <Text className="text-white text-2xl font-black mb-1 tracking-tight">Ready to ignite?</Text>
            <Text className="text-white/50 text-sm mb-6">Choose how you want to post this moment.</Text>

            <View className="flex-col gap-3">
              {/* ROW 1 */}
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={() => handleUpload('MEAL')} disabled={isUploading} className="flex-1">
                  <LinearGradient colors={['#344767', '#1d314f']} start={{x:0, y:0}} end={{x:1, y:1}} className="rounded-3xl p-4 items-center justify-center border border-white/10 h-24 shadow-lg">
                    {isUploading ? <ActivityIndicator color="#7dd3fc" /> : (
                      <>
                        <Ionicons name="sparkles" size={24} color="#7dd3fc" className="mb-2" />
                        <Text className="text-[#7dd3fc] font-bold text-[10px] tracking-widest text-center">AI NUTRITION</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleUpload('REEL')} disabled={isUploading} className="flex-1">
                  <LinearGradient colors={['#171f33', '#0b1326']} start={{x:0, y:0}} end={{x:1, y:1}} className="rounded-3xl p-4 items-center justify-center border border-white/10 h-24 shadow-lg">
                    {isUploading ? <ActivityIndicator color="#c5eaff" /> : (
                      <>
                        <Ionicons name="globe-outline" size={24} color="#c5eaff" className="mb-2" />
                        <Text className="text-[#c5eaff] font-bold text-[10px] tracking-widest text-center">GLOBAL DROP</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* ROW 2: DAILY SNAP */}
              {!isFromGallery && (
                <TouchableOpacity onPress={() => handleUpload('DAILY')} disabled={isUploading} className="w-full">
                  <LinearGradient colors={['#7ad7c6', '#7dd3fc']} start={{x:0, y:0}} end={{x:1, y:1}} className="rounded-3xl p-4 flex-row items-center justify-center shadow-[0_0_20px_rgba(122,215,198,0.3)] h-16">
                    {isUploading ? <ActivityIndicator color="#0b1326" /> : (
                      <>
                        <Ionicons name="flash" size={20} color="#0b1326" className="mr-2" />
                        <Text className="text-[#0b1326] font-black text-sm tracking-widest">POST DAILY SNAP</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {isFromGallery && (
                 <Text className="text-center text-white/30 text-[10px] uppercase tracking-widest mt-2">
                   Daily Snaps must be captured live.
                 </Text>
              )}

            </View>
          </BlurView>
        </View>
      </View>
    );
  }

  // --- CAMERA CAPTURE SCREEN ---
  return (
    <View className="flex-1 bg-black relative">
      <CameraView 
        ref={cameraRef} 
        style={StyleSheet.absoluteFillObject} 
        facing={facing} 
        mode={mode}
        enableTorch={flash === 'on'}
      />
      
      <View className="absolute inset-0 border-[20px] border-black/10 pointer-events-none" />

      {/* TOP CONTROLS */}
      <View className="absolute z-50 flex-row justify-between w-full px-6" style={{ top: insets.top + 10 }}>
        <BouncyPressable onPress={onClose} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20">
          <Ionicons name="chevron-down" size={28} color="white" />
        </BouncyPressable>
        <BouncyPressable onPress={toggleFlash} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20">
          <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color={flash === 'on' ? '#fde047' : 'white'} />
        </BouncyPressable>
      </View>

      {/* BOTTOM CONTROLS */}
      <View className="absolute bottom-12 inset-x-0 items-center px-10">
        
        <View className="flex-row gap-6 mb-8">
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode('picture'); }} className="px-4 py-2">
            <Text className={`font-black tracking-widest text-sm ${mode === 'picture' ? 'text-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'text-white/30'}`}>PHOTO</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode('video'); }} className="px-4 py-2">
            <Text className={`font-black tracking-widest text-sm ${mode === 'video' ? 'text-[#ff4b4b] shadow-[0_0_10px_rgba(255,75,75,0.8)]' : 'text-white/30'}`}>VIDEO</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center w-full">
          
          {/* GALLERY PICKER */}
          <View className="flex-1 items-start">
            <BouncyPressable onPress={pickFromGallery} className="w-12 h-12 rounded-2xl border border-white/30 overflow-hidden bg-black/40 items-center justify-center backdrop-blur-md">
               <Ionicons name="images" size={24} color="white" />
            </BouncyPressable>
          </View>

          {/* CAPTURE BUTTON */}
          <BouncyPressable onPress={mode === 'picture' ? takePicture : toggleRecording} scaleTo={0.85}>
            <View className="relative items-center justify-center">
              {mode === 'picture' && (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="absolute w-24 h-24 rounded-full border-[3px] border-[#7dd3fc]/50" />
              )}
              {isRecording && (
                <View className="absolute w-24 h-24 rounded-full border-[4px] border-[#ff4b4b] animate-ping" />
              )}
              <View className="w-20 h-20 rounded-full border-[4px] border-white items-center justify-center p-1 bg-black/20 backdrop-blur-sm">
                 <View className={`w-full h-full rounded-full ${mode === 'video' ? (isRecording ? 'bg-[#ff4b4b] rounded-lg w-8 h-8' : 'bg-[#ff4b4b]') : 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]'}`} />
              </View>
            </View>
          </BouncyPressable>

          {/* FLIP CAMERA */}
          <View className="flex-1 items-end">
            <BouncyPressable onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} className="w-14 h-14 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20">
              <Ionicons name="sync" size={26} color="white" />
            </BouncyPressable>
          </View>
        </View>
      </View>
    </View>
  );
}