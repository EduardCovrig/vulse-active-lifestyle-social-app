import { useState, useEffect, useRef } from 'react';
import { Animated, PanResponder, Alert, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { handleError } from '../utils/errorHandler';

const { width, height } = Dimensions.get('window');

export function useNutritionLog() {
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
      handleError(error, 'Failed to fetch nutrition logs');
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
      setCalendarHistory(res.data);
    } catch (error) {
      handleError(error, 'Failed to fetch nutrition history');
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
    } catch (error) {
      handleError(error, 'Could not save meal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeal = (mealId: string) => {
    Alert.alert("Delete Meal", "Remove this meal from your log?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await api.delete(`/nutrition/${mealId}`);
            setMeals(curr => curr.filter(m => m.id !== mealId));
          } catch (e) {
            handleError(e, 'Could not delete meal');
          }
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
      setMacroDial(prev => ({ ...prev, visible: false }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      handleError(error, 'Could not save macro goal');
    } finally {
      setIsSavingDial(false);
    }
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

  return {
    insets,
    enterAnim,
    loading,
    meals,
    setMeals,
    goals,
    currentDate,
    editingMealId,
    showAddModal,
    setShowAddModal,
    isSubmitting,
    manualMeal,
    setManualMeal,
    macroDial,
    setMacroDial,
    dialValue,
    isSavingDial,
    friendsNutrition,
    selectedFriend,
    setSelectedFriend,
    showCalendarModal,
    setShowCalendarModal,
    calendarHistory,
    loadingHistory,
    changeDate,
    openCalendar,
    openEditModal,
    closeAddModal,
    handleAddManualMeal,
    handleDeleteMeal,
    openDial,
    saveMacroGoal,
    panResponder,
    uiParams,
    totalConsumed,
    formatDateForApi,
  };
}
