import { useState, useRef, useEffect } from 'react';
import { Animated, Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';

interface UseCameraProps {
  onClose: () => void;
  mode?: 'daily' | 'reaction' | 'reel';
  onCapture?: (uri: string, message?: string) => void;
}

export function useCamera({ onClose, mode = 'daily', onCapture }: UseCameraProps) {
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
  }, [pulseAnim]);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setMediaUri(photo.uri);
      setCapturePhase('done');
    } else {
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

  return {
    facing,
    setFacing,
    flash,
    setFlash,
    cameraMode,
    setCameraMode,
    permission,
    requestPermission,
    mediaUri,
    setMediaUri,
    frontMediaUri,
    setFrontMediaUri,
    mediaType,
    setMediaType,
    capturePhase,
    setCapturePhase,
    swapped,
    setSwapped,
    reactionMessage,
    setReactionMessage,
    isRecording,
    setIsRecording,
    isUploading,
    setIsUploading,
    cameraRef,
    insets,
    pulseAnim,
    loadingProgress,
    toggleFlash,
    takePicture,
    toggleRecording,
    handleUpload,
  };
}
