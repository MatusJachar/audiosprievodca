import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'sk' | 'en' | 'de' | 'pl' | 'ru' | 'es' | 'hu' | 'zh' | 'fr';

interface LanguageState {
  selectedLanguage: Language;
  setLanguage: (language: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const LANGUAGES = [
  { code: 'sk', name: 'Slovenčina', nativeName: 'Slovak', flag: '🇸🇰' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', nativeName: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', nativeName: 'German', flag: '🇩🇪' },
  { code: 'pl', name: 'Polski', nativeName: 'Polish', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', nativeName: 'Russian', flag: '🇷🇺' },
  { code: 'es', name: 'Español', nativeName: 'Spanish', flag: '🇪🇸' },
  { code: 'hu', name: 'Magyar', nativeName: 'Hungarian', flag: '🇭🇺' },
  { code: 'zh', name: '中文', nativeName: 'Chinese', flag: '🇨🇳' },
] as const;

export const useLanguageStore = create<LanguageState>((set) => ({
  selectedLanguage: 'en',
  
  setLanguage: async (language: Language) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', language);
      set({ selectedLanguage: language });
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },
  
  loadLanguage: async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedLanguage');
      if (saved) {
        set({ selectedLanguage: saved as Language });
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  },
}));