import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ManualLogModalProps {
  visible: boolean;
  onClose: () => void;
  editingMealId: string | null;
  manualMeal: { cal: string; pro: string; carbs: string; fat: string; desc: string };
  setManualMeal: React.Dispatch<React.SetStateAction<{ cal: string; pro: string; carbs: string; fat: string; desc: string }>>;
  handleManualSave: () => void;
  isSavingManual: boolean;
}

export default function ManualLogModal({ 
  visible, onClose, editingMealId, 
  manualMeal, setManualMeal, handleManualSave, isSavingManual 
}: ManualLogModalProps) {
  return (
    <SwipeableModal visible={visible} onClose={onClose} avoidKeyboard>
      <BlurView 
        intensity={80} 
        tint="dark" 
        style={{ maxHeight: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}
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

        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text className="text-white font-bold text-lg text-center tracking-tight mb-1">{editingMealId ? 'Edit Log' : 'Manual Log'}</Text>
          <Text className="text-white/30 text-xs text-center mb-6">{editingMealId ? 'Update your meal data.' : 'Add a meal without a photo.'}</Text>

          <View className="flex-row flex-wrap justify-between gap-y-3">
            <View className="w-full mb-1">
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>Total Calories *</Text>
              <View style={{ backgroundColor: 'rgba(122,215,198,0.06)', borderWidth: 0.5, borderColor: 'rgba(122,215,198,0.2)', borderRadius: 16, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}>
                <TextInput keyboardType="numeric" value={manualMeal.cal} onChangeText={(v) => setManualMeal(p => ({ ...p, cal: v }))} style={{ color: '#7ad7c6', fontWeight: '700', fontSize: 17 }} placeholder="e.g. 450" placeholderTextColor="rgba(122,215,198,0.3)" keyboardAppearance="dark" />
              </View>
            </View>
            <View className="w-[30%]">
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>Prot (g)</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}>
                <TextInput keyboardType="numeric" value={manualMeal.pro} onChangeText={(v) => setManualMeal(p => ({ ...p, pro: v }))} style={{ color: 'white', fontWeight: '600', fontSize: 16 }} placeholder="0" placeholderTextColor="rgba(255,255,255,0.15)" keyboardAppearance="dark" />
              </View>
            </View>
            <View className="w-[30%]">
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>Carbs (g)</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}>
                <TextInput keyboardType="numeric" value={manualMeal.carbs} onChangeText={(v) => setManualMeal(p => ({ ...p, carbs: v }))} style={{ color: 'white', fontWeight: '600', fontSize: 16 }} placeholder="0" placeholderTextColor="rgba(255,255,255,0.15)" keyboardAppearance="dark" />
              </View>
            </View>
            <View className="w-[30%]">
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>Fat (g)</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}>
                <TextInput keyboardType="numeric" value={manualMeal.fat} onChangeText={(v) => setManualMeal(p => ({ ...p, fat: v }))} style={{ color: 'white', fontWeight: '600', fontSize: 16 }} placeholder="0" placeholderTextColor="rgba(255,255,255,0.15)" keyboardAppearance="dark" />
              </View>
            </View>
            <View className="w-full mt-1">
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>Description / Name</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, minHeight: 48, paddingVertical: 12, paddingHorizontal: 14 }}>
                <TextInput value={manualMeal.desc} onChangeText={(v) => setManualMeal(p => ({ ...p, desc: v }))} multiline style={{ color: 'white', fontSize: 14 }} placeholder="e.g. Chicken salad with olive oil..." placeholderTextColor="rgba(255,255,255,0.15)" keyboardAppearance="dark" />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            onPress={handleManualSave} 
            disabled={isSavingManual || !manualMeal.cal}
            style={{ 
              marginTop: 28, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
              backgroundColor: (isSavingManual || !manualMeal.cal) ? 'rgba(255,255,255,0.04)' : '#7ad7c6',
              ...(!(isSavingManual || !manualMeal.cal) ? { shadowColor: '#7ad7c6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 } : {})
            }}
          >
            <Text style={{ color: (isSavingManual || !manualMeal.cal) ? 'rgba(255,255,255,0.2)' : '#090E17', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 }}>
              {isSavingManual ? 'Saving...' : (editingMealId ? 'Save Changes' : 'Add Meal')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </BlurView>
    </SwipeableModal>
  );
}
