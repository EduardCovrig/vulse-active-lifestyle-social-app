import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import SwipeableModal from './SwipeableModal';

interface ManualLogModalProps {
  visible: boolean;
  onClose: () => void;
  editingMealId: string | null;
  manualMeal: { cal: string; pro: string; carbs: string; fat: string; desc: string };
  setManualMeal: React.Dispatch<React.SetStateAction<{ cal: string; pro: string; carbs: string; fat: string; desc: string }>>;
  handleManualSave: () => void;
  isSavingManual: boolean;
}

export default function ManualLogModal({ visible, onClose, editingMealId, manualMeal, setManualMeal, handleManualSave, isSavingManual }: ManualLogModalProps) {
  return (
    <SwipeableModal visible={visible} onClose={onClose} title={editingMealId ? 'Edit Log' : 'Manual Log'} subtitle={editingMealId ? 'Update your meal data' : 'Add a meal without a photo'} heightRatio={0.8}>
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag" // Permite ascunderea tastaturii cand dai scroll
      >
        <View className="flex-row flex-wrap justify-between gap-y-3 mt-2">
          <View className="w-full mb-1">
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>Total Calories *</Text>
            <View style={{ backgroundColor: 'rgba(122,215,198,0.06)', borderWidth: 0.5, borderColor: 'rgba(122,215,198,0.2)', borderRadius: 16, height: 50, justifyContent: 'center', paddingHorizontal: 16 }}>
              <TextInput keyboardType="numeric" value={manualMeal.cal} onChangeText={(v) => setManualMeal(p => ({ ...p, cal: v }))} style={{ color: '#7ad7c6', fontWeight: '700', fontSize: 18 }} placeholder="e.g. 450" placeholderTextColor="rgba(122,215,198,0.3)" keyboardAppearance="dark" />
            </View>
          </View>
          
          {['pro', 'carbs', 'fat'].map((macro, idx) => (
            <View key={idx} className="w-[31%]">
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>{macro === 'pro' ? 'Prot' : macro} (g)</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, height: 48, justifyContent: 'center', paddingHorizontal: 14 }}>
                <TextInput keyboardType="numeric" value={(manualMeal as any)[macro]} onChangeText={(v) => setManualMeal(p => ({ ...p, [macro]: v }))} style={{ color: 'white', fontWeight: '600', fontSize: 16 }} placeholder="0" placeholderTextColor="rgba(255,255,255,0.15)" keyboardAppearance="dark" />
              </View>
            </View>
          ))}

          <View className="w-full mt-2">
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 }}>Description / Name</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, minHeight: 50, paddingVertical: 14, paddingHorizontal: 16 }}>
              <TextInput value={manualMeal.desc} onChangeText={(v) => setManualMeal(p => ({ ...p, desc: v }))} multiline style={{ color: 'white', fontSize: 15 }} placeholder="e.g. Chicken salad with olive oil..." placeholderTextColor="rgba(255,255,255,0.15)" keyboardAppearance="dark" />
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleManualSave} disabled={isSavingManual || !manualMeal.cal} style={{ marginTop: 32, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: (isSavingManual || !manualMeal.cal) ? 'rgba(255,255,255,0.04)' : '#7ad7c6' }}>
          <Text style={{ color: (isSavingManual || !manualMeal.cal) ? 'rgba(255,255,255,0.2)' : '#090E17', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 }}>{isSavingManual ? 'Saving...' : (editingMealId ? 'Save Changes' : 'Add Meal')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SwipeableModal>
  );
}