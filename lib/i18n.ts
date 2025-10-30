import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '../public/locales/en/common.json';
import zhCommon from '../public/locales/zh/common.json';
import koCommon from '../public/locales/ko/common.json';
import jaCommon from '../public/locales/ja/common.json';
import viCommon from '../public/locales/vi/common.json';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: enCommon,
  },
  zh: {
    common: zhCommon,
  },
  ko: {
    common: koCommon,
  },
  ja: {
    common: jaCommon,
  },
  vi: {
    common: viCommon,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: 'en',
    defaultNS,
    resources,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    // Add language mapping to handle browser locale codes
    load: 'languageOnly', // Use only language part, ignore region (e.g., 'zh' instead of 'zh-CN')
    supportedLngs: ['en', 'zh', 'ko', 'ja', 'vi'],
    nonExplicitSupportedLngs: true, // Allow fallback to supported languages
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;