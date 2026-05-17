import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, ActivityIndicator, Modal, Dimensions, ScrollView, Image, PanResponder, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import BouncyPressable from '../components/BouncyPressable';
import ManualLogModal from '../components/ManualLogModal';
import ConcentricRings from '../components/ConcentricRings';
import FriendNutritionModal from '../components/FriendNutritionModal';
import NutritionCalendarModal from '../components/NutritionCalendarModal';

const { width, height } = Dimensions.get('window');

export default function NutritionScreen() {
  const insets = useSafeAreaInsets();
  const enterAnim = useRef(new Animated.Value(0)).current;
  
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [goals, setGoals] = useState<any>({ cal: 2000, pro: 150, carb: 250, fat: 70 });
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualMeal, setManualMeal] = useState({ cal: '', pro: '', carbs: '', fat: '', desc: '' });

  const [macroDial, setMacroDial] = useState<{ visible: boolean, type: 'cal'|'pro'|'carb'|'fat', label: string, baseColor: string }>({ visible: false, type: 'cal', label: '', baseColor: '#7dd3fc' });
  const [dialValue, setDialValue] = useState(0);
  const [isSavingDial, setIsSavingDial] = useState(false);

  // Reale de la Backend
  const [friendsNutrition, setFriendsNutrition] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarHistory, setCalendarHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const dialValueRef = useRef(0);
  const dialTypeRef = useRef<'cal'|'pro'|'carb'|'fat'>('cal');
  const startValueRef = useRef(0);
  const lastAngleRef = useRef(0);
  const accumulatedAngleRef = useRef(0);

  const formatDateForApi = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const d = new Date(date.getTime() - (offset * 60 * 1000));
    return d.toISOString().split('T')[0];
  };

  const fetchNutritionData = async () => {
    setLoading(true);
    try {
      const dateStr = formatDateForApi(currentDate);
      const [logRes, userRes, friendsRes] = await Promise.all([
        api.get(`/nutrition/log?date=${dateStr}`),
        api.get('/users/me'),
        api.get(`/nutrition/friends/log?date=${dateStr}`)
      ]);
      setMeals(logRes.data);
      setGoals({
        cal: userRes.data.dailyCaloriesGoal || 2000,
        pro: userRes.data.proteinGoal || 150,
        carb: userRes.data.carbsGoal || 250,
        fat: userRes.data.fatGoal || 70,
      });
      setFriendsNutrition(friendsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.spring(enterAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    fetchNutritionData();
  }, [currentDate]);

  const changeDate = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const openCalendar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCalendarModal(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/nutrition/history?days=30`);
      // res.data is list of Map with date, cal, pro, carbs, fat, calGoal, etc.
      // concentric rings expects friend object with these fields, which matches the map
      setCalendarHistory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openEditModal = (meal: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingMealId(meal.id);
    setManualMeal({ cal: meal.calories?.toString() || '', pro: meal.proteinGrams?.toString() || '', carbs: meal.carbsGrams?.toString() || '', fat: meal.fatGrams?.toString() || '', desc: meal.name || '' });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingMealId(null);
    setManualMeal({ cal: '', pro: '', carbs: '', fat: '', desc: '' });
  };

  const handleAddManualMeal = async () => {
    if (!manualMeal.cal) { Alert.alert("Error", "Please enter calories."); return; }
    setIsSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const payload = {
        calories: parseInt(manualMeal.cal) || 0, protein: parseInt(manualMeal.pro) || 0, carbs: parseInt(manualMeal.carbs) || 0, fat: parseInt(manualMeal.fat) || 0,
        name: manualMeal.desc || 'Manual Log', date: formatDateForApi(currentDate) 
      };

      if (editingMealId) await api.put(`/nutrition/manual/${editingMealId}`, payload);
      else await api.post('/nutrition/manual', payload);

      closeAddModal();
      fetchNutritionData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) { Alert.alert("Error", "Could not save meal."); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteMeal = (mealId: string) => {
    Alert.alert("Delete Meal", "Remove this meal from your log?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await api.delete(`/nutrition/${mealId}`);
            setMeals(curr => curr.filter(m => m.id !== mealId));
          } catch (e) { Alert.alert("Error", "Could not delete."); }
      }}
    ]);
  };

  const openDial = (type: 'cal'|'pro'|'carb'|'fat', label: string, color: string, currentVal: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const val = currentVal || 0;
    setDialValue(val);
    dialValueRef.current = val;
    dialTypeRef.current = type;
    setMacroDial({ visible: true, type, label, baseColor: color });
  };

  const saveMacroGoal = async () => {
    setIsSavingDial(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const paramMap: any = { cal: 'dailyCaloriesGoal', pro: 'proteinGoal', carb: 'carbsGoal', fat: 'fatGoal' };
      await api.put(`/users/me?${paramMap[macroDial.type]}=${dialValueRef.current}`);
      setGoals((prev: any) => ({ ...prev, [macroDial.type]: dialValueRef.current }));
      setMacroDial({ ...macroDial, visible: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) { Alert.alert("Error", "Could not save goal."); } 
    finally { setIsSavingDial(false); }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        const cx = width / 2, cy = height / 2;
        lastAngleRef.current = Math.atan2(gestureState.y0 - cy, gestureState.x0 - cx) * (180 / Math.PI);
        startValueRef.current = dialValueRef.current;
        accumulatedAngleRef.current = 0; 
      },
      onPanResponderMove: (e, gestureState) => {
        const cx = width / 2, cy = height / 2;
        const currentAngle = Math.atan2(gestureState.moveY - cy, gestureState.moveX - cx) * (180 / Math.PI);
        let delta = currentAngle - lastAngleRef.current;

        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;

        lastAngleRef.current = currentAngle;
        accumulatedAngleRef.current += delta;

        const stepSize = dialTypeRef.current === 'cal' ? 100 : 5; 
        const stepsMoved = Math.floor(accumulatedAngleRef.current / 18);
        let newVal = startValueRef.current + (stepsMoved * stepSize);
        if (newVal < 0) newVal = 0;

        if (newVal !== dialValueRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setDialValue(newVal);
          dialValueRef.current = newVal;
        }
      }
    })
  ).current;

  const getDialUIParams = () => {
    const isCal = macroDial.type === 'cal';
    const maxPerLap = isCal ? 2000 : 100;
    const laps = Math.floor(dialValue / (maxPerLap || 1));
    const progressInLap = dialValue % maxPerLap;
    const rotationDegrees = (progressInLap / maxPerLap) * 360;

    let currentColor = macroDial.baseColor;
    if (laps === 1) currentColor = '#fde047'; 
    if (laps === 2) currentColor = '#ff8a00'; 
    if (laps >= 3) currentColor = '#ff4b4b'; 

    return { currentColor, rotationDegrees, laps };
  };

  const totalConsumed = meals.reduce((acc, meal) => ({
    cal: acc.cal + (meal.calories || 0),
    pro: acc.pro + (meal.proteinGrams || 0),
    carb: acc.carb + (meal.carbsGrams || 0),
    fat: acc.fat + (meal.fatGrams || 0),
  }), { cal: 0, pro: 0, carb: 0, fat: 0 });

  const uiParams = macroDial.visible ? getDialUIParams() : { currentColor: '#fff', rotationDegrees: 0, laps: 0 };

  return (
    <Animated.View style={{ flex: 1, opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }], backgroundColor: '#090E17', paddingTop: insets.top }}>
      
      {/* HEADER */}
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
              {/* MAIN NUTRITION RINGS/BARS */}
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
              <Ionicons name="restaurant-outline" size={40} color="#555" />
              <Text className="text-white/40 mt-4 text-center">No meals saved today.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <BouncyPressable onLongPress={() => handleDeleteMeal(item.id)} className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="w-14 h-14 rounded-2xl bg-[#06090E] border border-white/10 items-center justify-center overflow-hidden">
                  {item.originalPost?.mediaUrl ? (
                    <Image source={{ uri: item.originalPost.mediaUrl }} className="w-full h-full" />
                  ) : (
                    <Ionicons name="restaurant" size={24} color="#7ad7c6" />
                  )}
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">{item.calories} <Text className="text-white/50 text-xs">kcal</Text></Text>
                  <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest mt-1">
                    P: {item.proteinGrams}g • C: {item.carbsGrams}g • F: {item.fatGrams}g
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <TouchableOpacity onPress={() => openEditModal(item)} className="p-2">
                  <Ionicons name="pencil-outline" size={20} color="#7dd3fc" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteMeal(item.id)} className="p-2">
                  <Ionicons name="trash-outline" size={20} color="#ff4b4b" />
                </TouchableOpacity>
              </View>
            </BouncyPressable>
          )}
          ListFooterComponent={
            <View className="mt-8 border-t border-white/10 pt-6">
              <Text className="text-white/50 text-[11px] font-black tracking-[4px] uppercase ml-2 mb-6">Friends Activity</Text>
              {friendsNutrition.length === 0 ? (
                <Text className="text-white/30 text-center text-xs">Your friends haven't logged any meals today.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, gap: 16 }}>
                  {friendsNutrition.map((friend) => (
                    <BouncyPressable 
                      key={friend.id} 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedFriend(friend);
                      }}
                      className="items-center"
                    >
                      <ConcentricRings friend={friend} />
                      <Text className="text-white/70 text-[10px] font-semibold mt-2">{friend.username}</Text>
                    </BouncyPressable>
                  ))}
                </ScrollView>
              )}
            </View>
          }
        />
      )}

      {/* COMPONENTE MODALE DECUPLATE */}
      <ManualLogModal 
        visible={showAddModal} onClose={closeAddModal} editingMealId={editingMealId}
        manualMeal={manualMeal} setManualMeal={setManualMeal} handleManualSave={handleAddManualMeal} isSavingManual={isSubmitting}
      />

      <FriendNutritionModal 
        visible={selectedFriend !== null} onClose={() => setSelectedFriend(null)} friend={selectedFriend}
      />

      <NutritionCalendarModal 
        visible={showCalendarModal} 
        onClose={() => setShowCalendarModal(false)} 
        loading={loadingHistory} 
        history={calendarHistory} 
      />

      {/* DIAL MODAL */}
      <Modal visible={macroDial.visible} animationType="fade" transparent={true}>
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
      </Modal>

    </Animated.View>
  );
}