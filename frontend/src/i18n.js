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

import enEmailVerification from './locales/en/emailVerification.json';
import esEmailVerification from './locales/es/emailVerification.json';
import frEmailVerification from './locales/fr/emailVerification.json';
import deEmailVerification from './locales/de/emailVerification.json';

const resources = {
  en: {
    translation: enTranslation,
    games: enGames,
    emailVerification: enEmailVerification
  },
  es: {
    translation: esTranslation,
    games: esGames,
    emailVerification: esEmailVerification
  },
  fr: {
    translation: frTranslation,
    games: frGames,
    emailVerification: frEmailVerification
  },
  de: {
    translation: deTranslation,
    games: deGames,
    emailVerification: deEmailVerification
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
    ns: ['translation', 'games', 'emailVerification'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
