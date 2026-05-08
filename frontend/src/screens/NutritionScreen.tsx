import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import BouncyPressable from '../components/BouncyPressable';

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [goals, setGoals] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualMeal, setManualMeal] = useState({ cal: '', pro: '', carb: '', fat: '' });

  const formatDateForApi = (date: Date) => date.toISOString().split('T')[0];

  const fetchNutritionData = async () => {
    setLoading(true);
    try {
      const [logRes, userRes] = await Promise.all([
        api.get(`/nutrition/log?date=${formatDateForApi(currentDate)}`),
        api.get('/users/me')
      ]);
      setMeals(logRes.data);
      setGoals({
        cal: userRes.data.dailyCaloriesGoal || 2000,
        pro: userRes.data.proteinGoal || 150,
        carb: userRes.data.carbsGoal || 250,
        fat: userRes.data.fatGoal || 70,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    fetchNutritionData();
  }, [currentDate]);

  const changeDate = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleAddManualMeal = async () => {
    if (!manualMeal.cal) {
      Alert.alert("Eroare", "Te rog introdu măcar numărul de calorii.");
      return;
    }
    setIsSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post('/nutrition/manual', {
        calories: parseInt(manualMeal.cal),
        protein: parseInt(manualMeal.pro || '0'),
        carbs: parseInt(manualMeal.carb || '0'),
        fat: parseInt(manualMeal.fat || '0')
      });
      setShowAddModal(false);
      setManualMeal({ cal: '', pro: '', carb: '', fat: '' });
      fetchNutritionData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Eroare", "Nu am putut salva masa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = (mealId: string) => {
    Alert.alert("Șterge Masa", "Sigur vrei să elimini această masă din jurnal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await api.delete(`/nutrition/${mealId}`);
            setMeals(curr => curr.filter(m => m.id !== mealId));
          } catch (e) { Alert.alert("Eroare", "Nu am putut șterge."); }
      }}
    ]);
  };

  const totalConsumed = meals.reduce((acc, meal) => ({
    cal: acc.cal + (meal.calories || 0),
    pro: acc.pro + (meal.proteinGrams || 0),
    carb: acc.carb + (meal.carbsGrams || 0),
    fat: acc.fat + (meal.fatGrams || 0),
  }), { cal: 0, pro: 0, carb: 0, fat: 0 });

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: '#090E17', paddingTop: insets.top }}>
      
      {/* HEADER: DATE SELECTOR */}
      <View className="flex-row items-center justify-between px-6 mb-6 mt-4">
        <TouchableOpacity onPress={() => changeDate(-1)} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Daily Log</Text>
          <Text className="text-white font-black text-xl">{currentDate.toDateString() === new Date().toDateString() ? 'Today' : formatDateForApi(currentDate)}</Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} disabled={currentDate.toDateString() === new Date().toDateString()} className={`w-10 h-10 rounded-full items-center justify-center border border-white/10 ${currentDate.toDateString() === new Date().toDateString() ? 'opacity-30 bg-transparent' : 'bg-white/5'}`}>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7ad7c6" className="mt-20" />
      ) : (
        <FlatList
          data={meals}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 150 }}
          ListHeaderComponent={
            <View className="mb-8">
              {/* MAIN CALORIE RING / BAR */}
              <View className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 items-center mb-6 shadow-2xl shadow-black/50">
                <Text className="text-white/40 text-xs font-bold uppercase tracking-[4px] mb-4">Calories</Text>
                <View className="flex-row items-end gap-2 mb-6">
                  <Text className="text-white font-black text-6xl tracking-tighter">{totalConsumed.cal}</Text>
                  <Text className="text-white/40 font-bold text-lg mb-2">/ {goals?.cal}</Text>
                </View>
                
                {/* PROGRESS BAR */}
                <View className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6">
                  <LinearGradient 
                    colors={['#7ad7c6', '#7dd3fc']} 
                    start={{x:0, y:0}} end={{x:1, y:1}} 
                    style={{ width: `${Math.min((totalConsumed.cal / (goals?.cal || 1)) * 100, 100)}%`, height: '100%' }} 
                  />
                </View>

                {/* MACROS SMALL BARS */}
                <View className="flex-row justify-between w-full">
                  <View className="items-center flex-1">
                    <Text className="text-white/40 text-[10px] uppercase font-bold mb-2 tracking-widest">Protein</Text>
                    <Text className="text-white font-bold mb-2">{totalConsumed.pro} / {goals?.pro}g</Text>
                    <View className="w-full max-w-[60px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <View className="h-full bg-purple-400" style={{ width: `${Math.min((totalConsumed.pro / (goals?.pro || 1)) * 100, 100)}%` }} />
                    </View>
                  </View>
                  <View className="items-center flex-1 border-x border-white/5">
                    <Text className="text-white/40 text-[10px] uppercase font-bold mb-2 tracking-widest">Carbs</Text>
                    <Text className="text-white font-bold mb-2">{totalConsumed.carb} / {goals?.carb}g</Text>
                    <View className="w-full max-w-[60px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <View className="h-full bg-blue-400" style={{ width: `${Math.min((totalConsumed.carb / (goals?.carb || 1)) * 100, 100)}%` }} />
                    </View>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-white/40 text-[10px] uppercase font-bold mb-2 tracking-widest">Fats</Text>
                    <Text className="text-white font-bold mb-2">{totalConsumed.fat} / {goals?.fat}g</Text>
                    <View className="w-full max-w-[60px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <View className="h-full bg-yellow-400" style={{ width: `${Math.min((totalConsumed.fat / (goals?.fat || 1)) * 100, 100)}%` }} />
                    </View>
                  </View>
                </View>
              </View>

              <View className="flex-row justify-between items-end mb-4">
                <Text className="text-white/50 text-[11px] font-black tracking-[4px] uppercase ml-2">Meals Log</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} className="bg-[#7ad7c6]/20 px-3 py-1 rounded-full border border-[#7ad7c6]/30 flex-row items-center gap-1">
                  <Ionicons name="add" size={14} color="#7ad7c6" />
                  <Text className="text-[#7ad7c6] text-[10px] font-bold uppercase tracking-widest">Manual</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-10 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
              <Ionicons name="fast-food-outline" size={40} color="#555" />
              <Text className="text-white/40 mt-4 text-center">Nicio masă salvată astăzi.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <BouncyPressable onLongPress={() => handleDeleteMeal(item.id)} className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-14 h-14 rounded-2xl bg-[#06090E] border border-white/10 items-center justify-center overflow-hidden">
                  {item.originalPost?.mediaUrl ? (
                    <Image source={{ uri: item.originalPost.mediaUrl }} className="w-full h-full" />
                  ) : (
                    <Ionicons name="create-outline" size={20} color="#7ad7c6" />
                  )}
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">{item.calories} <Text className="text-white/50 text-xs">kcal</Text></Text>
                  <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">
                    P: {item.proteinGrams}g • C: {item.carbsGrams}g • F: {item.fatGrams}g
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteMeal(item.id)} className="p-2">
                <Ionicons name="trash-outline" size={20} color="#ff4b4b" />
              </TouchableOpacity>
            </BouncyPressable>
          )}
        />
      )}

      {/* --- ADD MANUAL MEAL MODAL --- */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end">
          <TouchableOpacity className="flex-1 bg-black/60" onPress={() => setShowAddModal(false)} />
          <BlurView intensity={90} tint="dark" className="p-8 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
            <View className="absolute inset-0 bg-[#090E17]/80" />
            <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6" />
            <Text className="text-white font-black text-2xl mb-2 text-center tracking-tight">Manual Log</Text>
            <Text className="text-white/40 text-sm text-center mb-8">Add a meal without a photo.</Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              <View className="w-full mb-2">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Total Calories *</Text>
                <View className="bg-[#7ad7c6]/10 border border-[#7ad7c6]/30 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={manualMeal.cal} onChangeText={(v) => setManualMeal(p => ({ ...p, cal: v }))} className="text-[#7ad7c6] font-black text-xl" placeholder="e.g. 450" placeholderTextColor="#7ad7c650" keyboardAppearance="dark" autoFocus />
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
                  <TextInput keyboardType="numeric" value={manualMeal.carb} onChangeText={(v) => setManualMeal(p => ({ ...p, carb: v }))} className="text-white font-bold text-lg" placeholder="0" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
              <View className="w-[30%]">
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-2 ml-2">Fats (g)</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl h-14 justify-center px-4">
                  <TextInput keyboardType="numeric" value={manualMeal.fat} onChangeText={(v) => setManualMeal(p => ({ ...p, fat: v }))} className="text-white font-bold text-lg" placeholder="0" placeholderTextColor="#555" keyboardAppearance="dark" />
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={handleAddManualMeal} disabled={isSubmitting} className="mt-8 mb-4">
              <LinearGradient colors={['#7ad7c6', '#7dd3fc']} className="w-full h-14 rounded-2xl items-center justify-center flex-row shadow-[0_0_20px_rgba(122,215,198,0.3)]">
                {isSubmitting ? <ActivityIndicator color="#090E17" /> : <Text className="text-[#090E17] font-black text-lg tracking-wider">ADD MEAL</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

    </Animated.View>
  );
}