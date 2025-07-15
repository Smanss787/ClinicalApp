import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translationService, Language } from '../services/translationService';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  getAvailableLanguages: () => { label: string; value: Language }[];
  getGenderOptions: () => { label: string; value: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Initialize language from service
  useEffect(() => {
    setCurrentLanguage(translationService.getCurrentLanguage());
  }, []);

  const setLanguage = (language: Language) => {
    translationService.setLanguage(language);
    setCurrentLanguage(language);
  };

  const t = (key: string): string => {
    return translationService.t(key);
  };

  const getAvailableLanguages = () => {
    return translationService.getAvailableLanguages();
  };

  const getGenderOptions = () => {
    return translationService.getGenderOptions();
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    getAvailableLanguages,
    getGenderOptions,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 