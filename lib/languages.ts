/**
 * Languages of the FIFA World Cup 2026 — official/primary languages of the
 * 48 qualified nations, deduplicated. Used by the emergency broadcast composer
 * and the fan assistant's language picker. BCP-47 codes drive browser TTS.
 */

export interface Language {
  code: string; // BCP-47
  name: string;
  native: string;
  rtl?: boolean;
}

export const WORLD_CUP_LANGUAGES: Language[] = [
  { code: "en-US", name: "English", native: "English" },
  { code: "es-MX", name: "Spanish", native: "Español" },
  { code: "fr-FR", name: "French", native: "Français" },
  { code: "pt-BR", name: "Portuguese", native: "Português" },
  { code: "ar-SA", name: "Arabic", native: "العربية", rtl: true },
  { code: "de-DE", name: "German", native: "Deutsch" },
  { code: "it-IT", name: "Italian", native: "Italiano" },
  { code: "nl-NL", name: "Dutch", native: "Nederlands" },
  { code: "hr-HR", name: "Croatian", native: "Hrvatski" },
  { code: "sr-RS", name: "Serbian", native: "Српски" },
  { code: "pl-PL", name: "Polish", native: "Polski" },
  { code: "da-DK", name: "Danish", native: "Dansk" },
  { code: "no-NO", name: "Norwegian", native: "Norsk" },
  { code: "sv-SE", name: "Swedish", native: "Svenska" },
  { code: "tr-TR", name: "Turkish", native: "Türkçe" },
  { code: "ja-JP", name: "Japanese", native: "日本語" },
  { code: "ko-KR", name: "Korean", native: "한국어" },
  { code: "fa-IR", name: "Persian", native: "فارسی", rtl: true },
  { code: "uz-UZ", name: "Uzbek", native: "Oʻzbekcha" },
  { code: "hi-IN", name: "Hindi", native: "हिन्दी" },
  { code: "id-ID", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "th-TH", name: "Thai", native: "ไทย" },
  { code: "zh-CN", name: "Chinese", native: "中文" },
  { code: "sw-KE", name: "Swahili", native: "Kiswahili" },
  { code: "am-ET", name: "Amharic", native: "አማርኛ" },
  { code: "wo-SN", name: "Wolof", native: "Wolof" },
  { code: "ha-NG", name: "Hausa", native: "Hausa" },
  { code: "yo-NG", name: "Yoruba", native: "Yorùbá" },
  { code: "tw-GH", name: "Twi", native: "Twi" },
  { code: "so-SO", name: "Somali", native: "Soomaali" },
  { code: "ht-HT", name: "Haitian Creole", native: "Kreyòl Ayisyen" },
  { code: "qu-PE", name: "Quechua", native: "Runasimi" },
  { code: "gn-PY", name: "Guarani", native: "Avañe'ẽ" },
  { code: "mi-NZ", name: "Māori", native: "Te Reo Māori" },
  { code: "ru-RU", name: "Russian", native: "Русский" },
  { code: "uk-UA", name: "Ukrainian", native: "Українська" },
];

/** Default set for one-click emergency broadcast (host + highest-attendance languages). */
export const BROADCAST_DEFAULTS = ["en-US", "es-MX", "fr-FR", "pt-BR", "ar-SA", "hi-IN"];

export function getLanguage(code: string): Language | undefined {
  return WORLD_CUP_LANGUAGES.find((l) => l.code === code);
}
