/**
 * Languages of the FIFA World Cup 2026 — official/primary languages of the
 * 48 qualified nations, deduplicated (24 languages). Used by the emergency
 * broadcast composer and the fan assistant's language picker. BCP-47 codes
 * drive browser TTS.
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
  { code: "cs-CZ", name: "Czech", native: "Čeština" },
  { code: "bs-BA", name: "Bosnian", native: "Bosanski" },
  { code: "no-NO", name: "Norwegian", native: "Norsk" },
  { code: "sv-SE", name: "Swedish", native: "Svenska" },
  { code: "tr-TR", name: "Turkish", native: "Türkçe" },
  { code: "ja-JP", name: "Japanese", native: "日本語" },
  { code: "ko-KR", name: "Korean", native: "한국어" },
  { code: "fa-IR", name: "Persian", native: "فارسی", rtl: true },
  { code: "uz-UZ", name: "Uzbek", native: "Oʻzbekcha" },
  { code: "wo-SN", name: "Wolof", native: "Wolof" },
  { code: "tw-GH", name: "Twi", native: "Twi" },
  { code: "ht-HT", name: "Haitian Creole", native: "Kreyòl Ayisyen" },
  { code: "pap-CW", name: "Papiamento", native: "Papiamentu" },
  { code: "gn-PY", name: "Guarani", native: "Avañe'ẽ" },
  { code: "mi-NZ", name: "Māori", native: "Te Reo Māori" },
];

/** Default set for one-click emergency broadcast (host + highest-attendance languages). */
export const BROADCAST_DEFAULTS = ["en-US", "es-MX", "fr-FR", "pt-BR", "ar-SA", "de-DE"];

export function getLanguage(code: string): Language | undefined {
  return WORLD_CUP_LANGUAGES.find((l) => l.code === code);
}
