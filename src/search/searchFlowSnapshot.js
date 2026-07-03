import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "focamai:searchFlowSnapshot:v1";
const SNAPSHOT_TTL_MS = 60 * 60 * 1000;

export async function saveFlowSnapshot(snapshot) {
  if (!snapshot || (snapshot.phase !== "refine" && snapshot.phase !== "results")) {
    return;
  }

  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...snapshot, savedAt: Date.now() }),
    );
  } catch {
    // Flow restoration is best-effort; a storage failure should not block search.
  }
}

export async function readFlowSnapshot() {
  try {
    const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    const savedAt = Number(parsed?.savedAt);

    if (!parsed || !Number.isFinite(savedAt) || Date.now() - savedAt > SNAPSHOT_TTL_MS) {
      await clearFlowSnapshot();
      return null;
    }

    if (!parsed.discoveryToken || !parsed.submittedQuery) {
      await clearFlowSnapshot();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function clearFlowSnapshot() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort cleanup only.
  }
}
