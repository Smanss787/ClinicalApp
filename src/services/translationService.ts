import enTranslations from '../constants/translations/en.json';
import frTranslations from '../constants/translations/fr.json';

export type Language = 'en' | 'fr';

export interface Translations {
  [key: string]: any;
}

class TranslationService {
  private currentLanguage: Language = 'en';
  private translations: { [key in Language]: Translations } = {
    en: enTranslations,
    fr: frTranslations,
  };

  // Get current language
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  // Set language
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  // Get translation by key (supports nested keys like 'auth.login')
  t(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = this.getFallbackTranslation(key);
        break;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  // Get fallback translation from English
  private getFallbackTranslation(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations.en;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  // Get all available languages
  getAvailableLanguages(): { label: string; value: Language }[] {
    return [
      { label: this.translations.en.languages.english, value: 'en' },
      { label: this.translations.fr.languages.french, value: 'fr' },
    ];
  }

  // Get gender options for current language
  getGenderOptions(): { label: string; value: string }[] {
    const genderTranslations = this.translations[this.currentLanguage].gender;
    return [
      { label: genderTranslations.male, value: 'male' },
      { label: genderTranslations.female, value: 'female' },
      { label: genderTranslations.other, value: 'other' },
      { label: genderTranslations.ratherNotSay, value: 'na' },
    ];
  }
}

// Create singleton instance
export const translationService = new TranslationService();

// Export convenience function
export const t = (key: string): string => translationService.t(key); 