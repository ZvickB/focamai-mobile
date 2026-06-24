import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { historyStore, onHistoryStoreChanged } from "../../lib/history/historyStore";

export function useSearchHistory() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setEntries(await historyStore.list());
    } catch (listError) {
      setEntries([]);
      setError(listError?.message || "Unable to load search history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  // Re-fetch when the active store switches (e.g., local → remote on sign-in).
  useEffect(() => onHistoryStoreChanged(() => void refresh()), [refresh]);

  const clear = useCallback(async () => {
    await historyStore.clear();
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id) => {
    await historyStore.remove(id);
    await refresh();
  }, [refresh]);

  return {
    clear,
    entries,
    error,
    loading,
    refresh,
    remove,
  };
}
