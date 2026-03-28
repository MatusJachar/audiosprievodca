import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_PASSWORD = 'castle2025'; // Change this to your desired password

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter password');
      return;
    }

    setLoading(true);
    
    if (password === ADMIN_PASSWORD) {
      // Save login state
      await AsyncStorage.setItem('admin_authenticated', 'true');
      Alert.alert('Success', 'Admin access granted');
      router.replace('/admin');
    } else {
      Alert.alert('Error', 'Incorrect password');
    }
    
    setLoading(false);
    setPassword('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={80} color="#4A90D9" />
        </View>
        
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Enter password to continue</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="key" size={20} color="#4A90D9" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleLogin}
          />
        </View>
        
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Checking...' : 'Login'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Settings</Text>
        </TouchableOpacity>
        
        <View style={styles.hint}>
          <Text style={styles.hintText}>Default password: castle2025</Text>
          <Text style={styles.hintSubtext}>Change this in /app/frontend/app/admin-login.tsx</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90D9',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    maxWidth: 400,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#4A90D9',
    fontSize: 14,
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  hintText: {
    color: '#666',
    fontSize: 12,
  },
  hintSubtext: {
    color: '#444',
    fontSize: 10,
    marginTop: 4,
  },
});
