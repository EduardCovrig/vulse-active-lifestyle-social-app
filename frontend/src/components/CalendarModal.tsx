import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';
import ImagePopoutModal from './ImagePopoutModal';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  snaps: any[];
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CalendarModal({ visible, onClose, loading, snaps }: CalendarModalProps) {
  const snapMap = snaps.reduce((acc, curr) => {
    acc[curr.date] = curr.mediaUrl;
    return acc;
  }, {} as Record<string, string>);

  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const today = new Date();
  const days = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      url: snapMap[dateStr] || null
    });
  }

  return (
    <SwipeableModal visible={visible} onClose={onClose}>
      <BlurView 
        intensity={80} 
        tint="dark" 
        style={{ height: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,14,23,0.92)', borderTopLeftRadius: 32, borderTopRightRadius: 32 }} />
        
        <TouchableOpacity 
          onPress={onClose} 
          style={{ position: 'absolute', top: 16, right: 20, zIndex: 50, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={18} color="white" />
        </TouchableOpacity>

        <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
          <Text className="text-white font-black text-xl text-center tracking-tight mb-1">Your Calendar</Text>
          <Text className="text-white/40 text-xs text-center mb-5">Daily snaps from the last 365 days</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 40, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 8 }}
          >
            {days.map((day, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => day.url && setSelectedImage(day.url)}
                disabled={!day.url}
                style={{ width: '31%', aspectRatio: 1, margin: '1%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' }}
              >
                {day.url ? (
                  <Image source={{ uri: day.url }} style={{ width: '100%', height: '100%', position: 'absolute' }} />
                ) : (
                  <Ionicons name="camera-outline" size={20} color="rgba(255,255,255,0.08)" />
                )}
                <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.7)' }}>{day.displayDate}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </BlurView>
      <ImagePopoutModal visible={selectedImage !== null} imageUri={selectedImage} onClose={() => setSelectedImage(null)} />
    </SwipeableModal>
  );
}
