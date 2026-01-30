import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLanguageStore, LANGUAGES } from '../store/languageStore';
import { LinearGradient } from 'expo-linear-gradient';

// Color scheme
const COLORS = {
  primary: '#4A90D9',
  secondary: '#7B68EE',
  accent: '#E8B923',
  dark: '#1a1a2e',
  darker: '#0f0f1a',
  card: '#252542',
  text: '#ffffff',
  textSecondary: '#b8c5d6',
};

export default function LanguageSelect() {
  const { selectedLanguage, setLanguage } = useLanguageStore();

  const handleSelectLanguage = async (code: string) => {
    await setLanguage(code);
    router.push('/tour');
  };

  // Language flags/icons
  const getLanguageEmoji = (code: string) => {
    const emojis: Record<string, string> = {
      en: '🇬🇧', sk: '🇸🇰', de: '🇩🇪', pl: '🇵🇱',
      ru: '🇷🇺', es: '🇪🇸', hu: '🇭🇺', zh: '🇨🇳', fr: '🇫🇷'
    };
    return emojis[code] || '🌐';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="language" size={28} color={COLORS.accent} />
          <Text style={styles.headerTitle}>Vyberte jazyk</Text>
          <Text style={styles.headerSubtitle}>Choose your language</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageCard,
              selectedLanguage === lang.code && styles.languageCardSelected
            ]}
            onPress={() => handleSelectLanguage(lang.code)}
          >
            <View style={styles.languageLeft}>
              <Text style={styles.languageEmoji}>{getLanguageEmoji(lang.code)}</Text>
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{lang.name}</Text>
                <Text style={styles.languageNative}>{lang.nativeName}</Text>
              </View>
            </View>
            {selectedLanguage === lang.code ? (
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.selectedBadge}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
            )}
          </TouchableOpacity>
        ))}
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Audiosprievodca je dostupný v 9 jazykoch. Vyberte si jazyk, ktorý vám najviac vyhovuje.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darker,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: COLORS.dark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74,144,217,0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.1)',
  },
  languageCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(74,144,217,0.1)',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  languageEmoji: {
    fontSize: 32,
  },
  languageInfo: {
    gap: 2,
  },
  languageName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageNative: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(74,144,217,0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(74,144,217,0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
