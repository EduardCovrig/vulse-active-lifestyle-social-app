import React from 'react';
import { View, Image, Text } from 'react-native';

export default function ConcentricRings({ friend }: { friend: any }) {
  if (!friend) return null;

  const safeDiv = (a: number, b: number) => (b > 0 ? Math.min(a / b, 1) : 0);

  const calP  = safeDiv(friend.cal  || friend.calories || 0, friend.calGoal  || friend.dailyCaloriesGoal || 1);
  const carbP = safeDiv(friend.carbs || friend.carbsGrams || 0, friend.carbsGoal || friend.dailyCarbsGoal || 1);
  const proP  = safeDiv(friend.pro  || friend.proteinGrams || 0, friend.proGoal  || friend.dailyProteinGoal || 1);
  const fatP  = safeDiv(friend.fat  || friend.fatGrams || 0, friend.fatGoal  || friend.dailyFatGoal || 1);

  const initial = (friend.username ?? friend.name ?? '?').charAt(0).toUpperCase();

  return (
    <View style={{ width: 68, height: 68, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 3.5, borderColor: `rgba(125, 211, 252, ${Math.max(0.15, calP)})`,  position: 'absolute' }} />
      <View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 3.5, borderColor: `rgba(59, 130, 246, ${Math.max(0.15, carbP)})`,  position: 'absolute' }} />
      <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 3.5, borderColor: `rgba(192, 132, 252, ${Math.max(0.15, proP)})`,  position: 'absolute' }} />
      <View style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 3.5, borderColor: `rgba(250, 204, 21, ${Math.max(0.15, fatP)})`,  position: 'absolute' }} />

      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {friend.profilePicUrl ? (
          <Image source={{ uri: friend.profilePicUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{initial}</Text>
        )}
      </View>
    </View>
  );
}