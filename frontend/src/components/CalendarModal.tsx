import React from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';
import ImagePopoutModal from './ImagePopoutModal';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  snaps: any[];
}

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
      <SwipeableModal visible={visible} onClose={onClose} title="Your Calendar" subtitle="Daily snaps from the last 365 days" heightRatio={0.82}>
        {loading ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 6 }}>
            {days.map((day, i) => (
              <TouchableOpacity key={i} onPress={() => day.url && setSelectedImage(day.url)} disabled={!day.url}
                style={{ width: '31%', aspectRatio: 0.85, margin: '1%', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: day.url ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center' }}
              >
                {day.url ? (
                  <Image source={{ uri: day.url }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
                ) : (
                  <Ionicons name="camera-outline" size={16} color="rgba(255,255,255,0.06)" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </SwipeableModal>
      <ImagePopoutModal visible={selectedImage !== null} imageUri={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
}