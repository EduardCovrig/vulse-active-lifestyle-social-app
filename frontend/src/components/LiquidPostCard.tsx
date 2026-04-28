import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, Pressable, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons'; 
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface LiquidPostCardProps {
  post: any;
  cardHeight: number;
}

const getRelativeTime = (dateString?: string) => {
  if (!dateString) return 'Just now';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function LiquidPostCard({ post, cardHeight }: LiquidPostCardProps) {
  const [showMacros, setShowMacros] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(124);
  const [isTakingSelfie, setIsTakingSelfie] = useState(false);
  const [floatingReacts, setFloatingReacts] = useState<any[]>([]);

  const cardScale = useRef(new Animated.Value(1)).current;
  const tooltipScale = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const bigHeartScale = useRef(new Animated.Value(0)).current;

  const avatarAnim1 = useRef(new Animated.Value(0)).current;
  const avatarAnim2 = useRef(new Animated.Value(0)).current;
  const avatarAnim3 = useRef(new Animated.Value(0)).current;

  const lastTapRef = useRef(0);
  
  // NOU: Track-uim daca meniul este blocat deschis (pentru Apple 3D Hover style)
  const isMenuLocked = useRef(false);

  useEffect(() => {
    const createBobbingAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: duration, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: -1, duration: duration * 2, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: duration, useNativeDriver: true })
        ])
      );
    };

    createBobbingAnimation(avatarAnim1, 1500).start();
    createBobbingAnimation(avatarAnim2, 2100).start();
    createBobbingAnimation(avatarAnim3, 1800).start();
  }, []);

  const handlePressIn = (e: any) => {
    // Daca meniul e deja deschis, ignoram squish-ul ca sa nu facem glitch-uri
    if (isMenuLocked.current) return;

    setTouchPos({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
    Animated.spring(cardScale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 10 }).start();
  };

  const spawnFloatingReaction = (imageUrl: string) => {
    const id = Date.now().toString() + Math.random();
    const animY = new Animated.Value(0);
    const animOpacity = new Animated.Value(1);
    const animScale = new Animated.Value(0.5);

    const randomX = Math.random() * 80 - 40; 

    setFloatingReacts(prev => [...prev, { id, animY, animOpacity, animScale, randomX, image: imageUrl }]);

    Animated.parallel([
      Animated.spring(animScale, { toValue: 1, useNativeDriver: true, bounciness: 15 }),
      Animated.timing(animY, { toValue: -400, duration: 4500, useNativeDriver: true }),
      Animated.timing(animOpacity, { toValue: 0, duration: 2000, delay: 2500, useNativeDriver: true })
    ]).start(() => {
      setFloatingReacts(prev => prev.filter(r => r.id !== id));
    });
  };

  const handleSelfieCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTakingSelfie(false);
    const mySelfieMock = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80';
    spawnFloatingReaction(mySelfieMock);
  };

  const handlePress = () => {
    if (isMenuLocked.current) return; // Dezactivam double tap cand e meniul deschis

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (!isLiked) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }

      Animated.sequence([
        Animated.spring(bigHeartScale, { toValue: 1.2, useNativeDriver: true, bounciness: 20 }),
        Animated.delay(500),
        Animated.spring(bigHeartScale, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 0 })
      ]).start();
    }
    lastTapRef.current = now;
  };

  const handleLongPress = () => {
    if (!post.calories || isMenuLocked.current) return; 
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    isMenuLocked.current = true; // Blocam meniul sa nu se inchida cand ridici degetul
    setShowMacros(true);

    Animated.spring(cardScale, { toValue: 0.92, useNativeDriver: true, speed: 30, bounciness: 12 }).start();
    Animated.spring(tooltipScale, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 15 }).start();
    Animated.timing(tooltipOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    // Daca meniul e blocat, IGNORAM PressOut. Userul poate lua degetul de pe ecran linistit.
    if (isMenuLocked.current) return;

    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 15 }).start();
  };

  // Functia care inchide meniul cand apesi pe fundal sau pe "Save"
  const closeMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isMenuLocked.current = false;

    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 15 }),
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.spring(tooltipScale, { toValue: 0, useNativeDriver: true, speed: 30 })
    ]).start(() => setShowMacros(false));
  };

  const bob1 = avatarAnim1.interpolate({ inputRange: [-1, 1], outputRange: [-2, 2] });
  const bob2 = avatarAnim2.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] });
  const bob3 = avatarAnim3.interpolate({ inputRange: [-1, 1], outputRange: [-1.5, 1.5] });

  return (
    <View style={{ height: cardHeight }} className="w-full relative mb-4">
      <Animated.View style={{ transform: [{ scale: cardScale }] }} className="flex-1 rounded-[40px] overflow-hidden shadow-2xl shadow-black bg-black relative">
        <Pressable 
          onPressIn={handlePressIn}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={200}
          style={{ flex: 1, position: 'relative' }}
        >
          <Image source={{ uri: post.mediaUrl }} className="absolute inset-0 w-full h-full object-cover" />
          
          <View className="absolute inset-0 bg-black/10" />
          <View className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <View className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          {/* INIMA FROSTED GLASS */}
          <Animated.View 
            pointerEvents="none" 
            style={{ 
              position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 20,
              transform: [{ scale: bigHeartScale }] 
            }}
          >
            <View className="w-32 h-32 rounded-full items-center justify-center bg-black/60 border border-white/20 shadow-2xl shadow-black">
               <Ionicons name="heart" size={70} color="#ff4b4b" />
            </View>
          </Animated.View>

          {/* HEADER */}
          <View className="absolute top-6 left-4 z-10 pointer-events-none">
            <View className="rounded-full overflow-hidden border border-white/20">
              <BlurView intensity={50} tint="dark" className="flex-row items-center p-1.5 pr-5">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center border border-white/30 mr-3 overflow-hidden">
                   <Text className="text-white font-extrabold text-base">{post.author.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text className="text-white text-sm font-black tracking-widest uppercase">{post.author.username}</Text>
                  <Text className="text-white/70 text-[10px] font-bold uppercase mt-0.5">{getRelativeTime(post.createdAt)}</Text>
                </View>
              </BlurView>
            </View>
          </View>

          {/* BEREAL FRONT CAMERA */}
          {post.frontMediaUrl && (
            <View className="absolute top-24 left-6 w-28 h-36 rounded-[24px] overflow-hidden border-[3px] border-white/40 shadow-2xl z-10">
              <Image source={{ uri: post.frontMediaUrl }} className="w-full h-full object-cover" />
            </View>
          )}

          {/* REACTII PLUTITOARE */}
          {floatingReacts.map((react) => (
            <Animated.View
              key={react.id}
              pointerEvents="none"
              style={{
                position: 'absolute', bottom: 80, right: 20, zIndex: 40,
                opacity: react.animOpacity,
                transform: [
                  { translateY: react.animY }, 
                  { translateX: react.randomX },
                  { scale: react.animScale }
                ]
              }}
            >
              <View className="w-16 h-16 rounded-full border-[3px] border-white overflow-hidden shadow-lg shadow-black">
                <Image source={{ uri: react.image }} className="w-full h-full object-cover" />
              </View>
            </Animated.View>
          ))}

          {/* FOOTER */}
          <View className="absolute bottom-6 inset-x-5 flex-row justify-between items-end pointer-events-none z-10">
            <TouchableOpacity className="pointer-events-auto flex-row items-center active:scale-95 transition-transform">
              <View className="flex-row">
                <Animated.View style={{ transform: [{ translateY: bob1 }, { translateX: bob2 }] }} className="z-30">
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' }} className="w-11 h-11 rounded-full border-2 border-[#171f33]" />
                </Animated.View>
                <Animated.View style={{ transform: [{ translateY: bob2 }] }} className="-ml-4 z-20">
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80' }} className="w-11 h-11 rounded-full border-2 border-[#171f33]" />
                </Animated.View>
                <Animated.View style={{ transform: [{ translateY: bob3 }, { translateX: bob1 }] }} className="-ml-4 z-10">
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' }} className="w-11 h-11 rounded-full border-2 border-[#171f33]" />
                </Animated.View>
              </View>
              
              <View className="rounded-full overflow-hidden ml-3 border border-white/20">
                <BlurView intensity={40} tint="dark" className="px-3 py-1.5 items-center justify-center">
                  <Text className="text-white font-bold text-xs">{likesCount} Reactii</Text>
                </BlurView>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              className="pointer-events-auto active:scale-90 transition-transform"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsTakingSelfie(true);
              }}
            >
              <View className="rounded-full overflow-hidden border border-white/30 shadow-lg shadow-black">
                <BlurView intensity={60} tint="dark" className="w-14 h-14 items-center justify-center">
                  <Ionicons name="camera" size={26} color="white" />
                </BlurView>
              </View>
            </TouchableOpacity>
          </View>

          {/* OVERLAY INVIZIBIL PENTRU INCHIDEREA MENIULUI (Cand apesi afara lui) */}
          {showMacros && (
            <Pressable 
              className="absolute inset-0 z-50" 
              onPress={closeMenu} 
            />
          )}

          {/* SMART TOOLTIP HAPTIC TOUCH (Acum este Frosted Glass perfect, interactiv) */}
          {showMacros && post.calories && (
            <Animated.View 
              style={{ 
                position: 'absolute',
                left: Math.min(Math.max(touchPos.x - 110, 16), width - 240), 
                top: Math.max(touchPos.y - 120, 16), 
                opacity: tooltipOpacity,
                transform: [{ scale: tooltipScale }],
                zIndex: 60,
                width: 220
              }}
              pointerEvents="auto" // ATENTIE: Modificat la auto ca sa poti apasa pe buton
            >
              <View className="rounded-[32px] overflow-hidden border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] bg-black/80 p-4">
                <Text className="text-white/60 text-[10px] font-black tracking-widest uppercase mb-3">Vulse AI Analysis ✨</Text>
                
                <View className="flex-row flex-wrap gap-2 mb-4">
                  <View className="bg-secondary/20 border border-secondary/30 rounded-full px-2.5 py-1.5 flex-row items-center gap-1">
                    <Ionicons name="flame" size={12} color="#7ad7c6" />
                    <Text className="text-secondary font-black text-xs">{post.calories}</Text>
                  </View>
                  <View className="bg-white/10 border border-white/10 rounded-full px-2.5 py-1.5">
                    <Text className="text-white font-bold text-xs">45g Pro</Text>
                  </View>
                  <View className="bg-white/10 border border-white/10 rounded-full px-2.5 py-1.5">
                    <Text className="text-white font-bold text-xs">50g Carb</Text>
                  </View>
                  <View className="bg-white/10 border border-white/10 rounded-full px-2.5 py-1.5">
                    <Text className="text-white font-bold text-xs">15g Fat</Text>
                  </View>
                </View>

                {/* BUTON FUNCTIONAL SAVE */}
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => {
                    // Aici in viitor pui logica de adaugare la mesele zilei in backend
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    closeMenu();
                  }}
                  className="w-full bg-primary py-3 rounded-full flex-row items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(197,234,255,0.3)]"
                >
                  <Ionicons name="bookmark" size={14} color="#0b1326" />
                  <Text className="text-[#0b1326] font-black tracking-widest uppercase text-[10px]">Save to Your Meals</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* OVERLAY CAMERA SELFIE */}
          {isTakingSelfie && (
            <View className="absolute inset-0 z-50 rounded-[40px] overflow-hidden bg-black/60 items-center justify-center pointer-events-auto">
              <BlurView intensity={90} tint="dark" className="absolute inset-0" />
              <Text className="text-white font-black text-xl mb-8 tracking-widest">TRIMITE REACTIE</Text>
              <View className="w-64 h-64 rounded-full overflow-hidden border-4 border-primary/50 shadow-[0_0_40px_rgba(197,234,255,0.3)] mb-10 bg-surface items-center justify-center">
                <Ionicons name="person" size={80} color="white" opacity={0.5} />
              </View>
              <TouchableOpacity onPress={handleSelfieCapture} className="w-20 h-20 rounded-full border-4 border-white items-center justify-center p-1">
                <View className="w-full h-full bg-white rounded-full" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsTakingSelfie(false)} className="absolute top-8 right-6 w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}