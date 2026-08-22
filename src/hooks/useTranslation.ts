import { TRANSLATIONS, TranslationKey } from "../data/translations";

export function useTranslation(languageCode: string) {
  const t = (key: TranslationKey): string => {
    // Fallback to English if key or language not found
    const lang = TRANSLATIONS[languageCode] || TRANSLATIONS["en"];
    return lang[key] || TRANSLATIONS["en"][key] || key;
  };

  return { t };
}
