import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { Animated, Keyboard, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { handleError } from '../utils/errorHandler';

interface UseFriendsFeedProps {
  onOpenCamera?: () => void;
  onHideBottomBar?: (hide: boolean) => void;
}

export function useFriendsFeed({ onOpenCamera, onHideBottomBar }: UseFriendsFeedProps = {}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const enterAnim = useRef(new Animated.Value(0)).current;
  const { username: myUsername } = useContext(AuthContext); 

  const [posts, setPosts] = useState<any[]>([]);
  const [circle, setCircle] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editCaptionText, setEditCaptionText] = useState('');

  const [reactingToPostId, setReactingToPostId] = useState<string | null>(null);

  const [activeStory, setActiveStory] = useState<any>(null);
  const storyProgress = useRef(new Animated.Value(0)).current;

  const [popoutPost, setPopoutPost] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [feedRes, circleRes] = await Promise.allSettled([
        api.get('/posts/feed?type=DAILY&page=0&size=20'),
        api.get('/users/circle')
      ]);

      if (feedRes.status === 'fulfilled') {
        const now = Date.now();
        // FILTRU DE 24 DE ORE PENTRU FEED-UL DE PRIETENI (STERGE TOT CE E MAI VECHI DE 24H)
        const recentPosts = feedRes.value.data.content.filter((p: any) => {
           return (now - new Date(p.createdAt).getTime()) < 24 * 60 * 60 * 1000;
        });
        setPosts(recentPosts);
      }
      
      if (circleRes.status === 'fulfilled') {
        setCircle(circleRes.value.data);
      } else {
        setCircle([{ id: 'me', name: 'Your Daily', img: null, hasPosted: false, isMe: true }]);
      }
    } catch (err) {
      handleError(err, 'Failed to update social feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Animated.spring(enterAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    fetchData();
  }, [fetchData, enterAnim]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchData();
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
    } catch (e) {
      // Slient search failures to not disrupt input flow
    }
  };

  const openUserProfile = (targetUsername: string) => {
    if (targetUsername === myUsername) {
      navigation.navigate('Profile');
      return; 
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss(); 
    setSearchQuery(''); 
    setSearchResults([]); 
    navigation.navigate('UserProfile', { username: targetUsername });
  };

  const saveCaptionEdit = async (postId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await api.patch(`/posts/${postId}/caption?caption=${encodeURIComponent(editCaptionText)}`);
      setPosts(curr => curr.map(p => p.id === postId ? { ...p, caption: editCaptionText } : p));
      setEditingPost(null);
    } catch(e) {
      handleError(e, 'Failed to edit caption');
    }
  };

  const handleLikeToggled = (postId: string, newIsLiked: boolean) => {
    setPosts(curr => curr.map(p => p.id === postId
      ? { ...p, isLiked: newIsLiked, likesCount: newIsLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) }
      : p
    ));
    if (popoutPost && popoutPost.id === postId) {
      setPopoutPost((prev: any) => ({
        ...prev,
        isLiked: newIsLiked,
        likesCount: newIsLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
      }));
    }
  };

  const handleReactionCapture = async (uri: string, message?: string) => {
    if (!reactingToPostId) return;
    const postId = reactingToPostId;
    setReactingToPostId(null);
    if (onHideBottomBar) onHideBottomBar(false);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'reaction.jpg';
      const type = `image/${filename.split('.').pop()}`;

      formData.append('file', { uri, name: filename, type } as any);
      if (message) {
         formData.append('message', message);
      }

      setPosts(curr => curr.map(p => p.id === postId ? { ...p, recentReactions: [uri, ...(p.recentReactions || [])].slice(0, 3) } : p));
      if (popoutPost && popoutPost.id === postId) {
        setPopoutPost((prev: any) => ({ ...prev, recentReactions: [uri, ...(prev.recentReactions || [])].slice(0, 3) }));
      }

      await api.post(`/interactions/${postId}/react`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      handleError(error, 'Failed to upload reaction');
    }
  };

  const iHavePosted = circle.length > 0 ? (circle.find(c => c.isMe)?.hasPosted || false) : false;

  const handleOpenStory = (friend: any) => {
    if (!friend.hasPosted || !friend.dailyPostUrl) return;
    if (!friend.isMe && !iHavePosted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Locked 🔒", "You need to post your Daily Snap first to see what your friends are up to!");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveStory(friend);
    storyProgress.setValue(0);
    Animated.timing(storyProgress, { toValue: 1, duration: 5000, useNativeDriver: false }).start(({ finished }) => {
      if (finished) setActiveStory(null);
    });
  };

  const closeStory = () => {
    storyProgress.stopAnimation();
    setActiveStory(null);
  };

  return {
    insets,
    navigation,
    enterAnim,
    myUsername,
    posts,
    setPosts,
    circle,
    setCircle,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    editingPost,
    setEditingPost,
    editCaptionText,
    setEditCaptionText,
    reactingToPostId,
    setReactingToPostId,
    activeStory,
    setActiveStory,
    storyProgress,
    popoutPost,
    setPopoutPost,
    fetchData,
    onRefresh,
    handleSearch,
    openUserProfile,
    saveCaptionEdit,
    handleLikeToggled,
    handleReactionCapture,
    iHavePosted,
    handleOpenStory,
    closeStory,
  };
}
