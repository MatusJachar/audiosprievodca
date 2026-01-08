import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore } from '../store/languageStore';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import BackgroundWrapper from '../components/BackgroundWrapper';
import { OfflineCacheManager } from '../utils/offlineCacheManager';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function StopDetail() {
  const { stopId } = useLocalSearchParams();
  const { tourStops, userProgress, markStopComplete } = useTourStore();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(true);
  const [audioSource, setAudioSource] = useState<string>('');

  const stop = tourStops.find((s) => s.id === stopId);
  const content = stop?.content[selectedLanguage];
  const isCompleted = userProgress?.completed_stops.includes(stopId as string) || false;

  // Cleanup audio when leaving screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Stop and unload audio when leaving screen
        if (soundRef.current) {
          soundRef.current.stopAsync().catch(() => {});
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
        setIsPlaying(false);
        setPlaybackPosition(0);
        setPlaybackDuration(0);
      };
    }, [])
  );

  // Load audio URI - check cache first
  useEffect(() => {
    const loadAudioUri = async () => {
      if (!stopId) return;
      
      setLoadingAudio(true);
      
      // Check cache first
      const cached = await OfflineCacheManager.getCachedAudioUri(stopId as string, selectedLanguage);
      if (cached) {
        setAudioUri(cached);
        setAudioSource('cache');
        setLoadingAudio(false);
        return;
      }
      
      // Use streaming URL
      const streamUrl = `${API_URL}/api/audio/stream/${stopId}/${selectedLanguage}`;
      setAudioUri(streamUrl);
      setAudioSource('stream');
      setLoadingAudio(false);
    };

    loadAudioUri();
    
    // Cleanup on unmount or stopId change
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setIsPlaying(false);
      setPlaybackPosition(0);
      setPlaybackDuration(0);
    };
  }, [stopId, selectedLanguage]);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis || 0);
      if (status.durationMillis && status.durationMillis > 0) {
        setPlaybackDuration(status.durationMillis);
      }
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        markStopComplete('default-user', stopId as string);
      }
    }
  }, [stopId, markStopComplete]);

  const playAudio = async () => {
    if (!audioUri) return;
    
    try {
      setIsLoading(true);
      
      if (!soundRef.current) {
        // Create new sound
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, rate: playbackSpeed, progressUpdateIntervalMillis: 200 },
          onPlaybackStatusUpdate
        );
        
        soundRef.current = newSound;
        setIsPlaying(true);
      } else {
        // Toggle play/pause
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  };

  const changeSpeed = async () => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(nextSpeed, true);
      } catch (e) {}
    }
  };

  const skipBackward = async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          const newPosition = Math.max(0, status.positionMillis - 10000);
          await soundRef.current.setPositionAsync(newPosition);
          setPlaybackPosition(newPosition);
        }
      } catch (e) {
        console.error('Skip backward error:', e);
      }
    }
  };

  const skipForward = async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          const newPosition = Math.min(status.durationMillis, status.positionMillis + 10000);
          await soundRef.current.setPositionAsync(newPosition);
          setPlaybackPosition(newPosition);
        }
      } catch (e) {
        console.error('Skip forward error:', e);
      }
    }
  };

  const seekToPosition = async (event: any) => {
    if (!soundRef.current || playbackDuration === 0) return;
    
    try {
      const { locationX } = event.nativeEvent;
      const progressBarWidth = event.target?.offsetWidth || 300;
      const percentage = locationX / progressBarWidth;
      const newPosition = Math.floor(percentage * playbackDuration);
      
      await soundRef.current.setPositionAsync(newPosition);
      setPlaybackPosition(newPosition);
    } catch (e) {
      console.error('Seek error:', e);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleBack = async () => {
    // Stop audio before navigating back
    await handleStop();
    router.back();
  };

  if (!stop) {
    return (
      <BackgroundWrapper>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
      
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.stopNumberBadge}>
            <Text style={styles.stopNumberBadgeText}>{stop.stop_number}</Text>
          </View>
        </View>
      
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          )}
        
          <Text style={styles.title}>{content?.title || stop.stop_name}</Text>
        
          <Text style={styles.description}>{content?.description || 'No description available.'}</Text>

          {/* Audio Player */}
          {loadingAudio ? (
            <View style={styles.audioPlayerCard}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingAudioText}>Loading audio...</Text>
            </View>
          ) : audioUri ? (
            <View style={styles.audioPlayerCard}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <TouchableOpacity 
                  style={styles.progressBarTouchable}
                  onPress={seekToPosition}
                  activeOpacity={0.8}
                >
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0}%` }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
                  <Text style={styles.timeText}>{formatTime(playbackDuration)}</Text>
                </View>
              </View>
            
              {/* Controls */}
              <View style={styles.controlsRow}>
                <TouchableOpacity onPress={changeSpeed} style={styles.speedButton}>
                  <Text style={styles.speedText}>{playbackSpeed}x</Text>
                </TouchableOpacity>
              
                <TouchableOpacity onPress={skipBackward} style={styles.controlButton}>
                  <Ionicons name="play-back" size={28} color="#fff" />
                  <Text style={styles.skipLabel}>-10s</Text>
                </TouchableOpacity>
              
                <TouchableOpacity onPress={playAudio} style={styles.playButton} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#000" />
                  )}
                </TouchableOpacity>
              
                <TouchableOpacity onPress={skipForward} style={styles.controlButton}>
                  <Ionicons name="play-forward" size={28} color="#fff" />
                  <Text style={styles.skipLabel}>+10s</Text>
                </TouchableOpacity>
              
                <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
                  <Ionicons name="stop" size={24} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.audioPlayerCard}>
              <Text style={styles.noAudioText}>No audio available for this language</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 60, gap: 16 },
  backButton: { padding: 8 },
  stopNumberBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  stopNumberBadgeText: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  content: { flex: 1, padding: 24 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.2)', padding: 12, borderRadius: 8, marginBottom: 16, gap: 8 },
  completedBadgeText: { color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  sourceIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 16, gap: 6 },
  sourceCache: { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
  sourceStream: { backgroundColor: 'rgba(33, 150, 243, 0.15)' },
  sourceText: { fontSize: 12, fontWeight: '600' },
  sourceCacheText: { color: '#4CAF50' },
  sourceStreamText: { color: '#2196F3' },
  description: { fontSize: 16, color: '#ccc', lineHeight: 26, marginBottom: 24 },
  audioPlayerCard: { backgroundColor: 'rgba(26, 26, 26, 0.95)', borderRadius: 16, padding: 20, marginBottom: 24 },
  loadingAudioText: { color: '#aaa', marginTop: 12, textAlign: 'center' },
  noAudioText: { color: '#aaa', textAlign: 'center' },
  progressContainer: { marginBottom: 20 },
  progressBarTouchable: { paddingVertical: 10 },
  progressBar: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText: { color: '#aaa', fontSize: 12 },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  speedButton: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  speedText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  controlButton: { padding: 8, alignItems: 'center' },
  skipLabel: { color: '#aaa', fontSize: 10, marginTop: 2 },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  stopButton: { padding: 8 },
});
