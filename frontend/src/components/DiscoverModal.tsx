import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import SwipeableModal from './SwipeableModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DiscoverModalProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  loadingDiscover: boolean;
  suggestedFriends: any[];
  contacts: any[];
  handleFollowUser: (userId: string) => void;
  handleInviteContact: (contact: any) => void;
}

const normalizeText = (text: string) => text ? text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';

export default function DiscoverModal({ 
  visible, onClose, searchQuery, setSearchQuery, 
  loadingDiscover, suggestedFriends, contacts, 
  handleFollowUser, handleInviteContact 
}: DiscoverModalProps) {
  const navigation = useNavigation<any>();
  const normalizedSearch = normalizeText(searchQuery);

  return (
    <SwipeableModal visible={visible} onClose={onClose} avoidKeyboard>
      <BlurView 
        intensity={80} 
        tint="dark" 
        style={{ height: SCREEN_HEIGHT * 0.85, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}
      >
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,14,23,0.93)' }} />

        {/* X button */}
        <TouchableOpacity 
          onPress={onClose} 
          style={{ position: 'absolute', top: 4, right: 18, zIndex: 50, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={15} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 12 }}>
          <Text className="text-white font-bold text-lg text-center tracking-tight">Discover</Text>
          <Text className="text-white/30 text-xs text-center mt-1 mb-4">Find friends or invite your contacts</Text>

          <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 14, height: 40, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' }}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.3)" />
            <TextInput 
              placeholder="Search..." 
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, color: 'white', marginLeft: 8, fontSize: 14 }}
            />
          </View>
        </View>

        {loadingDiscover ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView 
            style={{ paddingHorizontal: 20 }} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ paddingBottom: 60 }} 
            keyboardShouldPersistTaps="handled"
          >
            {/* SUGGESTED FRIENDS */}
            {suggestedFriends.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text className="text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-3">Suggested for you</Text>
                {suggestedFriends.filter(f => normalizeText(f.username).includes(normalizedSearch)).map(friend => (
                  <TouchableOpacity 
                    key={friend.id} 
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      navigation.navigate('UserProfile', { username: friend.username });
                    }}
                    className="flex-row items-center justify-between py-3"
                    style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden border border-white/[0.06]">
                        {friend.profilePicUrl ? <Image source={{ uri: friend.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white/60 font-semibold text-sm">{friend.username.charAt(0).toUpperCase()}</Text>}
                      </View>
                      <View>
                        <Text className="text-white font-semibold text-[15px]">{friend.username}</Text>
                        {friend.mutuals > 0 && <Text className="text-white/30 text-[10px] mt-0.5">knows {friend.mutuals} friends</Text>}
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleFollowUser(friend.id)} 
                      style={{ backgroundColor: 'rgba(122,215,198,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(122,215,198,0.3)' }}
                    >
                      <Text style={{ color: '#7ad7c6', fontWeight: '600', fontSize: 11 }}>Add</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* PHONE CONTACTS */}
            {contacts.length > 0 && (
              <View>
                <Text className="text-white/40 text-[10px] font-semibold tracking-widest uppercase mb-3">From your contacts</Text>
                {contacts.filter(c => normalizeText(c.name).includes(normalizedSearch)).map((contact, i) => (
                  <View 
                    key={i} 
                    className="flex-row items-center justify-between py-3"
                    style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-white/[0.06] items-center justify-center overflow-hidden">
                        <Text className="text-white/60 font-semibold text-sm">{contact.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text className="text-white font-semibold text-[15px]">{contact.name}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleInviteContact(contact)} 
                      style={{ backgroundColor: 'rgba(125,211,252,0.12)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(125,211,252,0.25)' }}
                    >
                      <Text style={{ color: '#7dd3fc', fontWeight: '600', fontSize: 11 }}>Invite</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </BlurView>
    </SwipeableModal>
  );
}
