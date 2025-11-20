import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTourStore } from '../store/tourStore';
import { useLanguageStore, LANGUAGES } from '../store/languageStore';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Admin() {
  const { tourStops, fetchTourStops } = useTourStore();
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState('en');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    fetchTourStops();
    fetchBackgroundImage();
  }, []);

  const fetchBackgroundImage = async () => {
    try {
      const response = await fetch(`${API_URL}/api/images/background`);
      const data = await response.json();
      if (data.background_image_base64) {
        setBackgroundImage(data.background_image_base64);
      }
    } catch (error) {
      console.error('Error fetching background image:', error);
    }
  };

  const handleEditStop = (stop: any) => {
    setSelectedStop(stop);
    setEditingLanguage('en');
    setEditTitle(stop.content.en.title);
    setEditDescription(stop.content.en.description);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStop) return;

    try {
      const updatedContent = {
        ...selectedStop.content,
        [editingLanguage]: {
          title: editTitle,
          description: editDescription,
        },
      };

      const response = await fetch(`${API_URL}/api/tour-stops/${selectedStop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Tour stop updated successfully!');
        setEditModalVisible(false);
        fetchTourStops();
      } else {
        Alert.alert('Error', 'Failed to update tour stop');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleGenerateAudio = async (stopId: string, language: string) => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/audio/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stop_id: stopId, language }),
      });

      if (response.ok) {
        Alert.alert('Success', `Audio generated for ${language}!`);
        fetchTourStops();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to generate audio');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllAudio = async (stopId: string) => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/audio/generate-all/${stopId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Success', 'Audio generation completed for all languages!');
        fetchTourStops();
      } else {
        Alert.alert('Error', 'Failed to generate audio');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const pickBackgroundImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploadingImage(true);
      try {
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const response = await fetch(`${API_URL}/api/images/background`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64 }),
        });

        if (response.ok) {
          Alert.alert('Success', 'Background image uploaded successfully!');
          setBackgroundImage(base64);
        } else {
          Alert.alert('Error', 'Failed to upload background image');
        }
      } catch (error) {
        Alert.alert('Error', 'Network error occurred');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const pickStopImage = async (stopId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setUploadingImage(true);
      try {
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const response = await fetch(`${API_URL}/api/images/tour-stop/${stopId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64 }),
        });

        if (response.ok) {
          Alert.alert('Success', 'Tour stop image uploaded successfully!');
          fetchTourStops();
        } else {
          Alert.alert('Error', 'Failed to upload tour stop image');
        }
      } catch (error) {
        Alert.alert('Error', 'Network error occurred');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleManageImages = (stop: any) => {
    setSelectedStop(stop);
    setImageModalVisible(true);
  };

  const changeEditLanguage = (langCode: string) => {
    if (selectedStop) {
      const content = selectedStop.content[langCode];
      setEditingLanguage(langCode);
      setEditTitle(content?.title || '');
      setEditDescription(content?.description || '');
    }
  };

  const renderStopItem = ({ item }: { item: any }) => {
    const audioCount = Object.keys(item.audio || {}).length;
    const hasImage = !!item.image_base64;
    
    return (
      <View style={styles.stopCard}>
        <View style={styles.stopHeader}>
          <View style={styles.stopNumber}>
            <Text style={styles.stopNumberText}>{item.stop_number}</Text>
          </View>
          <View style={styles.stopInfo}>
            <Text style={styles.stopTitle}>{item.content.en.title}</Text>
            <Text style={styles.audioStatus}>
              {audioCount}/8 audio • {hasImage ? '✓ Image' : '⚠ No Image'}
            </Text>
          </View>
        </View>
        
        <View style={styles.stopActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditStop(item)}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.imageButton]}
            onPress={() => handleManageImages(item)}
            disabled={uploadingImage}
          >
            <Ionicons name="image-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.audioButton]}
            onPress={() => handleGenerateAllAudio(item.id)}
            disabled={generating}
          >
            <Ionicons name="volume-high" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Audio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={() => fetchTourStops()}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Background Image Section */}
      <View style={styles.backgroundSection}>
        <Text style={styles.sectionTitle}>Background Image</Text>
        <TouchableOpacity
          style={styles.backgroundButton}
          onPress={pickBackgroundImage}
          disabled={uploadingImage}
        >
          {backgroundImage ? (
            <Image 
              source={{ uri: `data:image/png;base64,${backgroundImage}` }} 
              style={styles.backgroundPreview}
            />
          ) : (
            <View style={styles.backgroundPlaceholder}>
              <Ionicons name="image-outline" size={48} color="#666" />
              <Text style={styles.placeholderText}>Upload Background</Text>
            </View>
          )}
          {uploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={tourStops}
        renderItem={renderStopItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      
      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit Stop {selectedStop?.stop_number}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {/* Language Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageTabs}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageTab,
                    editingLanguage === lang.code && styles.languageTabActive,
                  ]}
                  onPress={() => changeEditLanguage(lang.code)}
                >
                  <Text style={styles.languageTabText}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageTabLabel,
                    editingLanguage === lang.code && styles.languageTabLabelActive,
                  ]}>
                    {lang.code.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <ScrollView style={styles.formContent}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Enter title"
                placeholderTextColor="#666"
              />
              
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Enter description"
                placeholderTextColor="#666"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveEdit}
              >
                <Ionicons name="checkmark" size={20} color="#000" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        visible={imageModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Manage Image - Stop {selectedStop?.stop_number}
              </Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.imageModalContent}>
              <Text style={styles.sectionSubtitle}>{selectedStop?.content.en.title}</Text>
              
              {selectedStop?.image_base64 ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: `data:image/png;base64,${selectedStop.image_base64}` }} 
                    style={styles.stopImagePreview}
                    resizeMode="cover"
                  />
                  <Text style={styles.imageStatusText}>✓ Image uploaded</Text>
                </View>
              ) : (
                <View style={styles.imagePreviewContainer}>
                  <View style={styles.stopImagePlaceholder}>
                    <Ionicons name="image-outline" size={64} color="#666" />
                    <Text style={styles.placeholderText}>No image uploaded</Text>
                  </View>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickStopImage(selectedStop?.id)}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={24} color="#000" />
                    <Text style={styles.uploadButtonText}>
                      {selectedStop?.image_base64 ? 'Replace Image' : 'Upload Image'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60, backgroundColor: '#1a1a1a' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backgroundSection: { backgroundColor: '#1a1a1a', padding: 16, marginHorizontal: 16, marginTop: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 12 },
  backgroundButton: { width: '100%', height: 150, borderRadius: 12, overflow: 'hidden', backgroundColor: '#2a2a2a' },
  backgroundPreview: { width: '100%', height: '100%' },
  backgroundPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 14, color: '#666', marginTop: 8 },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  stopCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stopNumber: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stopNumberText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  stopInfo: { flex: 1 },
  stopTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  audioStatus: { fontSize: 12, color: '#aaa' },
  stopActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a2a2a', padding: 12, borderRadius: 8, gap: 6 },
  imageButton: { backgroundColor: '#9C27B0' },
  audioButton: { backgroundColor: '#4CAF50' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  languageTabs: { padding: 16, maxHeight: 80 },
  languageTab: { alignItems: 'center', padding: 8, marginRight: 8, borderRadius: 8, backgroundColor: '#2a2a2a', minWidth: 60 },
  languageTabActive: { backgroundColor: '#FFD700' },
  languageTabText: { fontSize: 24, marginBottom: 4 },
  languageTabLabel: { fontSize: 10, color: '#aaa', fontWeight: '600' },
  languageTabLabelActive: { color: '#000' },
  formContent: { padding: 24 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#aaa', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#2a2a2a', color: '#fff', padding: 16, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  textArea: { height: 200 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD700', padding: 16, borderRadius: 12, gap: 8, marginTop: 12 },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  imageModalContent: { padding: 24 },
  sectionSubtitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  imagePreviewContainer: { marginBottom: 24 },
  stopImagePreview: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#2a2a2a' },
  stopImagePlaceholder: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  imageStatusText: { fontSize: 14, color: '#4CAF50', marginTop: 8, textAlign: 'center' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFD700', padding: 16, borderRadius: 12, gap: 8 },
  uploadButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});
