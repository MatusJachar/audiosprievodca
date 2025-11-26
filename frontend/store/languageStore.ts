import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'sk' | 'en' | 'de' | 'pl' | 'ru' | 'es' | 'hu' | 'zh';

interface LanguageState {
  selectedLanguage: Language;
  setLanguage: (language: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const LANGUAGES = [
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
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