import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry } from '@drug-medicine-lookup/shared';

const STORAGE_KEY = 'drug_medicine_lookup_history';
const MAX_ENTRIES = 20;

/**
 * Reads the current history entries from AsyncStorage.
 * Returns an empty array if storage is empty or corrupted.
 */
async function readEntries(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    // JSON parse error or storage error — return empty array gracefully
    return [];
  }
}

/**
 * Persists the given entries array to AsyncStorage.
 */
async function writeEntries(entries: HistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const historyService = {
  /**
   * Adds a new entry to the history.
   * Prepends the entry so the list stays newest-first.
   * If the list already has MAX_ENTRIES items, the oldest one (lowest timestamp)
   * is discarded before inserting the new entry.
   */
  async addEntry(entry: HistoryEntry): Promise<void> {
    let entries = await readEntries();

    if (entries.length >= MAX_ENTRIES) {
      // Find and remove the oldest entry (lowest timestamp)
      let oldestIndex = 0;
      let oldestTimestamp = entries[0]?.timestamp ?? Infinity;
      for (let i = 1; i < entries.length; i++) {
        const ts = entries[i]?.timestamp ?? Infinity;
        if (ts < oldestTimestamp) {
          oldestTimestamp = ts;
          oldestIndex = i;
        }
      }
      entries = entries.filter((_, i) => i !== oldestIndex);
    }

    // Prepend the new entry so newest is first
    entries = [entry, ...entries];

    await writeEntries(entries);
  },

  /**
   * Returns all history entries sorted newest first (descending timestamp).
   */
  async getEntries(): Promise<HistoryEntry[]> {
    const entries = await readEntries();
    return [...entries].sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * Removes the entry with the given id from the history.
   */
  async removeEntry(id: string): Promise<void> {
    const entries = await readEntries();
    const filtered = entries.filter((e) => e.id !== id);
    await writeEntries(filtered);
  },

  /**
   * Clears all history entries by removing the storage key entirely.
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
