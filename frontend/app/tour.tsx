import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore } from '../store/languageStore';
import { useEffect } from 'react';
import BackgroundWrapper from '../components/BackgroundWrapper';

export default function Tour() {
  const { tourStops, userProgress, loading, fetchTourStops, fetchUserProgress } = useTourStore();
  const selectedLanguage = useLanguageStore((state) => state.selectedLanguage);

  useEffect(() => {
    if (tourStops.length === 0) {
      fetchTourStops();
    }
    if (!userProgress) {
      fetchUserProgress('default-user');
    }
  }, []);

  const isStopCompleted = (stopId: string) => {
    return userProgress?.completed_stops.includes(stopId) || false;
  };

  const completedCount = userProgress?.completed_stops.length || 0;
  const totalCount = tourStops.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const renderTourStop = ({ item }: { item: any }) => {
    const content = item.content[selectedLanguage];
    const completed = isStopCompleted(item.id);
    const isLegendStop = item.stop_name && item.stop_name.startsWith('Legend ');
    
    return (
      <TouchableOpacity
        style={styles.stopCard}
        onPress={() => router.push({ 
          pathname: '/stop-detail', 
          params: { stopId: item.id } 
        })}
      >
        <View style={styles.stopNumber}>
          {isLegendStop ? (
            <Ionicons name="book" size={28} color="#000" />
          ) : (
            <Text style={styles.stopNumberText}>{item.stop_number}</Text>
          )}
        </View>
        
        <View style={styles.stopContent}>
          <Text style={styles.stopTitle} numberOfLines={1} ellipsizeMode="tail">
            {content?.title || 'Loading...'}
          </Text>
          <Text style={styles.stopDescription}>
            {content?.description || ''}
          </Text>
        </View>
        
        <View style={styles.stopActions}>
          {completed && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}
          <Ionicons name={isLegendStop ? "book" : "play-circle"} size={32} color="#FFD700" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && tourStops.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading tour...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerTitle}>Tour Stops</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount} / {totalCount} completed
          </Text>
        </View>
      </View>
      
      {/* Tour Stops List */}
      <FlatList
        data={tourStops}
        renderItem={renderTourStop}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#aaa',
  },
  listContent: {
    padding: 16,
  },
  stopCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
    minHeight: 80,
  },
  stopNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stopNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  stopContent: {
    flex: 1,
    paddingRight: 8,
  },
  stopTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  stopDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    maxHeight: 40,
    overflow: 'hidden',
  },
  stopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
