import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal, { ModalScrollContext } from './SwipeableModal';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

interface NotificationListModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationListModal({ visible, onClose }: NotificationListModalProps) {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications');
      const fetchedNotifs = response.data;
      
      // Update UI optimistically to read
      setNotifications(fetchedNotifs.map((n: any) => ({ ...n, isRead: true })));

      // Mark all unread notifications as read in the background
      const unreadNotifs = fetchedNotifs.filter((n: any) => !n.isRead);
      unreadNotifs.forEach((n: any) => {
         api.patch(`/notifications/${n.id}/read`).catch(() => {});
      });

    } catch (error) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = async (notif: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    if (notif.sender?.username) {
      navigation.navigate('UserProfile', { username: notif.sender.username });
    }
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'FOLLOW': return <Ionicons name="person-add" size={14} color="#7dd3fc" />;
      case 'LIKE': return <Ionicons name="heart" size={14} color="#ff4b4b" />;
      case 'COMMENT': return <Ionicons name="chatbubble" size={14} color="#7ad7c6" />;
      default: return <Ionicons name="notifications" size={14} color="white" />;
    }
  };

  const getNotifText = (type: string) => {
    switch(type) {
      case 'FOLLOW': return "started following you.";
      case 'LIKE': return "liked your post.";
      case 'COMMENT': return "commented on your post.";
      default: return "interacted with you.";
    }
  };

  return (
    <SwipeableModal visible={visible} onClose={onClose} title="Notifications" heightRatio={0.75}>
      <ModalScrollContext.Consumer>
        {(scrollContext) => loading ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View className="items-center mt-10">
            <Ionicons name="notifications-off-outline" size={32} color="rgba(255,255,255,0.06)" />
            <Text className="text-white/20 mt-3 text-[10px] font-semibold tracking-wider uppercase">All caught up</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            onScroll={scrollContext?.onScroll}
            scrollEventThrottle={scrollContext?.scrollEventThrottle}
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16, paddingTop: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => handleNotificationPress(item)} 
                className="flex-row items-center py-4 border-b border-white/[0.04]"
              >
                <View className="relative mr-3">
                  <View className="w-12 h-12 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.06]">
                    {item.sender?.profilePicUrl ? (
                      <Image source={{ uri: optimizedThumbUrl(item.sender.profilePicUrl, 100) }} className="w-full h-full" />
                    ) : (
                      <Text className="text-white/60 font-semibold text-sm">{item.sender?.username?.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>
                  <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#090E17] items-center justify-center">
                     {getNotifIcon(item.type)}
                  </View>
                </View>
                
                <View className="flex-1">
                  <Text className="text-white/80 text-[13px] leading-5">
                    <Text className="font-bold text-white">{item.sender?.username}</Text> {getNotifText(item.type)}
                  </Text>
                </View>

                {item.postMediaUrl && (
                   <View className="w-10 h-10 rounded-md overflow-hidden bg-white/10 ml-3">
                      <Image source={{ uri: optimizedThumbUrl(item.postMediaUrl, 100) }} className="w-full h-full" />
                   </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </ModalScrollContext.Consumer>
    </SwipeableModal>
  );
}