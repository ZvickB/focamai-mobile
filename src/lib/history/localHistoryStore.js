import AsyncStorage from "@react-native-async-storage/async-storage";
import { createHistoryEntry } from "./historyEntry";

export const SEARCH_HISTORY_STORAGE_KEY = "focamai:searchHistory:v1";
export const MAX_HISTORY_ENTRIES = 50;

function sortNewestFirst(entries) {
  return [...entries].sort((firstEntry, secondEntry) =>
    String(secondEntry.updatedAt || "").localeCompare(String(firstEntry.updatedAt || "")),
  );
}

export async function readLocalHistoryEntries() {
  try {
    const rawValue = await AsyncStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) return [];

    return sortNewestFirst(
      parsedValue.filter((entry) => entry && typeof entry === "object" && entry.queryKey && entry.query),
    );
  } catch {
    return [];
  }
}

export async function writeLocalHistoryEntries(entries) {
  try {
    await AsyncStorage.setItem(
      SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_HISTORY_ENTRIES)),
    );
  } catch {
    // History is helpful but optional. Storage failures should not block search.
  }
}

export const localHistoryStore = {
  async clear() {
    await writeLocalHistoryEntries([]);
  },

  async list() {
    return readLocalHistoryEntries();
  },

  async remove(id) {
    const entryId = String(id || "");
    const entries = await readLocalHistoryEntries();
    await writeLocalHistoryEntries(entries.filter((entry) => entry.id !== entryId));
  },

  async save(entryInput) {
    const entry = createHistoryEntry(entryInput);
    const entries = await readLocalHistoryEntries();
    const existingEntry = entries.find((item) => item.queryKey === entry.queryKey);
    const savedEntry = {
      ...entry,
      createdAt: existingEntry?.createdAt || entry.createdAt,
      id: existingEntry?.id || entry.id,
      updatedAt: new Date().toISOString(),
    };
    const nextEntries = [
      savedEntry,
      ...entries.filter((item) => item.queryKey !== entry.queryKey),
    ].slice(0, MAX_HISTORY_ENTRIES);

    await writeLocalHistoryEntries(nextEntries);
    return savedEntry;
  },
};
