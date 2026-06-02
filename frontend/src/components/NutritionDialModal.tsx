import React from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface NutritionDialModalProps {
  macroDial: { visible: boolean; type: 'cal'|'pro'|'carb'|'fat'; label: string; baseColor: string };
  setMacroDial: (status: any) => void;
  insets: any;
  panResponder: any;
  uiParams: { currentColor: string; rotationDegrees: number; laps: number };
  dialValue: number;
  saveMacroGoal: () => Promise<void>;
  isSavingDial: boolean;
}

export default function NutritionDialModal({
  macroDial,
  setMacroDial,
  insets,
  panResponder,
  uiParams,
  dialValue,
  saveMacroGoal,
  isSavingDial,
}: NutritionDialModalProps) {
  if (!macroDial.visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}>
      <View className="flex-1 bg-[#090E17]/95 justify-center items-center relative" {...panResponder.panHandlers}>
        <TouchableOpacity onPress={() => setMacroDial({...macroDial, visible: false})} style={{ position: 'absolute', top: insets.top + 20, right: 20, zIndex: 100 }} className="w-12 h-12 bg-white/10 rounded-full items-center justify-center border border-white/20">
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white/40 text-sm font-bold tracking-[5px] uppercase absolute top-40 pointer-events-none">TARGET {macroDial.label}</Text>

        <View className="items-center justify-center pointer-events-none">
          <View style={{ backgroundColor: uiParams.currentColor, shadowColor: uiParams.currentColor, shadowRadius: 40, shadowOpacity: 0.6, shadowOffset: {width: 0, height: 0} }} className="w-[280px] h-[280px] rounded-full items-center justify-center p-3">
            <View className="w-full h-full bg-[#06090E] rounded-full items-center justify-center relative shadow-inner">
              <Text style={{ color: uiParams.currentColor }} className="text-6xl font-black tracking-tighter">{dialValue}</Text>
              <Text className="text-white/50 font-bold uppercase mt-1">{macroDial.type === 'cal' ? 'kcal' : 'grams'}</Text>
              {uiParams.laps > 0 && (
                 <View className="absolute top-10 flex-row gap-1">
                    {Array.from({length: Math.min(uiParams.laps, 3)}).map((_, i) => <View key={i} className="w-1.5 h-1.5 rounded-full bg-white opacity-80" /> )}
                    {uiParams.laps > 3 && <Text className="text-white text-[8px] font-bold">+{(uiParams.laps - 3)}</Text>}
                 </View>
              )}
              <Animated.View style={{ position: 'absolute', width: '100%', height: '100%', transform: [{ rotate: `${uiParams.rotationDegrees}deg` }] }}>
                 <View className="absolute top-2 w-5 h-5 rounded-full bg-white self-center shadow-[0_0_15px_white]" />
              </Animated.View>
            </View>
          </View>
        </View>

        <View className="absolute bottom-40 items-center opacity-40 pointer-events-none">
          <Ionicons name="sync" size={24} color="white" />
          <Text className="text-[10px] text-white font-bold tracking-widest mt-2">SWIRL TO ADJUST</Text>
        </View>
        <TouchableOpacity onPress={saveMacroGoal} disabled={isSavingDial} className="absolute bottom-20 z-50">
          <LinearGradient colors={[uiParams.currentColor, '#ffffff']} className="px-10 h-14 rounded-full items-center justify-center flex-row shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            {isSavingDial ? <ActivityIndicator color="#090E17" /> : <Text className="text-[#090E17] font-black text-lg tracking-wider">SET GOAL</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}
