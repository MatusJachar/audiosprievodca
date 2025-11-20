import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore } from '../store/languageStore';
import { useEffect, useState } from 'react';
import { Audio } from 'expo-av';

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
  const [skipAmount, setSkipAmount] = useState(10000); // 10 seconds in milliseconds

  const stop = tourStops.find((s) => s.id === stopId);
  const content = stop?.content[selectedLanguage];
  const audioBase64 = stop?.audio[selectedLanguage];
  const isCompleted = userProgress?.completed_stops.includes(stopId as string) || false;

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlayPause = async () => {
    try {
      if (!audioBase64) {
        alert('Audio not available for this language. Please contact admin.');
        return;
      }

      if (!sound) {
        setIsLoading(true);
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: `data:audio/mp3;base64,${audioBase64}` },
          { shouldPlay: true, rate: playbackSpeed },
          onPlaybackStatusUpdate
        );
        
        setSound(newSound);
        setIsPlaying(true);
        setIsLoading(false);
      } else {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
      alert('Error playing audio. Please try again.');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        markStopComplete('default-user', stopId as string);
      }
    }
  };

  const handleStop = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
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
      await sound.setRateAsync(nextSpeed, true);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleMarkComplete = () => {
    markStopComplete('default-user', stopId as string);
  };

  if (!stop) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.stopNumberBadge}>
          <Text style={styles.stopNumberBadgeText}>{stop.stop_number}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{content?.title}</Text>
        
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
        
        <Text style={styles.description}>{content?.description}</Text>
        
        {!audioBase64 && (
          <View style={styles.noAudioCard}>
            <Ionicons name="information-circle" size={32} color="#FFD700" />
            <Text style={styles.noAudioText}>
              Audio not available for this language. Please contact admin to generate audio.
            </Text>
          </View>
        )}
        
        {!isCompleted && audioBase64 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleMarkComplete}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      
      {audioBase64 && (
        <View style={styles.audioPlayer}>
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(playbackPosition / playbackDuration) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.timeText}>{formatTime(playbackDuration)}</Text>
          </View>
          
          <View style={styles.controls}>
            <TouchableOpacity onPress={changeSpeed} style={styles.speedButton}>
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleStop} style={styles.controlButton}>
              <Ionicons name="stop" size={32} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.playButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#000" />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={48}
                  color="#000"
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="volume-medium" size={32} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.speedButton}>
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#aaa', marginTop: 16, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60, gap: 16 },
  backButton: { padding: 8 },
  stopNumberBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  stopNumberBadgeText: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a3d1a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 16, gap: 6 },
  completedText: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },
  description: { fontSize: 16, color: '#ccc', lineHeight: 24, marginBottom: 24 },
  noAudioCard: { backgroundColor: '#2a2a1a', padding: 20, borderRadius: 12, alignItems: 'center', gap: 12, marginBottom: 16 },
  noAudioText: { color: '#FFD700', textAlign: 'center', fontSize: 14, lineHeight: 20 },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, gap: 8 },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  audioPlayer: { backgroundColor: '#1a1a1a', padding: 24, paddingBottom: 40 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#2a2a2a', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFD700' },
  timeText: { fontSize: 12, color: '#aaa', minWidth: 40 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  playButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  controlButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  speedButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  speedText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
