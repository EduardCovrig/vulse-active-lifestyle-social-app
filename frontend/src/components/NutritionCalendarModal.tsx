import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';
import ConcentricRings from './ConcentricRings';

interface NutritionCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  history: any[];
}

export default function NutritionCalendarModal({ visible, onClose, loading, history }: NutritionCalendarModalProps) {
  
  // Format history for easy display by month
  // We'll just display a simple grid of the last 30 days
  return (
    <SwipeableModal visible={visible} onClose={onClose} title="Nutrition History" subtitle="Your macros over the last 30 days" heightRatio={0.85}>
      {loading ? (
        <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 12 }}>
          {history.map((dayData, i) => {
            const d = new Date(dayData.date);
            const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
            
            return (
              <View 
                key={i} 
                style={{ width: '22%', aspectRatio: 0.8, margin: '1.5%', borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
              >
                <ConcentricRings friend={dayData} />
                <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginTop: 8, textAlign: 'center', textTransform: 'uppercase' }}>
                  {displayDate.split(',')[0]}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '800', color: 'white', marginTop: 2, textAlign: 'center' }}>
                  {d.getDate()}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SwipeableModal>
  );
}
