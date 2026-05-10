import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, PanResponder, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import BouncyPressable from './BouncyPressable';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenBlockedUsers: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function SettingsModal({ visible, onClose, onOpenBlockedUsers, onLogout, onDeleteAccount }: SettingsModalProps) {
  const { height } = Dimensions.get('window');
  const panY = useRef(new Animated.Value(0)).current;

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: height,
    duration: 300,
    useNativeDriver: true,
  });

  const swipeDownToClose = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1.5) {
          closeAnim.start(() => {
             onClose();
             panY.setValue(0);
          });
        } else {
          resetPositionAnim.start();
        }
      }
    })
  ).current;

  // We want to reset panY when it opens
  React.useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <TouchableOpacity className="absolute inset-0 bg-black/60" activeOpacity={1} onPress={onClose} />
        <Animated.View style={{ transform: [{ translateY: panY }] }}>
          <BlurView intensity={90} tint="dark" className="p-6 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] pb-10">
          <View className="absolute inset-0 bg-[#090E17]/80" />
          
          <View {...swipeDownToClose.panHandlers} className="w-full pt-4 pb-2 items-center bg-transparent z-50">
            <View className="w-12 h-1.5 bg-white/20 rounded-full" />
          </View>

          <TouchableOpacity onPress={onClose} className="absolute top-4 right-6 z-50 w-8 h-8 bg-white/10 rounded-full items-center justify-center border border-white/20">
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>

          <Text className="text-white font-black text-2xl mb-6 text-center tracking-tight mt-2">Settings</Text>

          <View className="bg-white/[0.03] rounded-[32px] border border-white/5 overflow-hidden">
            <BouncyPressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}>
              <View className="flex-row items-center justify-between p-5 border-b border-white/5">
                <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="notifications" size={18} color="white" /></View><Text className="text-white/90 font-bold text-base">Notifications</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </View>
            </BouncyPressable>

            <BouncyPressable onPress={onOpenBlockedUsers}>
              <View className="flex-row items-center justify-between p-5 border-b border-white/5">
                <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="shield-half" size={18} color="white" /></View><Text className="text-white/90 font-bold text-base">Blocked Users</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </View>
            </BouncyPressable>

            <BouncyPressable onPress={() => { onClose(); onLogout(); }}>
              <View className="flex-row items-center justify-between p-5 border-b border-white/5">
                <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"><Ionicons name="log-out" size={18} color="white" /></View><Text className="text-white/90 font-bold text-base">Sign Out</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#555" />
              </View>
            </BouncyPressable>

            <BouncyPressable onPress={() => { onClose(); onDeleteAccount(); }}>
              <View className="flex-row items-center justify-between p-5">
                <View className="flex-row items-center gap-4"><View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center"><Ionicons name="trash" size={18} color="#ff4b4b" /></View><Text className="text-[#ff4b4b] font-bold text-base">Delete Account</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#ff4b4b" />
              </View>
            </BouncyPressable>
          </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}
