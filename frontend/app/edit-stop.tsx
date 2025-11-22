import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useLanguageStore } from '../store/languageStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function EditStop() {
  const { stopId } = useLocalSearchParams();
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
    if (stop) {
      const content = stop.content[selectedLang] || { title: '', description: '' };
      console.log(`Loading ${selectedLang}:`, {
        title: content.title,
        descLength: content.description?.length || 0
      });
      setTitle(content.title || '');
      setDescription(content.description || '');
    }
  }, [selectedLang, stop]);

  const loadStop = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tour-stops/${stopId}`);
      const data = await response.json();
      setStop(data);
      const content = data.content[selectedLang] || { title: '', description: '' };
      setTitle(content.title);
      setDescription(content.description);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tour stop');
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
      const updatedContent = {
        ...stop.content,
        [selectedLang]: {
          title: title.trim(),
          description: description.trim()
        }
      };

      console.log('Saving to:', `${API_URL}/api/tour-stops/${stopId}`);
      console.log('Content length:', description.trim().length);

      const response = await fetch(`${API_URL}/api/tour-stops/${stopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent })
      });

      if (response.ok) {
        Alert.alert('Success', `Changes saved successfully!\n\n${selectedLang.toUpperCase()}: ${description.trim().length} characters`);
        await loadStop();
      } else {
        const errorText = await response.text();
        console.error('Save failed:', errorText);
        Alert.alert('Error', `Failed to save: ${response.status}`);
      }
    } catch (error) {
      console.error('Save error:', error);
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Stop {stop?.stop_number || 'Legends'}</Text>
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
          placeholder="Enter title"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Description:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter description"
          placeholderTextColor="#666"
          multiline
          numberOfLines={15}
          textAlignVertical="top"
        />

        <Text style={styles.charCount}>{description.length} characters</Text>

        <TouchableOpacity style={styles.saveButton} onPress={saveChanges} disabled={saving}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
    height: 300,
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
