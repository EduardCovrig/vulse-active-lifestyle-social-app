import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface ManualLogModalProps {
  visible: boolean;
  onClose: () => void;
  editingMealId: string | null;
  manualMeal: { cal: string; pro: string; carbs: string; fat: string; desc: string };
  setManualMeal: React.Dispatch<React.SetStateAction<{ cal: string; pro: string; carbs: string; fat: string; desc: string }>>;
  handleManualSave: () => void;
  isSavingManual: boolean;
}

import SwipeableModal from './SwipeableModal';

export default function ManualLogModal({ 
  visible, onClose, editingMealId, 
  manualMeal, setManualMeal, handleManualSave, isSavingManual 
}: ManualLogModalProps) {

  return (
    <SwipeableModal visible={visible} onClose={onClose} avoidKeyboard>
        <BlurView intensity={90} tint="dark" className="rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] overflow-hidden max-h-[85%] pt-12">
          <View className="absolute inset-0 bg-[#090E17]/80" />

          <TouchableOpacity onPress={onClose} className="absolute top-4 right-6 z-50 w-8 h-8 bg-white/10 rounded-full items-center justify-center border border-white/20">
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Text className="text-white font-black text-2xl mb-2 text-center tracking-tight">{editingMealId ? 'Edit Log' : 'Manual Log'}</Text>
            <Text className="text-white/40 text-sm text-center mb-8">{editingMealId ? 'Update your meal data.' : 'Add a meal without a photo.'}</Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              <View className="w-full mb-2">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Total Calories *</Text>
                <View className="bg-[#7ad7c6]/10 border border-[#7ad7c6]/30 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={manualMeal.cal} onChangeText={(v) => setManualMeal(p => ({ ...p, cal: v }))} className="text-[#7ad7c6] font-black text-xl" placeholder="e.g. 450" placeholderTextColor="#7ad7c650" keyboardAppearance="dark" />
                </View>
              </View>
              <View className="w-[30%]">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Prot (g)</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={manualMeal.pro} onChangeText={(v) => setManualMeal(p => ({ ...p, pro: v }))} className="text-white font-bold text-lg" placeholder="0" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
              <View className="w-[30%]">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Carbs (g)</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={manualMeal.carbs} onChangeText={(v) => setManualMeal(p => ({ ...p, carbs: v }))} className="text-white font-bold text-lg" placeholder="0" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
              <View className="w-[30%]">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Fat (g)</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={manualMeal.fat} onChangeText={(v) => setManualMeal(p => ({ ...p, fat: v }))} className="text-white font-bold text-lg" placeholder="0" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
              <View className="w-full mt-2">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Description / Name</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl min-h-[56px] py-3 px-4">
                  <TextInput value={manualMeal.desc} onChangeText={(v) => setManualMeal(p => ({ ...p, desc: v }))} multiline className="text-white font-body-md" placeholder="e.g. Chicken salad with olive oil..." placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleManualSave} 
              disabled={isSavingManual || !manualMeal.cal}
              className={`mt-10 h-14 rounded-full items-center justify-center shadow-lg ${(isSavingManual || !manualMeal.cal) ? 'bg-white/10' : 'bg-[#7ad7c6]'}`}
            >
              <Text className={`${(isSavingManual || !manualMeal.cal) ? 'text-white/30' : 'text-[#090E17]'} font-black text-lg tracking-wide`}>
                {isSavingManual ? 'Saving...' : (editingMealId ? 'Save Changes' : 'Add Meal')}
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </BlurView>
    </SwipeableModal>
  );
}
