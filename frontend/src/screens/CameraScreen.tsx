import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import BouncyPressable from '../components/BouncyPressable';
import { useCamera } from '../hooks/useCamera';
import CameraAccessPrompt from '../components/CameraAccessPrompt';
import CameraProgressRing from '../components/CameraProgressRing';
import CameraPreviewDone from '../components/CameraPreviewDone';

interface CameraScreenProps {
  onClose: () => void;
  mode?: 'daily' | 'reaction' | 'reel';
  onCapture?: (uri: string, message?: string) => void;
}

export default function CameraScreen({ onClose, mode = 'daily', onCapture }: CameraScreenProps) {
  const {
    facing,
    setFacing,
    flash,
    cameraMode,
    setCameraMode,
    permission,
    requestPermission,
    mediaUri,
    setMediaUri,
    frontMediaUri,
    setFrontMediaUri,
    mediaType,
    capturePhase,
    setCapturePhase,
    swapped,
    setSwapped,
    reactionMessage,
    setReactionMessage,
    isRecording,
    isUploading,
    cameraRef,
    insets,
    pulseAnim,
    loadingProgress,
    toggleFlash,
    takePicture,
    toggleRecording,
    handleUpload,
  } = useCamera({ onClose, mode, onCapture });

  if (!permission) return <View className="flex-1 bg-black" />;

  if (!permission.granted) {
    return (
      <CameraAccessPrompt 
        permission={permission} 
        requestPermission={requestPermission} 
      />
    );
  }

  if (capturePhase === 'loading' || capturePhase === 'taking_front') {
    return (
      <CameraProgressRing
        cameraRef={cameraRef}
        pulseAnim={pulseAnim}
        loadingProgress={loadingProgress}
      />
    );
  }

  if (capturePhase === 'done' && mediaUri) {
    return (
      <CameraPreviewDone
        mode={cameraMode === 'video' ? 'reel' : mode}
        mediaUri={mediaUri}
        frontMediaUri={frontMediaUri}
        mediaType={mediaType}
        swapped={swapped}
        setSwapped={setSwapped}
        onClose={() => {
          setMediaUri(null);
          setFrontMediaUri(null);
          setCapturePhase('idle');
        }}
        insets={insets}
        reactionMessage={reactionMessage}
        setReactionMessage={setReactionMessage}
        onCapture={onCapture}
        isUploading={isUploading}
        handleUpload={handleUpload}
      />
    );
  }

  return (
    <View className="flex-1 bg-black relative">
      <CameraView 
        ref={cameraRef} 
        style={StyleSheet.absoluteFillObject} 
        facing={facing} 
        mode={cameraMode}
        enableTorch={flash === 'on'}
      />
      
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
        {mode !== 'reaction' && !isUploading && (
          <View style={{ flexDirection: 'row', gap: 24, marginBottom: 20, justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setCameraMode('picture')} activeOpacity={0.8}>
              <Text className="text-white font-extrabold text-[12px] tracking-wider uppercase" style={{ opacity: cameraMode === 'picture' ? 1 : 0.4 }}>
                Capture a Moment
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCameraMode('video')} activeOpacity={0.8}>
              <Text className="text-white font-extrabold text-[12px] tracking-wider uppercase" style={{ opacity: cameraMode === 'video' ? 1 : 0.4 }}>
                Record a Video
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
