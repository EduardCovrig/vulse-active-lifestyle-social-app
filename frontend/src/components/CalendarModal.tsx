/**
 * CalendarModal
 *
 * Uses SwipeableModal's `afterClose` callback instead of setTimeout.
 * This ensures the photo viewer opens ONLY after the native Modal has
 * been fully dismissed from the view hierarchy — preventing touch-intercept freeze.
 *
 * Uses a virtualized FlatList instead of ScrollView to avoid severe UI
 * freezing when mounting 365 TouchableOpacity items at once.
 */
import React, { useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeableModal, { ModalScrollContext } from './SwipeableModal';
import { optimizedThumbUrl } from '../utils/cloudinaryUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_MARGIN_PERCENT = 1.5;
const ITEM_WIDTH_PERCENT = 47;
const ITEM_WIDTH = (SCREEN_WIDTH * ITEM_WIDTH_PERCENT) / 100;

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  snaps: any[];
  onSnapPress?: (url: string) => void;
}

interface DayItem {
  dateStr: string;
  displayDate: string;
  url: string | null;
}

export default function CalendarModal({ visible, onClose, loading, snaps, onSnapPress }: CalendarModalProps) {
  // Capture the pending URL to open after this modal fully closes
  const pendingUrl = useRef<string | null>(null);

  const snapMap = useMemo(() => {
    return snaps.reduce((acc, curr) => {
      acc[curr.date] = curr.mediaUrl;
      return acc;
    }, {} as Record<string, string>);
  }, [snaps]);

  const days: DayItem[] = useMemo(() => {
    const today = new Date();
    const result: DayItem[] = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        url: snapMap[dateStr] || null
      });
    }
    return result;
  }, [snapMap]);

  const handleSnapPress = useCallback((url: string) => {
    if (onSnapPress) {
      pendingUrl.current = url;
      onClose();
    }
  }, [onSnapPress, onClose]);

  const renderItem = useCallback(({ item }: { item: DayItem }) => (
    <TouchableOpacity
      onPress={() => item.url && handleSnapPress(item.url)}
      disabled={!item.url}
      style={{
        width: ITEM_WIDTH, aspectRatio: 0.8,
        margin: (SCREEN_WIDTH * ITEM_MARGIN_PERCENT) / 100 / 2,
        borderRadius: 24, overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: item.url ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {item.url ? (
        <Image source={{ uri: optimizedThumbUrl(item.url) }} style={{ width: '100%', height: '100%', position: 'absolute' }} resizeMode="cover" />
      ) : (
        <Ionicons name="camera-outline" size={20} color="rgba(255,255,255,0.06)" />
      )}

      {item.url && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          locations={[0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      <View style={{ position: 'absolute', bottom: 12, left: 14 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: item.url ? 'white' : 'rgba(255,255,255,0.15)', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
          {item.displayDate}
        </Text>
      </View>
    </TouchableOpacity>
  ), [handleSnapPress]);

  const keyExtractor = useCallback((_: DayItem, index: number) => index.toString(), []);

  return (
    <SwipeableModal
      visible={visible}
      onClose={onClose}
      // afterClose fires once the native Modal is completely gone from the hierarchy
      afterClose={() => {
        if (pendingUrl.current && onSnapPress) {
          const url = pendingUrl.current;
          pendingUrl.current = null;
          onSnapPress(url);
        }
      }}
      title="Your Calendar"
      subtitle="Daily snaps from the last 365 days"
      heightRatio={0.85}
    >
      <ModalScrollContext.Consumer>
        {(scrollContext) => loading ? (
          <ActivityIndicator color="#7dd3fc" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={days}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            onScroll={scrollContext?.onScroll}
            scrollEventThrottle={scrollContext?.scrollEventThrottle}
            contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 12 }}
            columnWrapperStyle={{ justifyContent: 'center' }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH / 0.8 + (SCREEN_WIDTH * ITEM_MARGIN_PERCENT) / 100,
              offset: (ITEM_WIDTH / 0.8 + (SCREEN_WIDTH * ITEM_MARGIN_PERCENT) / 100) * Math.floor(index / 2),
              index,
            })}
          />
        )}
      </ModalScrollContext.Consumer>
    </SwipeableModal>
  );
}