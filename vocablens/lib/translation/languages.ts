export type SupportedTranslationLanguage = {
  code: string;
  name: string;
  aliases?: string[];
};

export const AUTODETECT_LANGUAGE_CODE = 'Autodetect';

export const SUPPORTED_TRANSLATION_LANGUAGES: SupportedTranslationLanguage[] = [
  { code: 'af-ZA', name: 'Afrikaans' },
  { code: 'sq-AL', name: 'Albanian' },
  { code: 'am-ET', name: 'Amharic' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'hy-AM', name: 'Armenian' },
  { code: 'az-AZ', name: 'Azerbaijani' },
  { code: 'bjs-BB', name: 'Bajan' },
  { code: 'rm-RO', name: 'Balkan Gipsy', aliases: ['Romani'] },
  { code: 'eu-ES', name: 'Basque' },
  { code: 'bem-ZM', name: 'Bemba' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'be-BY', name: 'Bielarus', aliases: ['Belarusian'] },
  { code: 'bi-VU', name: 'Bislama' },
  { code: 'bs-BA', name: 'Bosnian' },
  { code: 'br-FR', name: 'Breton' },
  { code: 'bg-BG', name: 'Bulgarian' },
  { code: 'my-MM', name: 'Burmese', aliases: ['Myanmar'] },
  { code: 'ca-ES', name: 'Catalan' },
  { code: 'ceb-PH', name: 'Cebuano', aliases: ['Cebuan'] },
  { code: 'ch-GU', name: 'Chamorro' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', aliases: ['Chinese', 'Simplified Chinese', 'Mandarin', 'zh', 'zh-Hans'] },
  { code: 'zh-TW', name: 'Chinese Traditional', aliases: ['Chinese (Traditional)', 'Traditional Chinese', 'zh-Hant'] },
  { code: 'zdj-KM', name: 'Comorian (Ngazidja)', aliases: ['Comorian'] },
  { code: 'cop-EG', name: 'Coptic' },
  { code: 'aig-AG', name: 'Creole English (Antigua and Barbuda)' },
  { code: 'bah-BS', name: 'Creole English (Bahamas)' },
  { code: 'gcl-GD', name: 'Creole English (Grenadian)' },
  { code: 'gyn-GY', name: 'Creole English (Guyanese)' },
  { code: 'jam-JM', name: 'Creole English (Jamaican)' },
  { code: 'svc-VC', name: 'Creole English (Vincentian)' },
  { code: 'vic-US', name: 'Creole English (Virgin Islands)' },
  { code: 'ht-HT', name: 'Creole French (Haitian)', aliases: ['Haitian Creole'] },
  { code: 'acf-LC', name: 'Creole French (Saint Lucian)', aliases: ['Saint Lucian Creole'] },
  { code: 'crs-SC', name: 'Creole French (Seselwa)', aliases: ['Seselwa', 'Seychellois Creole'] },
  { code: 'pov-GW', name: 'Creole Portuguese (Upper Guinea)' },
  { code: 'hr-HR', name: 'Croatian' },
  { code: 'cs-CZ', name: 'Czech' },
  { code: 'da-DK', name: 'Danish' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'dz-BT', name: 'Dzongkha' },
  { code: 'en-GB', name: 'English', aliases: ['en-US', 'en'] },
  { code: 'eo-EU', name: 'Esperanto' },
  { code: 'et-EE', name: 'Estonian' },
  { code: 'fn-FNG', name: 'Fanagalo' },
  { code: 'fo-FO', name: 'Faroese' },
  { code: 'fi-FI', name: 'Finnish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'gl-ES', name: 'Galician' },
  { code: 'ka-GE', name: 'Georgian' },
  { code: 'de-DE', name: 'German' },
  { code: 'el-GR', name: 'Greek' },
  { code: 'grc-GR', name: 'Greek (Classical)', aliases: ['Classical Greek'] },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'ha-NE', name: 'Hausa' },
  { code: 'haw-US', name: 'Hawaiian' },
  { code: 'he-IL', name: 'Hebrew', aliases: ['iw'] },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'hu-HU', name: 'Hungarian' },
  { code: 'is-IS', name: 'Icelandic' },
  { code: 'id-ID', name: 'Indonesian' },
  { code: 'kl-GL', name: 'Inuktitut (Greenlandic)', aliases: ['Inuktitut', 'Greenlandic'] },
  { code: 'ga-IE', name: 'Irish Gaelic', aliases: ['Irish'] },
  { code: 'it-IT', name: 'Italian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'jv-ID', name: 'Javanese' },
  { code: 'kea-CV', name: 'Kabuverdianu', aliases: ['Cape Verdean Creole'] },
  { code: 'kab-DZ', name: 'Kabylian', aliases: ['Kabyle'] },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'kk-KZ', name: 'Kazakh' },
  { code: 'km-KM', name: 'Khmer' },
  { code: 'rw-RW', name: 'Kinyarwanda' },
  { code: 'rn-BI', name: 'Kirundi' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'ku-TR', name: 'Kurdish' },
  { code: 'ckb-IQ', name: 'Kurdish Sorani', aliases: ['Sorani'] },
  { code: 'ky-KG', name: 'Kyrgyz' },
  { code: 'lo-LA', name: 'Lao' },
  { code: 'la-VA', name: 'Latin' },
  { code: 'lv-LV', name: 'Latvian' },
  { code: 'lt-LT', name: 'Lithuanian' },
  { code: 'lb-LU', name: 'Luxembourgish' },
  { code: 'mk-MK', name: 'Macedonian' },
  { code: 'mg-MG', name: 'Malagasy' },
  { code: 'ms-MY', name: 'Malay' },
  { code: 'dv-MV', name: 'Maldivian', aliases: ['Dhivehi'] },
  { code: 'mt-MT', name: 'Maltese' },
  { code: 'gv-IM', name: 'Manx Gaelic', aliases: ['Manx'] },
  { code: 'mi-NZ', name: 'Maori' },
  { code: 'mh-MH', name: 'Marshallese' },
  { code: 'men-SL', name: 'Mende' },
  { code: 'mn-MN', name: 'Mongolian' },
  { code: 'mfe-MU', name: 'Morisyen' },
  { code: 'ne-NP', name: 'Nepali' },
  { code: 'niu-NU', name: 'Niuean' },
  { code: 'no-NO', name: 'Norwegian', aliases: ['nb', 'nn'] },
  { code: 'ny-MW', name: 'Nyanja', aliases: ['Chichewa'] },
  { code: 'ur-PK', name: 'Pakistani', aliases: ['Urdu'] },
  { code: 'pau-PW', name: 'Palauan' },
  { code: 'pa-IN', name: 'Panjabi', aliases: ['Punjabi'] },
  { code: 'pap-CW', name: 'Papiamentu' },
  { code: 'ps-PK', name: 'Pashto' },
  { code: 'fa-IR', name: 'Persian', aliases: ['Farsi'] },
  { code: 'pis-SB', name: 'Pijin' },
  { code: 'pl-PL', name: 'Polish' },
  { code: 'pt-PT', name: 'Portuguese' },
  { code: 'pot-US', name: 'Potawatomi' },
  { code: 'qu-PE', name: 'Quechua' },
  { code: 'ro-RO', name: 'Romanian' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'sm-WS', name: 'Samoan' },
  { code: 'sg-CF', name: 'Sango' },
  { code: 'gd-GB', name: 'Scots Gaelic', aliases: ['Scottish Gaelic'] },
  { code: 'sr-RS', name: 'Serbian' },
  { code: 'sn-ZW', name: 'Shona' },
  { code: 'si-LK', name: 'Sinhala', aliases: ['Sinhalese'] },
  { code: 'sk-SK', name: 'Slovak' },
  { code: 'sl-SI', name: 'Slovenian' },
  { code: 'so-SO', name: 'Somali' },
  { code: 'st-ST', name: 'Sotho, Southern', aliases: ['Southern Sotho', 'Sesotho'] },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'srn-SR', name: 'Sranan Tongo' },
  { code: 'sw-SZ', name: 'Swahili' },
  { code: 'sv-SE', name: 'Swedish' },
  { code: 'de-CH', name: 'Swiss German' },
  { code: 'syc-TR', name: 'Syriac (Aramaic)', aliases: ['Syriac', 'Aramaic'] },
  { code: 'tl-PH', name: 'Tagalog', aliases: ['Filipino'] },
  { code: 'tg-TJ', name: 'Tajik' },
  { code: 'tmh-DZ', name: 'Tamashek (Tuareg)', aliases: ['Tamashek', 'Tuareg'] },
  { code: 'ta-LK', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'tet-TL', name: 'Tetum' },
  { code: 'th-TH', name: 'Thai' },
  { code: 'bo-CN', name: 'Tibetan' },
  { code: 'ti-TI', name: 'Tigrinya' },
  { code: 'tpi-PG', name: 'Tok Pisin' },
  { code: 'tkl-TK', name: 'Tokelauan' },
  { code: 'to-TO', name: 'Tongan' },
  { code: 'tn-BW', name: 'Tswana' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'tk-TM', name: 'Turkmen' },
  { code: 'tvl-TV', name: 'Tuvaluan' },
  { code: 'uk-UA', name: 'Ukrainian' },
  { code: 'ppk-ID', name: 'Uma' },
  { code: 'uz-UZ', name: 'Uzbek' },
  { code: 'vi-VN', name: 'Vietnamese' },
  { code: 'wls-WF', name: 'Wallisian' },
  { code: 'cy-GB', name: 'Welsh' },
  { code: 'wo-SN', name: 'Wolof' },
  { code: 'xh-ZA', name: 'Xhosa' },
  { code: 'zu-ZA', name: 'Zulu' },
  { code: 'yi-YD', name: 'Yiddish' },
];

