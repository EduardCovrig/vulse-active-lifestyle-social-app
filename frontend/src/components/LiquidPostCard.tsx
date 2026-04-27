import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Pressable, Vibration } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons'; 

const { height } = Dimensions.get('window');

export default function LiquidPostCard({ post }: any) {
  // Starea care controlează dacă arătăm detaliile nutriționale sau nu
  const [showMacros, setShowMacros] = useState(false);

  // Funcție care se declanșează când ții apăsat
  const handleLongPress = () => {
    if (post.calories) { // Arătăm doar dacă e o postare cu mâncare (are calorii)
      Vibration.vibrate(50); // Mic feedback tactil (Haptic) ca să se simtă premium
      setShowMacros(true);
    }
  };

  return (
    <Pressable 
      onLongPress={handleLongPress}
      onPressOut={() => setShowMacros(false)}
      delayLongPress={300} // Cât timp trebuie să ții apăsat (300ms e perfect)
      style={{ height: height * 0.85 }} 
      className="w-full relative mb-4 rounded-[40px] overflow-hidden"
    >
      
      {/* 1. Poza principală */}
      <Image 
        source={{ uri: post.mediaUrl }} 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradienți standard */}
      <View className="absolute inset-0 bg-black/20" />
      <View className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
      <View className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />

      {/* --- ELEMENTELE NORMALE (Header, Footer, BeReal) --- */}
      {/* Le ascundem ușor dacă utilizatorul ține apăsat, ca să iasă în evidență meniul de calorii */}
      <View className={`transition-opacity duration-300 ${showMacros ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Header */}
        <View className="absolute top-6 inset-x-4">
          <BlurView intensity={40} tint="dark" className="rounded-full flex-row items-center justify-between p-2 border border-white/20">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center border border-white/30">
                 <Text className="text-white font-extrabold text-base">{post.author.username.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text className="text-white text-base font-black tracking-widest uppercase">{post.author.username}</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* BeReal Inset */}
        {post.frontMediaUrl && (
          <View className="absolute top-24 left-6 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
            <Image source={{ uri: post.frontMediaUrl }} className="w-full h-full object-cover" />
          </View>
        )}

        {/* Footer (Descriere + Acțiuni) */}
        <View className="absolute bottom-6 inset-x-4 flex-col gap-3">
          <View className="px-2 flex-row justify-between items-end">
            <Text className="text-white text-base font-medium shadow-black flex-1 mr-4">{post.caption}</Text>
            {post.calories && (
              <BlurView intensity={50} tint="dark" className="px-3 py-1.5 rounded-full border border-white/20">
                 <Text className="text-secondary font-black tracking-widest text-xs">{post.calories} KCAL</Text>
              </BlurView>
            )}
          </View>
          <BlurView intensity={50} tint="dark" className="rounded-full flex-row items-center justify-between px-6 py-3 border border-white/20">
             <TouchableOpacity className="flex-row items-center gap-2"><Ionicons name="flame" size={26} color="#7ad7c6" /><Text className="text-white font-bold text-lg">124</Text></TouchableOpacity>
             <TouchableOpacity className="flex-row items-center gap-2"><Ionicons name="chatbubble-ellipses" size={24} color="white" /><Text className="text-white font-bold text-lg">12</Text></TouchableOpacity>
             <TouchableOpacity><Ionicons name="paper-plane" size={24} color="white" /></TouchableOpacity>
          </BlurView>
        </View>
      </View>

      {/* --- 🌟 OVERLAY-UL "LIQUID MACRO" (Inspirat din HTML-ul tău) --- */}
      {/* Apare doar când ții apăsat (showMacros = true) */}
      {showMacros && post.calories && (
        <BlurView 
          intensity={80} 
          tint="dark" 
          className="absolute inset-0 z-50 justify-end p-4 pb-24"
        >
          {/* Cardul care se ridică */}
          <View className="bg-white/10 backdrop-blur-[24px] border border-white/20 rounded-[32px] p-6 shadow-2xl shadow-black relative overflow-hidden">
            
            {/* Glow effect in the background of the card */}
            <View className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-[30px]" />

            <Text className="text-white text-2xl font-black mb-1">{post.caption || "Healthy Meal"}</Text>
            <Text className="text-on-surface-variant text-sm font-bold tracking-widest uppercase mb-4">Analizat de Vulse AI ✨</Text>

            {/* Macro Chips (Ca în HTML) */}
            <View className="flex-row flex-wrap gap-3 mb-6">
              <View className="bg-secondary/20 border border-secondary/30 rounded-full px-4 py-2 flex-row items-center gap-2">
                <Ionicons name="flame" size={18} color="#7ad7c6" />
                <Text className="text-secondary font-black">{post.calories} KCAL</Text>
              </View>
              {/* Notă: Acestea 2 sunt mock-uri vizuale pentru design. Le putem face pe backend mai târziu */}
              <View className="bg-white/10 border border-white/10 rounded-full px-4 py-2">
                <Text className="text-white font-bold">45g Protein</Text>
              </View>
              <View className="bg-white/10 border border-white/10 rounded-full px-4 py-2">
                <Text className="text-white font-bold">50g Carbs</Text>
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity className="w-full bg-primary py-4 rounded-full flex-row items-center justify-center gap-2 shadow-[0_0_20px_rgba(197,234,255,0.3)]">
              <Ionicons name="bookmark" size={20} color="#0b1326" />
              <Text className="text-[#0b1326] font-black tracking-widest uppercase text-sm">Save to My Plan</Text>
            </TouchableOpacity>

          </View>
        </BlurView>
      )}

    </Pressable>
  );
}