import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore } from '../store/languageStore';
import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LegendsDetail() {
  const { stopId } = useLocalSearchParams();
  const { tourStops } = useTourStore();
  const { selectedLanguage } = useLanguageStore();
  
  const [selectedLegend, setSelectedLegend] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  
  const stop = tourStops.find(s => s.id === stopId);
  const content = stop?.content[selectedLanguage];
  const legends = stop?.legends || [];

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playLegendAudio = async (legend: any) => {
    try {
      // Stop current sound if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      // Check if legend has audio for selected language
      const audioBase64 = legend.audio?.[selectedLanguage];
      if (!audioBase64) {
        // Generate audio if not available
        setLoadingAudio(true);
        const response = await fetch(`${API_URL}/api/audio/generate-legend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            stop_id: stopId,
            legend_id: legend.id,
            language: selectedLanguage 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          legend.audio = legend.audio || {};
          legend.audio[selectedLanguage] = data.audio_base64;
        } else {
          alert('Failed to generate audio');
          setLoadingAudio(false);
          return;
        }
        setLoadingAudio(false);
      }

      // Play audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${legend.audio[selectedLanguage]}` },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setLoadingAudio(false);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const renderLegendCard = (legend: any, index: number) => {
    const legendContent = legend.content?.[selectedLanguage];
    if (!legendContent) return null;
    
    const hasAudio = !!legend.audio?.[selectedLanguage];
    const legendKey = `legend-${index}`;
    
    return (
      <TouchableOpacity
        key={legendKey}
        style={styles.legendCard}
        onPress={() => setSelectedLegend(selectedLegend === legendKey ? null : legendKey)}
      >
        <View style={styles.legendHeader}>
          <View style={styles.legendNumber}>
            <Text style={styles.legendNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.legendInfo}>
            <Text style={styles.legendTitle}>{legendContent.title}</Text>
            <View style={styles.legendMeta}>
              <Text style={styles.legendMetaText}>
                {hasAudio ? '🎵 Audio available' : '⚪ No audio'}
              </Text>
            </View>
          </View>
          <Ionicons 
            name={selectedLegend === legendKey ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#FFD700" 
          />
        </View>

        {selectedLegend === legendKey && (
          <View style={styles.legendContent}>
            <Text style={styles.legendDescription}>{legendContent.description}</Text>
            
            <View style={styles.audioControls}>
              {loadingAudio ? (
                <ActivityIndicator size="large" color="#FFD700" />
              ) : (
                <TouchableOpacity
                  style={[styles.audioButton, isPlaying && styles.audioButtonPlaying]}
                  onPress={() => isPlaying ? stopAudio() : playLegendAudio(legend)}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={24} 
                    color={isPlaying ? "#000" : "#fff"} 
                  />
                  <Text style={[styles.audioButtonText, isPlaying && styles.audioButtonTextPlaying]}>
                    {isPlaying ? 'Pause' : 'Play Audio'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!stop) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Stop not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {stop.stop_name === 'Legends' ? 'Legends' : `Stop ${stop.stop_number}`}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.mainCard}>
          <Text style={styles.title}>{content?.title}</Text>
          <Text style={styles.description}>{content?.description}</Text>
        </View>

        <Text style={styles.sectionTitle}>Castle Legends</Text>
        <Text style={styles.sectionSubtitle}>
          Tap on each legend to read the full story and listen to the audio
        </Text>

        {legends.map((legend: any, index: number) => renderLegendCard(legend, index))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60, backgroundColor: '#1a1a1a' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  scrollView: { flex: 1 },
  content: { padding: 24 },
  mainCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFD700', marginBottom: 16 },
  description: { fontSize: 16, color: '#ccc', lineHeight: 24 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  legendCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  legendHeader: { flexDirection: 'row', alignItems: 'center' },
  legendNumber: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  legendNumberText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  legendInfo: { flex: 1 },
  legendTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  legendMeta: { flexDirection: 'row', alignItems: 'center' },
  legendMetaText: { fontSize: 12, color: '#aaa' },
  legendContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  legendDescription: { fontSize: 14, color: '#ccc', lineHeight: 22, marginBottom: 16 },
  audioControls: { marginTop: 8 },
  audioButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a2a', padding: 16, borderRadius: 12, gap: 8 },
  audioButtonPlaying: { backgroundColor: '#FFD700' },
  audioButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  audioButtonTextPlaying: { color: '#000' },
  errorText: { fontSize: 16, color: '#fff', textAlign: 'center', marginTop: 100 },
});
