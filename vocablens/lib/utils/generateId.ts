import * as Crypto from 'expo-crypto';

/**
 * Generate a unique ID using expo-crypto's native randomUUID.
 * Replaces the `uuid` package which crashes on React Native
 * due to missing crypto.getRandomValues() support.
 */
export const generateId = (): string => {
  return Crypto.randomUUID();
};
