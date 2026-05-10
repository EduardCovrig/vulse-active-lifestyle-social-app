import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

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

import SwipeableModal from './SwipeableModal';

export default function DiscoverModal({ 
  visible, onClose, searchQuery, setSearchQuery, 
  loadingDiscover, suggestedFriends, contacts, 
  handleFollowUser, handleInviteContact 
}: DiscoverModalProps) {
  const navigation = useNavigation<any>();

  const normalizedSearch = normalizeText(searchQuery);

  return (
    <SwipeableModal visible={visible} onClose={onClose} avoidKeyboard>
        <BlurView intensity={90} tint="dark" className="h-[85%] rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] overflow-hidden pt-12">
          <View className="absolute inset-0 bg-[#090E17]/90" />

          <TouchableOpacity onPress={onClose} className="absolute top-4 right-6 z-50 w-8 h-8 bg-white/10 rounded-full items-center justify-center border border-white/20">
            <Ionicons name="close" size={18} color="white" />
          </TouchableOpacity>

          <View className="px-6 pb-2">
             <Text className="text-white font-black text-2xl text-center tracking-tight mt-2">Discover</Text>
             <Text className="text-white/40 text-sm text-center mb-6 mt-1">Find friends or invite your contacts</Text>

             <View className="bg-white/10 rounded-full px-4 h-11 flex-row items-center border border-white/10 mb-6">
               <Ionicons name="search" size={18} color="#aaa" />
               <TextInput 
                 placeholder="Search..." 
                 placeholderTextColor="#888"
                 value={searchQuery}
                 onChangeText={setSearchQuery}
                 className="flex-1 text-white ml-2 font-bold"
               />
             </View>
          </View>

          {loadingDiscover ? (
             <ActivityIndicator color="#7dd3fc" className="mt-10" />
          ) : (
             <ScrollView className="px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
                
                {/* SUGGESTED FRIENDS */}
                {suggestedFriends.length > 0 && (
                   <View className="mb-8">
                      <Text className="text-white font-bold text-lg mb-4">Suggested for you</Text>
                      {suggestedFriends.filter(f => normalizeText(f.username).includes(normalizedSearch)).map(friend => (
                         <TouchableOpacity 
                            key={friend.id} 
                            activeOpacity={0.8}
                            onPress={() => {
                              onClose();
                              navigation.navigate('UserProfile', { username: friend.username });
                            }}
                            className="flex-row items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl mb-3"
                         >
                            <View className="flex-row items-center gap-3">
                               <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                                 {friend.profilePicUrl ? <Image source={{ uri: friend.profilePicUrl }} className="w-full h-full" /> : <Text className="text-white font-bold">{friend.username.charAt(0).toUpperCase()}</Text>}
                               </View>
                               <View>
                                  <Text className="text-white font-bold tracking-wider">{friend.username}</Text>
                                  {friend.mutuals > 0 && <Text className="text-white/40 text-xs mt-0.5">knows {friend.mutuals} friends</Text>}
                               </View>
                            </View>
                            <TouchableOpacity onPress={() => handleFollowUser(friend.id)} className="bg-blue-600 px-5 py-2 rounded-full">
                               <Text className="text-white font-bold text-xs">Add</Text>
                            </TouchableOpacity>
                         </TouchableOpacity>
                      ))}
                   </View>
                )}

                {/* PHONE CONTACTS */}
                {contacts.length > 0 && (
                   <View>
                      <Text className="text-white font-bold text-lg mb-4">From your contacts</Text>
                      {contacts.filter(c => normalizeText(c.name).includes(normalizedSearch)).map((contact, i) => (
                         <View key={i} className="flex-row items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl mb-3">
                            <View className="flex-row items-center gap-3">
                               <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center overflow-hidden">
                                 <Text className="text-white font-bold">{contact.name.charAt(0).toUpperCase()}</Text>
                               </View>
                               <Text className="text-white font-bold tracking-wider">{contact.name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleInviteContact(contact)} className="bg-indigo-600 px-4 py-2 rounded-full">
                               <Text className="text-white font-bold text-xs">Invite</Text>
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
