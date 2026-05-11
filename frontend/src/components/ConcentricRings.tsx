import React from 'react';
import { View, Image, Text } from 'react-native';

export default function ConcentricRings({ friend }: { friend: any }) {
  const calP = Math.min((friend.cal || 0) / (friend.calGoal || 1), 1);
  const carbP = Math.min((friend.carbs || 0) / (friend.carbsGoal || 1), 1);
  const proP = Math.min((friend.pro || 0) / (friend.proGoal || 1), 1);
  const fatP = Math.min((friend.fat || 0) / (friend.fatGoal || 1), 1);

  return (
    <View style={{ width: 68, height: 68, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 3.5, borderColor: `rgba(125, 211, 252, ${Math.max(0.15, calP)})`, position: 'absolute' }} />
      <View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 3.5, borderColor: `rgba(59, 130, 246, ${Math.max(0.15, carbP)})`, position: 'absolute' }} />
      <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 3.5, borderColor: `rgba(192, 132, 252, ${Math.max(0.15, proP)})`, position: 'absolute' }} />
      <View style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 3.5, borderColor: `rgba(250, 204, 21, ${Math.max(0.15, fatP)})`, position: 'absolute' }} />
      
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {friend.profilePicUrl ? (
          <Image source={{ uri: friend.profilePicUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{friend.username[0].toUpperCase()}</Text>
        )}
      </View>
    </View>
  );
}