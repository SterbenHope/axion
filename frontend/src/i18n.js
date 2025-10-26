import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';
import frTranslation from './locales/fr/translation.json';
import deTranslation from './locales/de/translation.json';
import itTranslation from './locales/it/translation.json';

import enGames from './locales/en/games.json';
import esGames from './locales/es/games.json';
import frGames from './locales/fr/games.json';
import deGames from './locales/de/games.json';
import itGames from './locales/it/games.json';

const resources = {
  en: {
    translation: enTranslation,
    games: enGames
  },
  es: {
    translation: esTranslation,
    games: esGames
  },
  fr: {
    translation: frTranslation,
    games: frGames
  },
  de: {
    translation: deTranslation,
    games: deGames
  },
  it: {
    translation: itTranslation,
    games: itGames
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation', 'games'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
