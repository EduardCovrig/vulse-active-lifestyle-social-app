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
    <>
      <SwipeableModal visible={visible} onClose={onClose}>
        <BlurView 
          intensity={80} 
          tint="dark" 
          style={{ height: SCREEN_HEIGHT * 0.82, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,14,23,0.93)' }} />
          
          {/* X button */}
          <TouchableOpacity 
            onPress={onClose} 
            style={{ position: 'absolute', top: 4, right: 18, zIndex: 50, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={15} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text className="text-white font-bold text-lg text-center tracking-tight">Your Calendar</Text>
            <Text className="text-white/25 text-[9px] text-center mt-1 uppercase tracking-widest">Daily snaps from the last 365 days</Text>
          </View>

          {loading ? (
            <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ paddingBottom: 50, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 6 }}
            >
              {days.map((day, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => day.url && setSelectedImage(day.url)}
                  disabled={!day.url}
                  style={{ 
                    width: '31%', 
                    aspectRatio: 0.85, 
                    margin: '1%', 
                    borderRadius: 14, 
                    overflow: 'hidden', 
                    borderWidth: 0.5, 
                    borderColor: day.url ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  {day.url ? (
                    <Image 
                      source={{ uri: day.url }} 
                      style={{ width: '100%', height: '100%', position: 'absolute' }} 
                      resizeMode="cover" 
                    />
                  ) : (
                    <Ionicons name="camera-outline" size={16} color="rgba(255,255,255,0.06)" />
                  )}
                  <View style={{ position: 'absolute', bottom: 4, left: 0, right: 0, alignItems: 'center' }}>
                    <Text style={{ fontSize: 8, fontWeight: '600', color: day.url ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{day.displayDate}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </BlurView>
      </SwipeableModal>
      <ImagePopoutModal visible={selectedImage !== null} imageUri={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
}
