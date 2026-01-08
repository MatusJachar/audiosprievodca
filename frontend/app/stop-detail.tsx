import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore } from '../store/languageStore';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import BackgroundWrapper from '../components/BackgroundWrapper';
import { OfflineCacheManager } from '../utils/offlineCacheManager';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function StopDetail() {
  const { stopId } = useLocalSearchParams();
  const { tourStops, userProgress, markStopComplete } = useTourStore();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(true);
  const isMounted = useRef(true);

  const stop = tourStops.find((s) => s.id === stopId);
  const content = stop?.content[selectedLanguage];
  const isCompleted = userProgress?.completed_stops.includes(stopId as string) || false;

  // Track mounted state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Cleanup audio when leaving screen or changing stop
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  // Reset state when stopId changes
  useEffect(() => {
    // Clean up previous sound
    if (sound) {
      sound.stopAsync().catch(() => {});
      sound.unloadAsync().catch(() => {});
      setSound(null);
    }
    
    // Reset all playback state
    setIsPlaying(false);
    setIsLoading(false);
    setPlaybackPosition(0);
    setPlaybackDuration(0);
    setAudioUri(null);
    setLoadingAudio(true);
    
    // Load new audio URI
    const loadAudioUri = async () => {
      if (!stopId) return;
      
      try {
        // Check cache first
        const cached = await OfflineCacheManager.getCachedAudioUri(stopId as string, selectedLanguage);
        if (cached && isMounted.current) {
          setAudioUri(cached);
          setLoadingAudio(false);
          return;
        }
        
        // Use streaming URL
        const streamUrl = `${API_URL}/api/audio/stream/${stopId}/${selectedLanguage}`;
        if (isMounted.current) {
          setAudioUri(streamUrl);
          setLoadingAudio(false);
        }
      } catch (error) {
        console.error('Error loading audio URI:', error);
        if (isMounted.current) {
          setLoadingAudio(false);
        }
      }
    };

    loadAudioUri();
  }, [stopId, selectedLanguage]);

  const playAudio = async () => {
    if (!audioUri) {
      console.log('No audio URI');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (!sound) {
        // Create new sound
        console.log('Creating new sound...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, rate: playbackSpeed, progressUpdateIntervalMillis: 200 }
        );
        
        // Set up status update listener
        newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!isMounted.current) return;
          
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
        });
        
        if (isMounted.current) {
          setSound(newSound);
          setIsPlaying(true);
        }
      } else {
        // Toggle play/pause
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
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
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {}
      setSound(null);
      setIsPlaying(false);
      setPlaybackPosition(0);
    }
  };

  const changeSpeed = async () => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (sound) {
      try {
        await sound.setRateAsync(nextSpeed, true);
      } catch (e) {}
    }
  };

  const skipBackward = async () => {
    if (!sound) {
      console.log('No sound for skip backward');
      return;
    }
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(0, status.positionMillis - 10000);
        console.log('Skip backward to:', newPosition);
        await sound.setPositionAsync(newPosition);
        setPlaybackPosition(newPosition);
      }
    } catch (e) {
      console.error('Skip backward error:', e);
    }
  };

  const skipForward = async () => {
    if (!sound) {
      console.log('No sound for skip forward');
      return;
    }
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        const newPosition = Math.min(status.durationMillis, status.positionMillis + 10000);
        console.log('Skip forward to:', newPosition);
        await sound.setPositionAsync(newPosition);
        setPlaybackPosition(newPosition);
      }
    } catch (e) {
      console.error('Skip forward error:', e);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleBack = async () => {
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
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${playbackDuration > 0 ? (playbackPosition / playbackDuration) * 100 : 0}%` }
                    ]} 
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
                  <Text style={styles.timeText}>{formatTime(playbackDuration)}</Text>
                </View>
              </View>
            
              {/* Controls */}
              <View style={styles.controlsRow}>
                <Pressable onPress={changeSpeed} style={styles.speedButton}>
                  <Text style={styles.speedText}>{playbackSpeed}x</Text>
                </Pressable>
              
                <Pressable onPress={skipBackward} style={styles.controlButton}>
                  <Ionicons name="play-back" size={28} color="#fff" />
                  <Text style={styles.skipLabel}>-10s</Text>
                </Pressable>
              
                <Pressable onPress={playAudio} style={styles.playButton} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#000" />
                  )}
                </Pressable>
              
                <Pressable onPress={skipForward} style={styles.controlButton}>
                  <Ionicons name="play-forward" size={28} color="#fff" />
                  <Text style={styles.skipLabel}>+10s</Text>
                </Pressable>
              
                <Pressable onPress={handleStop} style={styles.stopButton}>
                  <Ionicons name="stop" size={24} color="#FF5252" />
                </Pressable>
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  description: { fontSize: 16, color: '#ccc', lineHeight: 26, marginBottom: 24 },
  audioPlayerCard: { backgroundColor: 'rgba(26, 26, 26, 0.95)', borderRadius: 16, padding: 20, marginBottom: 24 },
  loadingAudioText: { color: '#aaa', marginTop: 12, textAlign: 'center' },
  noAudioText: { color: '#aaa', textAlign: 'center' },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText: { color: '#aaa', fontSize: 12 },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  speedButton: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  speedText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  controlButton: { padding: 12, alignItems: 'center' },
  skipLabel: { color: '#aaa', fontSize: 10, marginTop: 2 },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  stopButton: { padding: 12 },
});