const normalizeLookupKey = (value: string): string =>
  value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, '-')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const addLookupKey = (lookup: Record<string, string>, key: string, code: string, overwrite = true) => {
  const normalized = normalizeLookupKey(key);
  if (overwrite || !lookup[normalized]) {
    lookup[normalized] = code;
  }
  const hyphenated = normalized.replace(/\s+/g, '-');
  if (overwrite || !lookup[hyphenated]) {
    lookup[hyphenated] = code;
  }
};

const LANGUAGE_LOOKUP = SUPPORTED_TRANSLATION_LANGUAGES.reduce<Record<string, string>>((lookup, language) => {
  const keys = [language.code, language.name, ...(language.aliases ?? [])];

  keys.forEach((key) => addLookupKey(lookup, key, language.code));
  addLookupKey(lookup, language.code.split('-')[0], language.code, false);

  return lookup;
}, {
  [normalizeLookupKey(AUTODETECT_LANGUAGE_CODE)]: AUTODETECT_LANGUAGE_CODE,
});

export const getTranslationLanguage = (input: string): SupportedTranslationLanguage | null => {
  let code: string;
  try {
    code = normalizeTranslationLanguageCode(input);
  } catch {
    return input.trim() ? { code: input, name: input } : null;
  }
  if (code === AUTODETECT_LANGUAGE_CODE) {
    return { code, name: AUTODETECT_LANGUAGE_CODE };
  }
  return SUPPORTED_TRANSLATION_LANGUAGES.find((item) => item.code === code) ?? null;
};

export const normalizeTranslationLanguageCode = (input: string): string => {
  const code = LANGUAGE_LOOKUP[normalizeLookupKey(input)];
  if (!code) {
    throw new Error(`Unsupported translation language: "${input}"`);
  }
  return code;
};

export const areSameTranslationLanguage = (a: string, b: string): boolean => {
  try {
    return normalizeTranslationLanguageCode(a) === normalizeTranslationLanguageCode(b);
  } catch {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
};

export const getTranslationLanguageLabel = (input: string): string => {
  const language = getTranslationLanguage(input);
  return language ? `${language.name} (${language.code})` : input;
};
