import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BouncyPressable from './BouncyPressable';
import SwipeableModal from './SwipeableModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenBlockedUsers: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function SettingsModal({ visible, onClose, onOpenBlockedUsers, onLogout, onDeleteAccount }: SettingsModalProps) {
  const settingsItems = [
    { icon: 'notifications-outline' as const, label: 'Notifications', color: 'rgba(255,255,255,0.7)', onPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); } },
    { icon: 'shield-half-outline' as const, label: 'Blocked Users', color: 'rgba(255,255,255,0.7)', onPress: onOpenBlockedUsers },
    { icon: 'log-out-outline' as const, label: 'Sign Out', color: 'rgba(255,255,255,0.7)', onPress: () => { onClose(); onLogout(); } },
    { icon: 'trash-outline' as const, label: 'Delete Account', color: '#ff6b6b', onPress: () => { onClose(); onDeleteAccount(); }, danger: true },
  ];

  return (
    <SwipeableModal visible={visible} onClose={onClose}>
      <BlurView 
        intensity={80} 
        tint="dark" 
        style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', paddingBottom: 40 }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,14,23,0.93)' }} />
        
        {/* Drag handle */}
        <View style={{ width: '100%', alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </View>

        {/* X button */}
        <TouchableOpacity 
          onPress={onClose} 
          style={{ position: 'absolute', top: 14, right: 18, zIndex: 50, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={15} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={{ paddingTop: 4, paddingBottom: 16 }}>
          <Text className="text-white font-bold text-lg text-center tracking-tight">Settings</Text>
        </View>

        <View style={{ marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
          {settingsItems.map((item, i) => (
            <BouncyPressable key={i} onPress={item.onPress}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < settingsItems.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item.danger ? 'rgba(255,107,107,0.08)' : 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={{ color: item.danger ? '#ff6b6b' : 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 15 }}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={item.danger ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.12)'} />
              </View>
            </BouncyPressable>
          ))}
        </View>
      </BlurView>
    </SwipeableModal>
  );
}
