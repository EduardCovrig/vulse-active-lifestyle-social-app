import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NutritionHeaderProps {
  changeDate: (days: number) => void;
  openCalendar: () => void;
  currentDate: Date;
  formatDateForApi: (date: Date) => string;
}

export default function NutritionHeader({
  changeDate,
  openCalendar,
  currentDate,
  formatDateForApi,
}: NutritionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-6 mb-6 mt-4">
      <TouchableOpacity onPress={() => changeDate(-1)} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
        <Ionicons name="chevron-back" size={20} color="white" />
      </TouchableOpacity>
      <TouchableOpacity onPress={openCalendar} className="items-center" activeOpacity={0.7}>
        <Text className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1 flex-row items-center">
          <Ionicons name="calendar-outline" size={10} color="#7ad7c6" /> Daily Log
        </Text>
        <Text className="text-white font-black text-xl">{currentDate.toDateString() === new Date().toDateString() ? 'Today' : formatDateForApi(currentDate)}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => changeDate(1)} disabled={currentDate.toDateString() === new Date().toDateString()} className={`w-10 h-10 rounded-full items-center justify-center border border-white/10 ${currentDate.toDateString() === new Date().toDateString() ? 'opacity-30 bg-transparent' : 'bg-white/5'}`}>
        <Ionicons name="chevron-forward" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}
