import React from 'react';
import { View, Modal, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import PinchableImage from './PinchableImage';

interface ImagePopoutModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function ImagePopoutModal({ visible, imageUri, onClose }: ImagePopoutModalProps) {
  const handleDownload = async () => {
    if (!imageUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to save images.');
        return;
      }

      const filename = imageUri.split('/').pop() || 'vulse_snap.jpg';
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadRes = await FileSystem.downloadAsync(imageUri, fileUri);
      await MediaLibrary.saveToLibraryAsync(downloadRes.uri);
      
      Alert.alert('Saved!', 'Image saved to your gallery.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save the image.');
    }
  };

  if (!imageUri) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={onClose} />
        
        <View style={{ position: 'absolute', top: 60, right: 20, zIndex: 50, flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            onPress={handleDownload} 
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Ionicons name="download-outline" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onClose} 
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <View style={{ width: width * 0.88, height: width * 1.15, borderRadius: 24, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' }}>
          <PinchableImage uri={imageUri} className="w-full h-full object-cover" />
        </View>
      </View>
    </Modal>
  );
}
