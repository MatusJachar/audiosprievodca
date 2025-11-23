import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function EditLegend() {
  const { stopId, legendIndex } = useLocalSearchParams();
  const [stop, setStop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'sk', name: 'Slovak' },
    { code: 'de', name: 'German' },
    { code: 'pl', name: 'Polish' },
    { code: 'ru', name: 'Russian' },
    { code: 'es', name: 'Spanish' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'zh', name: 'Chinese' }
  ];

  useEffect(() => {
    loadStop();
  }, []);

  useEffect(() => {
    if (stop && stop.legends && stop.legends[Number(legendIndex)]) {
      const legend = stop.legends[Number(legendIndex)];
      const content = legend.content?.[selectedLang] || { title: '', description: '' };
      setTitle(content.title || '');
      setDescription(content.description || '');
    }
  }, [selectedLang, stop, legendIndex]);

  const loadStop = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tour-stops/${stopId}`);
      const data = await response.json();
      setStop(data);
      
      if (data.legends && data.legends[Number(legendIndex)]) {
        const legend = data.legends[Number(legendIndex)];
        const content = legend.content?.[selectedLang] || { title: '', description: '' };
        setTitle(content.title || '');
        setDescription(content.description || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load legend');
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Description cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const updatedLegends = [...stop.legends];
      const currentLegend = updatedLegends[Number(legendIndex)];
      
      // Update the specific language for this legend
      if (!currentLegend.content) {
        currentLegend.content = {};
      }
      
      currentLegend.content[selectedLang] = {
        title: title.trim(),
        description: description.trim()
      };

      const response = await fetch(`${API_URL}/api/tour-stops/${stopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legends: updatedLegends })
      });

      if (response.ok) {
        Alert.alert('Success', `Legend ${Number(legendIndex) + 1} saved!\n\n${selectedLang.toUpperCase()}: ${description.trim().length} characters`);
        await loadStop();
      } else {
        Alert.alert('Error', `Failed to save: ${response.status}`);
      }
    } catch (error) {
      Alert.alert('Error', `Network error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  const legendNumber = Number(legendIndex) + 1;
  const legendNames = [
    'Brave Monk and the Girl',
    'Knight Šaršek',
    'Beautiful Hedwig',
    'White Lady'
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legend {legendNumber}: {legendNames[Number(legendIndex)]}</Text>
        <TouchableOpacity onPress={saveChanges} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFD700" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#4CAF50" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Select Language:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langButton, selectedLang === lang.code && styles.langButtonActive]}
              onPress={() => setSelectedLang(lang.code)}
            >
              <Text style={[styles.langText, selectedLang === lang.code && styles.langTextActive]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Title:</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter legend title"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter legend story"
          placeholderTextColor="#666"
          multiline
          numberOfLines={20}
          textAlignVertical="top"
        />

        <Text style={styles.charCount}>{description.length} characters</Text>

        <TouchableOpacity style={styles.saveButton} onPress={saveChanges} disabled={saving}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Legend</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 16,
    marginBottom: 8,
  },
  langScroll: {
    marginBottom: 16,
  },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  langButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  langText: {
    color: '#fff',
    fontSize: 14,
  },
  langTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  textArea: {
    height: 400,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
