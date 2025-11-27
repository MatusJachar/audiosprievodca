import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore, LANGUAGES } from '../store/languageStore';
import BackgroundWrapper from '../components/BackgroundWrapper';

export default function LanguageSelect() {
  const { selectedLanguage, setLanguage } = useLanguageStore();

  const handleLanguageSelect = async (langCode: string) => {
    await setLanguage(langCode as any);
    router.push('/tour-select');
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <StatusBar style="light" />
      
      <View style={styles.header}>
        <Ionicons name="language" size={48} color="#FFD700" />
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>Select a language for the tour</Text>
      </View>
      
      <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              selectedLanguage === lang.code && styles.languageButtonSelected,
            ]}
            onPress={() => handleLanguageSelect(lang.code)}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <View style={styles.languageInfo}>
              <Text style={[
                styles.languageName,
                selectedLanguage === lang.code && styles.languageNameSelected,
              ]}>
                {lang.name}
              </Text>
            </View>
            {selectedLanguage === lang.code && (
              <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/tour')}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 8,
  },
  languageList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2a2a',
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  languageNameSelected: {
    color: '#FFD700',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 30,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
