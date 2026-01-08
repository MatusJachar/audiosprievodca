import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore } from '../store/languageStore';
import { useEffect, useState } from 'react';
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
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const stop = tourStops.find((s) => s.id === stopId);
  const content = stop?.content?.[selectedLanguage];
  const isCompleted = userProgress?.completed_stops?.includes(stopId as string) || false;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Reset when stop changes
  useEffect(() => {
    const cleanup = async () => {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    };
    cleanup();
  }, [stopId, selectedLanguage]);

  const onStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        markStopComplete('default-user', stopId as string);
      }
    }
  };

  const handlePlay = async () => {
    try {
      setIsLoading(true);
      
      if (!sound) {
        // First check for cached offline audio
        let audioUri: string | null = null;
        
        try {
          audioUri = await OfflineCacheManager.getCachedAudioUri(stopId as string, selectedLanguage);
          if (audioUri) {
            console.log('[StopDetail] Using OFFLINE cached audio:', audioUri);
            setIsOfflineMode(true);
          }
        } catch (cacheError) {
          console.warn('[StopDetail] Offline cache check failed:', cacheError);
        }
        
        // Fallback to streaming URL if no cached audio
        if (!audioUri) {
          audioUri = `${API_URL}/api/audio/stream/${stopId}/${selectedLanguage}`;
          console.log('[StopDetail] Using STREAMING audio:', audioUri);
          setIsOfflineMode(false);
        }
        
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, progressUpdateIntervalMillis: 250 },
          onStatus
        );
        setSound(newSound);
        setIsPlaying(true);
      } else {
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
    } catch (e) {
      console.error('Play error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const handleSkip = async (seconds: number) => {
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        const newPos = Math.max(0, Math.min(status.positionMillis + seconds * 1000, status.durationMillis || 0));
        await sound.setPositionAsync(newPos);
      }
    }
  };

  const handleSpeedChange = async () => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (sound) {
      await sound.setRateAsync(next, true);
    }
  };

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleBack = async () => {
    if (sound) {
      await sound.unloadAsync();
    }
    router.back();
  };

  if (!stop) {
    return (
      <BackgroundWrapper>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{stop.stop_number}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll}>
          {isCompleted && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          )}

          <Text style={styles.title}>{content?.title || stop.stop_name}</Text>
          <Text style={styles.desc}>{content?.description || 'No description available.'}</Text>

          {/* Audio Player */}
          <View style={styles.player}>
            {/* Offline Mode Indicator */}
            {isOfflineMode && (
              <View style={styles.offlineIndicator}>
                <Ionicons name="cloud-offline" size={14} color="#4CAF50" />
                <Text style={styles.offlineIndicatorText}>Playing from offline cache</Text>
              </View>
            )}
            
            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }]} />
              </View>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.time}>{formatTime(position)}</Text>
              <Text style={styles.time}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.controls}>
              <Pressable onPress={handleSpeedChange} style={styles.speedBtn}>
                <Text style={styles.speedText}>{speed}x</Text>
              </Pressable>

              <Pressable onPress={() => handleSkip(-10)} style={styles.skipBtn}>
                <Ionicons name="play-back" size={26} color="#fff" />
                <Text style={styles.skipText}>-10s</Text>
              </Pressable>

              <Pressable onPress={handlePlay} style={styles.playBtn} disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#000" />
                )}
              </Pressable>

              <Pressable onPress={() => handleSkip(10)} style={styles.skipBtn}>
                <Ionicons name="play-forward" size={26} color="#fff" />
                <Text style={styles.skipText}>+10s</Text>
              </Pressable>

              <Pressable onPress={handleStop} style={styles.stopBtn}>
                <Ionicons name="stop" size={22} color="#FF5252" />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, gap: 16 },
  backBtn: { padding: 8 },
  badge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  scroll: { flex: 1, padding: 20 },
  completedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76,175,80,0.2)', padding: 10, borderRadius: 8, marginBottom: 16, gap: 8 },
  completedText: { color: '#4CAF50', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  desc: { fontSize: 15, color: '#ccc', lineHeight: 24, marginBottom: 20 },
  player: { backgroundColor: 'rgba(30,30,30,0.95)', borderRadius: 16, padding: 20 },
  progressRow: { marginBottom: 8 },
  progressBg: { height: 6, backgroundColor: '#444', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  time: { color: '#888', fontSize: 12 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  speedBtn: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  speedText: { color: '#FFD700', fontWeight: 'bold' },
  skipBtn: { padding: 10, alignItems: 'center' },
  skipText: { color: '#888', fontSize: 10, marginTop: 2 },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  stopBtn: { padding: 10 },
});
