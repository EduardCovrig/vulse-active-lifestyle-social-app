import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CameraAccessPromptProps {
  permission: any;
  requestPermission: () => Promise<any>;
}

export default function CameraAccessPrompt({
  permission,
  requestPermission,
}: CameraAccessPromptProps) {
  const handleGrantAccess = () => {
    if (!permission.canAskAgain) {
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
