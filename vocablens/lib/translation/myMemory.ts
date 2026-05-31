import { normalizeTranslationLanguageCode } from './languages';

/**
 * MyMemory Translation Service
 * https://mymemory.translated.net/doc/spec.php
 *
 * Free quota:
 *   - 5,000 chars/day  — anonymous
 *   - 50,000 chars/day — with any email in `de=`
 *
 * No API key or bearer token required.
 *
 * IMPORTANT: The `langpair` parameter uses a literal pipe `|` as separator.
 * URLSearchParams encodes `|` → `%7C`, which MyMemory rejects (returns the
 * original word unchanged). The URL is therefore built manually so that the
 * pipe stays unencoded.
 */

export interface TranslationResult {
  translatedText: string;
}

/**
 * Translate `text` from `sourceLang` to `targetLang` via MyMemory.
 *
 * @param text       Word/phrase to translate
 * @param sourceLang MyMemory source language code/name (e.g. "de-DE" or "de") — the unknown language
 * @param targetLang MyMemory target language code/name (e.g. "en-GB" or "en") — the known language
 * @param email      Optional email for 50k chars/day quota (instead of 5k)
 */
export async function translateWord(
  text: string,
  sourceLang: string,
  targetLang: string,
  email?: string | null
): Promise<TranslationResult> {
  const normalizedSourceLang = normalizeTranslationLanguageCode(sourceLang);
  const normalizedTargetLang = normalizeTranslationLanguageCode(targetLang);

  // Build the URL manually to keep the pipe literal in `langpair`
  let url =
    `https://api.mymemory.translated.net/get` +
    `?q=${encodeURIComponent(text)}` +
    `&langpair=${encodeURIComponent(normalizedSourceLang)}|${encodeURIComponent(normalizedTargetLang)}`;

  if (email && email.trim()) {
    url += `&de=${encodeURIComponent(email.trim())}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MyMemory HTTP error: ${response.status}`);
  }

  const json = await response.json();

  if (json?.responseStatus !== 200) {
    throw new Error(json?.responseDetails ?? 'MyMemory returned an error');
  }

  const translatedText: string = json?.responseData?.translatedText ?? '';

  if (
    !translatedText ||
    translatedText.toUpperCase().startsWith('PLEASE SELECT') ||
    translatedText.toUpperCase() === text.toUpperCase()
  ) {
    throw new Error(`No translation available: "${translatedText}"`);
  }

  return { translatedText };
}
