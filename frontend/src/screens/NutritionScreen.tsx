import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, ActivityIndicator, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNutritionLog } from '../hooks/useNutritionLog';
import NutritionHeader from '../components/NutritionHeader';
import NutritionGoalsCard from '../components/NutritionGoalsCard';
import NutritionDialModal from '../components/NutritionDialModal';
import BouncyPressable from '../components/BouncyPressable';
import ManualLogModal from '../components/ManualLogModal';
import ConcentricRings from '../components/ConcentricRings';
import FriendNutritionModal from '../components/FriendNutritionModal';
import NutritionCalendarModal from '../components/NutritionCalendarModal';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

export default function NutritionScreen() {
  const {
    insets,
    enterAnim,
    loading,
    meals,
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
  } = useNutritionLog();

  return (
    <Animated.View style={{ flex: 1, opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }], backgroundColor: '#090E17', paddingTop: insets.top }}>
      
      <NutritionHeader
        changeDate={changeDate}
        openCalendar={openCalendar}
        currentDate={currentDate}
        formatDateForApi={formatDateForApi}
      />

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
              <NutritionGoalsCard
                totalConsumed={totalConsumed}
                goals={goals}
                openDial={openDial}
              />

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
                    <Image source={{ uri: optimizedThumbUrl(item.originalPost.mediaUrl, 200) }} className="w-full h-full" />
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
      <NutritionDialModal
        macroDial={macroDial}
        setMacroDial={setMacroDial}
        insets={insets}
        panResponder={panResponder}
        uiParams={uiParams}
        dialValue={dialValue}
        saveMacroGoal={saveMacroGoal}
        isSavingDial={isSavingDial}
      />

    </Animated.View>
  );
}