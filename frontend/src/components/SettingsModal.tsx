import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BouncyPressable from './BouncyPressable';
import SwipeableModal from './SwipeableModal';

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
    <SwipeableModal visible={visible} onClose={onClose} title="Settings" heightRatio={0.45}>
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
    </SwipeableModal>
  );
}