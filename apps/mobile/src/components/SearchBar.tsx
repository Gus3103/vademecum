/**
 * SearchBar component with autocomplete suggestions.
 *
 * - Controlled input; fires getSuggestions when ≥ 3 characters with 300ms debounce
 * - Shows a dropdown suggestion list (FlatList) below the input
 * - Accessible: accessibilityRole="search" on container, accessibilityLabel on input
 * - Web: role="combobox" + aria-expanded for ARIA compliance
 *
 * Requirements: 1.2, 1.4, 2.2, 7.4
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { getSuggestions } from '../services/searchService';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (text: string) => void;
  type?: 'active' | 'commercial';
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  type = 'active',
  placeholder = 'Buscar medicamento...',
}: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);

      // Clear previous debounce timer
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }

      if (text.length >= 3) {
        debounceTimer.current = setTimeout(async () => {
          try {
            const results = await getSuggestions(text, type);
            setSuggestions(results);
            setIsExpanded(results.length > 0);
          } catch {
            setSuggestions([]);
            setIsExpanded(false);
          }
        }, 300);
      } else {
        setSuggestions([]);
        setIsExpanded(false);
      }
    },
    [onChangeText, type],
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      onChangeText(suggestion);
      setSuggestions([]);
      setIsExpanded(false);
      onSubmit(suggestion);
    },
    [onChangeText, onSubmit],
  );

  const handleSubmitEditing = useCallback(() => {
    setSuggestions([]);
    setIsExpanded(false);
    onSubmit(value);
  }, [onSubmit, value]);

  // Web-specific ARIA props
  const webInputProps =
    Platform.OS === 'web'
      ? ({
          role: 'combobox',
          'aria-expanded': isExpanded,
          'aria-autocomplete': 'list',
          'aria-haspopup': 'listbox',
        } as Record<string, unknown>)
      : {};

  return (
    <View
      style={styles.container}
      accessibilityRole="search"
    >
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor="#888"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Campo de búsqueda de medicamentos"
        accessibilityHint="Ingrese al menos 3 caracteres para ver sugerencias"
        {...webInputProps}
      />

      {isExpanded && suggestions.length > 0 && (
        <View
          style={styles.suggestionsContainer}
          // @ts-expect-error — role listbox is valid on web
          role={Platform.OS === 'web' ? 'listbox' : undefined}
          accessibilityRole="list"
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `suggestion-${index}-${item}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
                accessibilityRole="button"
                accessibilityLabel={`Sugerencia: ${item}`}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#333',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
});

export default SearchBar;
