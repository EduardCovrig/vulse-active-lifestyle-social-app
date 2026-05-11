import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  snaps: any[];
  onSnapPress?: (url: string) => void;
}

export default function CalendarModal({ visible, onClose, loading, snaps, onSnapPress }: CalendarModalProps) {
  const snapMap = snaps.reduce((acc, curr) => {
    acc[curr.date] = curr.mediaUrl;
    return acc;
  }, {} as Record<string, string>);

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
    <SwipeableModal visible={visible} onClose={onClose} title="Your Calendar" subtitle="Daily snaps from the last 365 days" heightRatio={0.82}>
      {loading ? (
        <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 6 }}>
          {days.map((day, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => {
                if (day.url && onSnapPress) {
                  onSnapPress(day.url);
                }
              }} 
              disabled={!day.url}
              style={{ width: '31%', aspectRatio: 0.85, margin: '1%', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: day.url ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center' }}
            >
              {day.url ? (
                <Image source={{ uri: day.url }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
              ) : (
                <Ionicons name="camera-outline" size={16} color="rgba(255,255,255,0.06)" />
              )}
              {/* Overlay gradient pt text */}
              {day.url && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, backgroundColor: 'rgba(0,0,0,0.5)' }} />
              )}
              <View style={{ position: 'absolute', bottom: 4 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: day.url ? 'white' : 'rgba(255,255,255,0.15)', textShadowColor: 'black', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>{day.displayDate}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SwipeableModal>
  );
}