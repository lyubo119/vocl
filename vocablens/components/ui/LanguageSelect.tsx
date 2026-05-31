import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../constants/theme';
import {
  AUTODETECT_LANGUAGE_CODE,
  SUPPORTED_TRANSLATION_LANGUAGES,
  SupportedTranslationLanguage,
  getTranslationLanguage,
} from '../../lib/translation/languages';
import Icon from './Icon';

type Props = {
  label: string;
  value: string;
  onChange: (code: string) => void;
  includeAutodetect?: boolean;
};

export default function LanguageSelect({ label, value, onChange, includeAutodetect = false }: Props) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const selected = getTranslationLanguage(value);

  const languages = useMemo<SupportedTranslationLanguage[]>(() => {
    const baseLanguages = includeAutodetect
      ? [{ code: AUTODETECT_LANGUAGE_CODE, name: AUTODETECT_LANGUAGE_CODE }, ...SUPPORTED_TRANSLATION_LANGUAGES]
      : SUPPORTED_TRANSLATION_LANGUAGES;

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return baseLanguages;

    return baseLanguages.filter((language) => {
      const searchable = [
        language.code,
        language.name,
        ...(language.aliases ?? []),
      ].join(' ').toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [includeAutodetect, query]);

  const handleSelect = (code: string) => {
    onChange(code);
    setQuery('');
    setVisible(false);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <View style={styles.buttonTextWrap}>
          <Text style={styles.languageName} numberOfLines={1}>
            {selected?.name ?? value}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>{label}</Text>
            <View style={styles.searchRow}>
              <Icon name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search languages"
                placeholderTextColor={colors.textCtaUnfocused}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              renderItem={({ item }) => {
                const active = selected?.code === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => handleSelect(item.code)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionName}>{item.name}</Text>
                    </View>
                    {active && <Icon name="check" size={18} color="#ffffff" />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  label: {
    ...typography.smallCaps,
    marginBottom: spacing.xs,
  },
  button: {
    minHeight: 58,
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s,
  },
  buttonTextWrap: {
    flex: 1,
  },
  languageName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: '#111111',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    paddingBottom: spacing.l,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.l,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.m,
  },
  searchRow: {
    height: 44,
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.md,
    paddingHorizontal: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  list: {
    marginHorizontal: -spacing.s,
  },
  option: {
    minHeight: 56,
    borderRadius: radii.md,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s,
  },
  optionActive: {
    backgroundColor: colors.bgButtonSub,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionName: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
  },
});
