import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface NutritionGoalsCardProps {
  totalConsumed: { cal: number; pro: number; carb: number; fat: number };
  goals: { cal: number; pro: number; carb: number; fat: number };
  openDial: (type: 'cal'|'pro'|'carb'|'fat', label: string, color: string, currentVal: number) => void;
}

export default function NutritionGoalsCard({
  totalConsumed,
  goals,
  openDial,
}: NutritionGoalsCardProps) {
  return (
    <View className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 items-center mb-6 shadow-2xl shadow-black/50">
      <Text className="text-white/40 text-xs font-bold uppercase tracking-[4px] mb-4">Calories</Text>
      
      <TouchableOpacity activeOpacity={0.7} onPress={() => openDial('cal', 'CALORIES', '#7dd3fc', goals.cal)} className="flex-row items-end gap-2 mb-6">
        <Text className="text-white font-black text-6xl tracking-tighter">{totalConsumed.cal}</Text>
        <Text className="text-[#7dd3fc] font-bold text-lg mb-2">/ {goals?.cal}</Text>
      </TouchableOpacity>
      
      <View className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
        <LinearGradient colors={['#7ad7c6', '#7dd3fc']} start={{x:0, y:0}} end={{x:1, y:1}} style={{ width: `${Math.min((totalConsumed.cal / (goals?.cal || 1)) * 100, 100)}%`, height: '100%' }} />
      </View>

      <View className="flex-row justify-between w-full">
        <TouchableOpacity activeOpacity={0.7} onPress={() => openDial('pro', 'PROTEIN', '#c084fc', goals.pro)} className="items-center flex-1">
          <Text className="text-white/40 text-[10px] uppercase font-bold mb-2 tracking-widest">Proteins (g)</Text>
          <Text className="text-white font-bold mb-2">{totalConsumed.pro} / <Text className="text-[#c084fc]">{goals?.pro}</Text></Text>
          <View className="w-full max-w-[60px] h-1.5 bg-white/10 rounded-full overflow-hidden">
            <View className="h-full bg-purple-400" style={{ width: `${Math.min((totalConsumed.pro / (goals?.pro || 1)) * 100, 100)}%` }} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7} onPress={() => openDial('carb', 'CARBS', '#3b82f6', goals.carb)} className="items-center flex-1 border-x border-white/5">
          <Text className="text-white/40 text-[10px] uppercase font-bold mb-2 tracking-widest">Carbs (g)</Text>
          <Text className="text-white font-bold mb-2">{totalConsumed.carb} / <Text className="text-[#3b82f6]">{goals?.carb}</Text></Text>
          <View className="w-full max-w-[60px] h-1.5 bg-white/10 rounded-full overflow-hidden">
            <View className="h-full bg-blue-500" style={{ width: `${Math.min((totalConsumed.carb / (goals?.carb || 1)) * 100, 100)}%` }} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7} onPress={() => openDial('fat', 'FATS', '#facc15', goals.fat)} className="items-center flex-1">
          <Text className="text-white/40 text-[10px] uppercase font-bold mb-2 tracking-widest">Fats (g)</Text>
          <Text className="text-white font-bold mb-2">{totalConsumed.fat} / <Text className="text-[#facc15]">{goals?.fat}</Text></Text>
          <View className="w-full max-w-[60px] h-1.5 bg-white/10 rounded-full overflow-hidden">
            <View className="h-full bg-yellow-400" style={{ width: `${Math.min((totalConsumed.fat / (goals?.fat || 1)) * 100, 100)}%` }} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
