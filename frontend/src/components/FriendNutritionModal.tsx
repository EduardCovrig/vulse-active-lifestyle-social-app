import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeableModal from './SwipeableModal';

interface FriendNutritionModalProps {
  visible: boolean;
  onClose: () => void;
  friend: any;
}

export default function FriendNutritionModal({ visible, onClose, friend }: FriendNutritionModalProps) {
  if (!friend) return null;

  return (
    <SwipeableModal 
      visible={visible} 
      onClose={onClose}
      title={`${friend.username}'s Progress`}
      subtitle="Daily Nutrition Goals"
      heightRatio={0.5}
    >
      <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ color: 'white', fontSize: 56, fontWeight: '900', letterSpacing: -2 }}>{friend.cal}</Text>
          <Text style={{ color: '#7dd3fc', fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginLeft: 8 }}>/ {friend.calGoal}</Text>
        </View>

        <View style={{ width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden', marginBottom: 30 }}>
          <LinearGradient 
            colors={['#7ad7c6', '#7dd3fc']} 
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
            style={{ width: `${Math.min((friend.cal / (friend.calGoal || 1)) * 100, 100)}%`, height: '100%' }} 
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          {[
            { label: 'PRO', val: friend.pro, goal: friend.proGoal, color: '#c084fc' },
            { label: 'CARBS', val: friend.carbs, goal: friend.carbsGoal, color: '#3b82f6' },
            { label: 'FATS', val: friend.fat, goal: friend.fatGoal, color: '#facc15' }
          ].map((macro, idx) => (
            <View key={idx} style={{ flex: 1, alignItems: 'center', borderRightWidth: idx < 2 ? 0.5 : 0, borderRightColor: 'rgba(255,255,255,0.05)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 }}>{macro.label}</Text>
              <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 8 }}>{macro.val} / <Text style={{ color: macro.color }}>{macro.goal}</Text></Text>
              <View style={{ width: 50, height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: '100%', backgroundColor: macro.color, width: `${Math.min((macro.val / (macro.goal || 1)) * 100, 100)}%` }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </SwipeableModal>
  );
}