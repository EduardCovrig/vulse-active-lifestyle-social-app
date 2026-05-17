/**
 * CalendarModal
 *
 * Uses SwipeableModal's `afterClose` callback instead of setTimeout.
 * This ensures the photo viewer opens ONLY after the native Modal has
 * been fully dismissed from the view hierarchy — preventing touch-intercept freeze.
 */
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeableModal from './SwipeableModal';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  snaps: any[];
  onSnapPress?: (url: string) => void;
}

export default function CalendarModal({ visible, onClose, loading, snaps, onSnapPress }: CalendarModalProps) {
  // Capture the pending URL to open after this modal fully closes
  const pendingUrl = useRef<string | null>(null);

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
    <SwipeableModal
      visible={visible}
      onClose={onClose}
      // afterClose fires once the native Modal is completely gone from the hierarchy
      afterClose={() => {
        if (pendingUrl.current && onSnapPress) {
          const url = pendingUrl.current;
          pendingUrl.current = null;
          onSnapPress(url);
        }
      }}
      title="Your Calendar"
      subtitle="Daily snaps from the last 365 days"
      heightRatio={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 12 }}
        >
          {days.map((day, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (day.url && onSnapPress) {
                  pendingUrl.current = day.url;
                  // Closing the modal triggers afterClose which calls onSnapPress
                  onClose();
                }
              }}
              disabled={!day.url}
              style={{
                width: '47%', aspectRatio: 0.8, margin: '1.5%',
                borderRadius: 24, overflow: 'hidden',
                borderWidth: 0.5,
                borderColor: day.url ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {day.url ? (
                <Image source={{ uri: day.url }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
              ) : (
                <Ionicons name="camera-outline" size={20} color="rgba(255,255,255,0.06)" />
              )}

              {day.url && (
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  locations={[0.5, 1]}
                  style={StyleSheet.absoluteFillObject}
                />
              )}

              <View style={{ position: 'absolute', bottom: 12, left: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: day.url ? 'white' : 'rgba(255,255,255,0.15)', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                  {day.displayDate}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SwipeableModal>
  );
}