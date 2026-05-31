import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Animated, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { handleError } from '../utils/errorHandler';

export function useUserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { username: myUsername } = useContext(AuthContext);
  const { username } = route.params as { username: string };

  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [iHavePostedToday, setIHavePostedToday] = useState(false);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const [reactingToPostId, setReactingToPostId] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  const HEADER_HEIGHT = 180;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, HEADER_HEIGHT],
    outputRange: [-50, 0, HEADER_HEIGHT * 0.5],
    extrapolate: 'clamp',
  });

  const profilePicScale = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes, circleRes] = await Promise.all([
        api.get(`/users/${username}/profile`),
        api.get(`/posts/user/${username}`),
        api.get('/users/circle')
      ]);
      setProfile(profileRes.data);
      setIsFollowing(profileRes.data.isFollowing || false);
      setUserPosts(postsRes.data || []);
      
      const me = circleRes.data.find((c: any) => c.isMe);
      setIHavePostedToday(me?.hasPosted || false);
    } catch (error: any) {
      handleError(error, 'Profile is currently unavailable');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [username, navigation]);

  useEffect(() => { 
    fetchProfileData(); 
  }, [username, fetchProfileData]);

  const handleFollowUser = async () => {
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post(`/users/${profile.id}/follow`);
      setIsFollowing(!isFollowing);
      setProfile((prev: any) => ({
        ...prev,
        followersCount: isFollowing ? Math.max(0, (prev.followersCount || 0) - 1) : (prev.followersCount || 0) + 1
      }));
    } catch (e) {
      handleError(e, 'Failed to update follow status');
    }
  };

  const openFollowers = async () => {
    setShowFollowers(true); setLoadingLists(true);
    try { 
      const res = await api.get(`/users/${username}/followers`); 
      setFollowersList(res.data); 
    } catch(e) {
      handleError(e, 'Failed to fetch followers');
    } finally { 
      setLoadingLists(false); 
    }
  };

  const openFollowing = async () => {
    setShowFollowing(true); setLoadingLists(true);
    try { 
      const res = await api.get(`/users/${username}/following`); 
      setFollowingList(res.data); 
    } catch(e) {
      handleError(e, 'Failed to fetch following');
    } finally { 
      setLoadingLists(false); 
    }
  };

  const openComments = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const response = await api.get(`/comments/${postId}?page=0&size=50`);
      setComments(response.data.content);
    } catch (error) {
      handleError(error, 'Failed to fetch comments');
    } finally { 
      setLoadingComments(false); 
    }
  };

  const handleLikeToggled = (postId: string, newIsLiked: boolean) => {
    setUserPosts(curr => curr.map(p => p.id === postId ? { ...p, isLiked: newIsLiked, likesCount: newIsLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) } : p));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev: any) => ({ ...prev, isLiked: newIsLiked, likesCount: newIsLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1) }));
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activeCommentsPostId) return;
    const text = newComment;
    setNewComment('');
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.post(`/comments/${activeCommentsPostId}`, { text });
      const response = await api.get(`/comments/${activeCommentsPostId}?page=0&size=50`);
      setComments(response.data.content);
      
      if (selectedPost && selectedPost.id === activeCommentsPostId) {
        setSelectedPost({ ...selectedPost, commentsCount: (selectedPost.commentsCount || 0) + 1 });
      }
      setUserPosts(curr => curr.map(p => p.id === activeCommentsPostId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
    } catch (error) {
      handleError(error, 'Failed to send comment');
    }
  };

  const handleReactionCapture = async (uri: string) => {
    if (!reactingToPostId) return;
    const postId = reactingToPostId;
    setReactingToPostId(null);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'reaction.jpg';
      const type = `image/${filename.split('.').pop()}`;
      formData.append('file', { uri, name: filename, type } as any);

      setUserPosts(curr => curr.map(p => p.id === postId ? { ...p, recentReactions: [uri, ...(p.recentReactions || [])].slice(0, 3) } : p));

      await api.post(`/interactions/${postId}/react`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (selectedPost && selectedPost.id === postId) {
         setSelectedPost((prev: any) => ({ ...prev, recentReactions: [uri, ...(prev.recentReactions || [])].slice(0,3) }));
      }
    } catch (error) {
      handleError(error, 'Could not add reaction');
    }
  };

  const isWithinLast24Hours = (dateStr: string) => {
    const postDate = new Date(dateStr).getTime();
    const now = Date.now();
    return (now - postDate) < 24 * 60 * 60 * 1000;
  };

  return {
    insets,
    navigation,
    myUsername,
    username,
    profile,
    userPosts,
    loading,
    isFollowing,
    iHavePostedToday,
    showFollowers,
    setShowFollowers,
    showFollowing,
    setShowFollowing,
    followersList,
    followingList,
    loadingLists,
    selectedPost,
    setSelectedPost,
    selectedImage,
    setSelectedImage,
    activeCommentsPostId,
    setActiveCommentsPostId,
    comments,
    newComment,
    setNewComment,
    loadingComments,
    reactingToPostId,
    setReactingToPostId,
    scrollY,
    pulseAnim,
    headerTranslateY,
    profilePicScale,
    handleFollowUser,
    openFollowers,
    openFollowing,
    openComments,
    handleLikeToggled,
    submitComment,
    handleReactionCapture,
    isWithinLast24Hours,
    fetchProfileData,
  };
}
