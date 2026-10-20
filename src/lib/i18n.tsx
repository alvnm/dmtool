'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { readStorage, writeStorage } from './usePersistentState';

export type Language = 'es' | 'en';

export const translations = {
  es: {
    // Nav & General
    dashboard: 'Panel',
    initiative: 'Iniciativa',
    inventory: 'Inventario',
    monsters: 'Bestiario',
    npcs: 'NPCs',
    spells: 'Grimorio',
    party: 'Grupo',
    treasure: 'Tesoros',
    search: 'Buscar',
    searchTooltip: 'Buscador rápido (Ctrl + K)',
    downloadTooltip: 'Descargar la campaña en JSON (Ctrl + S)',
    focus: 'Focus',
    focusTooltip: 'Focus Mode: ocultar barras y maximizar el espacio (tablet/laptop en la mesa)',
    exitFocus: 'Salir de Focus Mode',
    localMode: 'Modo Local',
    cloud: 'En la nube',
    cloudShort: 'Nube',
    localShort: 'Local',
    logout: 'Cerrar sesión',
    tools: 'Herramientas del DM',
    tagline: 'D&D 5e Campaign Assistant',
    langToggle: 'EN',
    langTooltip: 'Switch to English',
    themeDark: 'Cambiar al tema Pergamino',
    themeLight: 'Cambiar al tema Dungeon (oscuro)',
    themeDarkActive: 'Tema Dungeon activo',
    themeLightActive: 'Tema Pergamino activo',
  },
  en: {
    // Nav & General
    dashboard: 'Dashboard',
    initiative: 'Initiative',
    inventory: 'Inventory',
    monsters: 'Bestiary',
    npcs: 'NPCs',
    spells: 'Spellbook',
    party: 'Party',
    treasure: 'Treasure',
    search: 'Search',
    searchTooltip: 'Quick search (Ctrl + K)',
    downloadTooltip: 'Export campaign to JSON (Ctrl + S)',
    focus: 'Focus',
    focusTooltip: 'Focus Mode: hide bars and maximize workspace (tablets/laptops)',
    exitFocus: 'Exit Focus Mode',
    localMode: 'Local Mode',
    cloud: 'In Cloud',
    cloudShort: 'Cloud',
    localShort: 'Local',
    logout: 'Log out',
    tools: 'DM Tools',
    tagline: 'D&D 5e Campaign Assistant',
    langToggle: 'ES',
    langTooltip: 'Cambiar a Español',
    themeDark: 'Switch to Parchment theme',
    themeLight: 'Switch to Dungeon (dark) theme',
    themeDarkActive: 'Dungeon theme active',
    themeLightActive: 'Parchment theme active',
  },
} as const;

export type TranslationKey = keyof typeof translations['es'];

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const saved = readStorage<Language>('app-language', 'es');
    if (saved === 'es' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    writeStorage('app-language', lang);
  };

  const toggleLanguage = () => {
    const next: Language = language === 'es' ? 'en' : 'es';
    setLanguage(next);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] ?? translations['es'][key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      language: 'es',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: TranslationKey) => translations['es'][key] ?? key,
    };
  }
  return ctx;
}
