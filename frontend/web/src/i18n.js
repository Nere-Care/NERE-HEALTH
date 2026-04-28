import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    fr: {
      translation: {
        title: "Bonjour",
        description: "Bienvenue sur mon application"
      }
    },
    en: {
      translation: {
        title: "Hello",
        description: "Welcome to my application"
      }
    }
  },
  lng: "fr", // langue par défaut
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;