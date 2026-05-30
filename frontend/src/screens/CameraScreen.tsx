import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BouncyPressable from '../components/BouncyPressable';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

interface CameraScreenProps {
  onClose: () => void;
  mode?: 'daily' | 'reaction' | 'reel';
  onCapture?: (uri: string, message?: string) => void;
}

export default function CameraScreen({ onClose, mode = 'daily', onCapture }: CameraScreenProps) {
  const [facing, setFacing] = useState<'back' | 'front'>(mode === 'reaction' ? 'front' : 'back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>(mode === 'reel' ? 'video' : 'picture');
  const [permission, requestPermission] = useCameraPermissions();
  
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [frontMediaUri, setFrontMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  
  const [capturePhase, setCapturePhase] = useState<'idle' | 'taking_back' | 'loading' | 'taking_front' | 'done'>('idle');
  const [swapped, setSwapped] = useState(false);
  const [reactionMessage, setReactionMessage] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const cameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loadingProgress = useRef(new Animated.Value(0)).current;

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
    const handleGrantAccess = () => {
      if (!permission.canAskAgain) {
        // Permission permanently denied — send user to system Settings
        Linking.openSettings();
      } else {
        requestPermission();
      }
    };

    return (
      <View className="flex-1 bg-black justify-center items-center px-6 relative">
        <View className="absolute w-96 h-96 bg-[#7dd3fc]/20 rounded-full blur-[100px]" />
        <BlurView intensity={40} tint="dark" className="p-8 rounded-[32px] items-center border border-white/10 w-full">
          <Ionicons name="camera-outline" size={64} color="#c5eaff" className="mb-4" />
          <Text className="text-white text-2xl font-extrabold tracking-widest text-center mb-2">VULSE VISION</Text>
          <Text className="text-white/60 text-center mb-8">
            {!permission.canAskAgain
              ? 'Camera access was denied. Please enable it in your device Settings to continue.'
              : 'We need access to your camera to capture your healthy era.'}
          </Text>
          <TouchableOpacity onPress={handleGrantAccess} className="w-full">
            <LinearGradient colors={['#7ad7c6', '#7dd3fc']} className="py-4 rounded-full items-center">
              <Text className="text-[#0b1326] font-bold text-lg">
                {!permission.canAskAgain ? 'OPEN SETTINGS' : 'GRANT ACCESS'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(f => (f === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || cameraMode !== 'picture') return;

    if (mode === 'daily') {
      // 1. Take back photo
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setCapturePhase('taking_back');
      const backPhoto = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setMediaUri(backPhoto.uri);
      
      // 2. Switch to front and show loading
      setFacing('front');
      setCapturePhase('loading');
      
      // Animate loading circle
      loadingProgress.setValue(0);
      Animated.timing(loadingProgress, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false
      }).start(async () => {
        // 3. Take front photo automatically
        if (cameraRef.current) {
          setCapturePhase('taking_front');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const frontPhoto = await cameraRef.current.takePictureAsync({ quality: 0.8 });
          setFrontMediaUri(frontPhoto.uri);
          setCapturePhase('done');
        }
      });
    } else if (mode === 'reaction') {
      // Selfie only for reaction
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setMediaUri(photo.uri);
      setCapturePhase('done');
    } else {
      // Normal single photo for reel
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setMediaUri(photo.uri);
      setMediaType('image');
      setCapturePhase('done');
    }
  };

  const toggleRecording = async () => {
    if (!cameraRef.current || cameraMode !== 'video') return;

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
        setCapturePhase('done');
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  const handleUpload = async (type: 'DAILY' | 'REEL') => {
    if (!mediaUri || isUploading) return;
    setIsUploading(true);
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const formData = new FormData();
      
      const filename = mediaUri.split('/').pop() || (mediaType === 'video' ? 'upload.mp4' : 'upload.jpg');
      let ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      let mime = mediaType === 'video' ? (ext === 'mov' ? 'video/quicktime' : `video/${ext}`) : `image/${ext}`;
      
      formData.append('file', { uri: mediaUri, name: filename, type: mime } as any);
      
      if (mode === 'daily' && frontMediaUri) {
         const frontFilename = frontMediaUri.split('/').pop() || 'front.jpg';
         formData.append('frontFile', { uri: frontMediaUri, name: frontFilename, type: `image/jpeg` } as any);
      }

      formData.append('type', type); 
      
      let caption = "New post on Vulse! ⚡";
      if (type === 'DAILY') caption = "My Daily Snap! 🚀";
      if (type === 'REEL') caption = "Check this out! #GlobalDrop";
      
      formData.append('caption', caption);

      await api.post('/posts/create', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
    
      onClose(); 
      
    } catch (error: any) {
      console.error("Upload error:", error.response?.data);
      const backendMessage = error.response?.data?.message || error.response?.data || "";
      if (typeof backendMessage === 'string' && backendMessage.includes("already posted")) {
        Alert.alert("Daily Limit Reached", "You've already shared your active life today!");
      } else {
        Alert.alert("Error", backendMessage || "Upload failed. Please check your connection.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // --- RENDERING VIEWS ---

  if (capturePhase === 'loading' || capturePhase === 'taking_front') {
    // Keep the camera mounted but hidden — we need it ready to capture
    const CIRCLE_SIZE = 200;
    const STROKE = 6;
    return (
      <View style={{ flex: 1, backgroundColor: '#090E17' }}>
        {/* Hidden camera still mounted for auto-capture */}
        <CameraView
          ref={cameraRef}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
          facing="front"
        />

        {/* Animated background blobs */}
        <Animated.View style={{
          position: 'absolute', width: 340, height: 340, borderRadius: 170,
          backgroundColor: 'rgba(122,215,198,0.12)',
          top: '10%', left: '-15%',
          transform: [{ scale: pulseAnim }],
        }} />
        <Animated.View style={{
          position: 'absolute', width: 280, height: 280, borderRadius: 140,
          backgroundColor: 'rgba(125,211,252,0.10)',
          bottom: '15%', right: '-10%',
          transform: [{ scale: pulseAnim.interpolate({ inputRange: [1, 1.1], outputRange: [1.1, 1] }) }],
        }} />
        <Animated.View style={{
          position: 'absolute', width: 180, height: 180, borderRadius: 90,
          backgroundColor: 'rgba(122,215,198,0.08)',
          top: '45%', right: '10%',
          transform: [{ scale: pulseAnim }],
        }} />

        {/* Center content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {/* Progress ring */}
          <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
            {/* Track */}
            <View style={{
              position: 'absolute', width: CIRCLE_SIZE, height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2, borderWidth: STROKE,
              borderColor: 'rgba(255,255,255,0.08)',
            }} />
            {/* Vulse brand circle fill arc — using conic-like trick with rotation */}
            <Animated.View style={{
              position: 'absolute',
              width: CIRCLE_SIZE, height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2,
              borderWidth: STROKE,
              borderColor: '#7ad7c6',
              borderRightColor: 'transparent',
              borderBottomColor: 'transparent',
              transform: [
                { rotate: '-45deg' },
                { rotate: loadingProgress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              ],
            }} />
            <Animated.View style={{
              position: 'absolute',
              width: CIRCLE_SIZE, height: CIRCLE_SIZE,
              borderRadius: CIRCLE_SIZE / 2,
              borderWidth: STROKE,
              borderColor: '#7dd3fc',
              borderTopColor: 'transparent',
              borderLeftColor: 'transparent',
              transform: [
                { rotate: '-45deg' },
                { rotate: loadingProgress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '0deg', '360deg'] }) },
              ],
              opacity: loadingProgress.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] }),
            }} />
            {/* Center icon */}
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(122,215,198,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(122,215,198,0.3)' }}>
              <Ionicons name="happy-outline" size={32} color="#7ad7c6" />
            </View>
          </View>

          {/* Text */}
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, marginBottom: 10 }}>
            Smile! 😄
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 }}>
            Capturing your selfie to share this moment
          </Text>
        </View>
      </View>
    );
  }

  if (capturePhase === 'done' && mediaUri) {
    if (mode === 'reaction') {
      return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black relative justify-center items-center">
              <View className="w-full aspect-[3/4] rounded-[40px] overflow-hidden border-2 border-white/10">
                {mediaType === 'video' ? (
                  <Video source={{ uri: mediaUri }} style={{ width: '100%', height: '100%' }} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted={false} />
                ) : (
                  <Image source={{ uri: mediaUri }} className="w-full h-full" resizeMode="cover" />
                )}
              </View>
              
              <View className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
              <BouncyPressable onPress={onClose} style={{ position: 'absolute', top: insets.top + 10, left: 24 }} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20">
                <Ionicons name="close" size={24} color="white" />
              </BouncyPressable>

              <View className="absolute bottom-10 w-full px-6">
                <BlurView intensity={80} tint="dark" className="rounded-3xl border border-white/20 overflow-hidden shadow-2xl p-4">
                  <TextInput
                    value={reactionMessage}
                    onChangeText={setReactionMessage}
                    placeholder="Add a message..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    className="text-white text-lg font-medium mb-4 px-2"
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => onCapture && onCapture(mediaUri, reactionMessage)} className="w-full">
                    <LinearGradient colors={['#7ad7c6', '#7dd3fc']} start={{x:0, y:0}} end={{x:1, y:1}} className="rounded-2xl p-3 flex-row items-center justify-center">
                      <Ionicons name="send" size={18} color="#0b1326" className="mr-2" />
                      <Text className="text-[#0b1326] font-black text-sm tracking-widest">SEND REACTION</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </BlurView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      );
    }

    if (mode === 'daily') {
      const primaryUri = swapped ? frontMediaUri : mediaUri;
      const secondaryUri = swapped ? mediaUri : frontMediaUri;

      return (
        <View className="flex-1 bg-black relative">
          <TouchableOpacity activeOpacity={1} onPress={() => !isUploading && setSwapped(!swapped)} style={{ flex: 1 }}>
            {(!swapped && mediaType === 'video') || (swapped && frontMediaUri && false) ? (
              <Video source={{ uri: primaryUri! }} style={{ flex: 1 }} resizeMode={ResizeMode.COVER} shouldPlay isLooping />
            ) : (
              <Image source={{ uri: primaryUri! }} className="flex-1" resizeMode="cover" />
            )}
          </TouchableOpacity>
          
          <View className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          
          <View className="absolute z-50 flex-row justify-between w-full px-6" style={{ top: insets.top + 10 }}>
            <BouncyPressable onPress={() => { if (isUploading) return; setMediaUri(null); setFrontMediaUri(null); setCapturePhase('idle'); }} style={{ opacity: isUploading ? 0.3 : 1 }} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 backdrop-blur-md">
              <Ionicons name="close" size={24} color="white" />
            </BouncyPressable>
          </View>

          {/* Secondary small image (BeReal style) */}
          {secondaryUri && (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => !isUploading && setSwapped(!swapped)} 
              style={{ position: 'absolute', top: insets.top + 70, right: 24, width: 110, height: 150, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'white', shadowColor: 'black', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 10 }}
            >
               <Image source={{ uri: secondaryUri }} className="w-full h-full" resizeMode="cover" />
            </TouchableOpacity>
          )}

          <View className="absolute bottom-0 inset-x-0 z-50 pb-10 pt-6 px-4 pointer-events-box-none">
            <TouchableOpacity onPress={() => handleUpload('DAILY')} disabled={isUploading} className="w-full shadow-2xl">
              <LinearGradient colors={['#7ad7c6', '#7dd3fc']} start={{x:0, y:0}} end={{x:1, y:1}} className="rounded-full p-4 flex-row items-center justify-center h-16 shadow-[0_0_20px_rgba(122,215,198,0.4)]">
                {isUploading ? <ActivityIndicator color="#0b1326" /> : (
                  <>
                    <Ionicons name="paper-plane" size={24} color="#0b1326" className="mr-3" />
                    <Text className="text-[#0b1326] font-black text-lg tracking-widest">SEND TO FRIENDS</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Reel mode preview
    return (
      <View className="flex-1 bg-black relative">
        {mediaType === 'video' ? (
          <Video source={{ uri: mediaUri }} style={{ flex: 1 }} resizeMode={ResizeMode.COVER} shouldPlay isLooping />
        ) : (
          <Image source={{ uri: mediaUri }} className="flex-1" resizeMode="cover" />
        )}
        <View className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <View className="absolute z-50 flex-row justify-between w-full px-6" style={{ top: insets.top + 10 }}>
          <BouncyPressable onPress={() => { if (isUploading) return; setMediaUri(null); setCapturePhase('idle'); }} style={{ opacity: isUploading ? 0.3 : 1 }} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 backdrop-blur-md">
            <Ionicons name="close" size={24} color="white" />
          </BouncyPressable>
        </View>
        <View className="absolute bottom-0 inset-x-0 z-50 pb-10 pt-6 px-4">
           <TouchableOpacity onPress={() => handleUpload('REEL')} disabled={isUploading} className="w-full">
             <LinearGradient colors={['#7ad7c6', '#7dd3fc']} start={{x:0, y:0}} end={{x:1, y:1}} className="rounded-full p-4 flex-row items-center justify-center h-16 shadow-[0_0_20px_rgba(122,215,198,0.3)]">
               {isUploading ? <ActivityIndicator color="#0b1326" /> : (
                 <>
                   <Ionicons name="globe-outline" size={24} color="#0b1326" className="mr-3" />
                   <Text className="text-[#0b1326] font-black text-lg tracking-widest">POST REEL</Text>
                 </>
               )}
             </LinearGradient>
           </TouchableOpacity>
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
        mode={cameraMode}
        enableTorch={flash === 'on'}
      />
      
      {/* Dim overlay for selfie mode in reactions */}
      {mode === 'reaction' && (
         <View className="absolute inset-0 pointer-events-none" style={{ borderWidth: 20, borderColor: 'rgba(0,0,0,0.4)', borderRadius: 40 }} />
      )}

      {/* TOP CONTROLS */}
      <View className="absolute z-50 flex-row justify-between w-full px-6" style={{ top: insets.top + 10 }}>
        <BouncyPressable 
          onPress={() => !isUploading && onClose()} 
          className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20"
          style={{ opacity: isUploading ? 0.3 : 1 }}
        >
          <Ionicons name="chevron-down" size={28} color="white" />
        </BouncyPressable>
        
        {mode !== 'reaction' && !isUploading && (
          <BouncyPressable onPress={toggleFlash} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20">
            <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color={flash === 'on' ? '#fde047' : 'white'} />
          </BouncyPressable>
        )}
      </View>

      {/* BOTTOM CONTROLS */}
      <View className="absolute bottom-12 inset-x-0 items-center px-10">
        <View className="flex-row justify-between items-center w-full">
          <View className="flex-1 items-start" />
          
          {/* CAPTURE BUTTON */}
          <BouncyPressable onPress={isUploading ? undefined : (cameraMode === 'picture' ? takePicture : toggleRecording)} scaleTo={0.85}>
            <View className="relative items-center justify-center" style={{ opacity: isUploading ? 0.3 : 1 }}>
              {cameraMode === 'picture' && (
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="absolute w-24 h-24 rounded-full border-[3px] border-[#7dd3fc]/50" />
              )}
              {isRecording && (
                <View className="absolute w-24 h-24 rounded-full border-[4px] border-[#ff4b4b] animate-ping" />
              )}
              <View className="w-20 h-20 rounded-full border-[4px] border-white items-center justify-center p-1 bg-black/20 backdrop-blur-sm">
                 <View className={`w-full h-full rounded-full ${cameraMode === 'video' ? (isRecording ? 'bg-[#ff4b4b] rounded-lg w-8 h-8' : 'bg-[#ff4b4b]') : 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]'}`} />
              </View>
            </View>
          </BouncyPressable>

          {/* FLIP CAMERA */}
          <View className="flex-1 items-end">
            {mode !== 'reaction' && !isUploading && (
              <BouncyPressable onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} className="w-14 h-14 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20">
                <Ionicons name="sync" size={26} color="white" />
              </BouncyPressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
