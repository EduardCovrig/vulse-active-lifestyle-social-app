import React from 'react';
import { View, Text, Image, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import BouncyPressable from './BouncyPressable';

interface CameraPreviewDoneProps {
  mode: 'daily' | 'reaction' | 'reel';
  mediaUri: string | null;
  frontMediaUri: string | null;
  mediaType: 'image' | 'video';
  swapped: boolean;
  setSwapped: (swapped: boolean) => void;
  onClose: () => void;
  insets: any;
  reactionMessage: string;
  setReactionMessage: (text: string) => void;
  onCapture?: (uri: string, message?: string) => void;
  isUploading: boolean;
  handleUpload: (type: 'DAILY' | 'REEL') => Promise<void>;
}

export default function CameraPreviewDone({
  mode,
  mediaUri,
  frontMediaUri,
  mediaType,
  swapped,
  setSwapped,
  onClose,
  insets,
  reactionMessage,
  setReactionMessage,
  onCapture,
  isUploading,
  handleUpload,
}: CameraPreviewDoneProps) {
  if (mode === 'reaction' && mediaUri) {
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

  if (mode === 'daily' && mediaUri) {
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
          <BouncyPressable onPress={onClose} style={{ opacity: isUploading ? 0.3 : 1 }} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 backdrop-blur-md">
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
      {mediaUri && mediaType === 'video' ? (
        <Video source={{ uri: mediaUri }} style={{ flex: 1 }} resizeMode={ResizeMode.COVER} shouldPlay isLooping />
      ) : (
        mediaUri && <Image source={{ uri: mediaUri }} className="flex-1" resizeMode="cover" />
      )}
      <View className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <View className="absolute z-50 flex-row justify-between w-full px-6" style={{ top: insets.top + 10 }}>
        <BouncyPressable onPress={onClose} style={{ opacity: isUploading ? 0.3 : 1 }} className="w-12 h-12 bg-black/40 rounded-full items-center justify-center border border-white/20 backdrop-blur-md">
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
