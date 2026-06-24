import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseClient, isSupabaseAuthConfigured } from "../lib/supabase";
import { AuthContext } from "./useAuth";
import { createRemoteHistoryStore } from "../lib/history/remoteHistoryStore";
import { setHistoryStore } from "../lib/history/historyStore";
import { localHistoryStore } from "../lib/history/localHistoryStore";

export async function migrateLocalHistoryToAccount(remoteStore, shouldContinue = () => true) {
  const localEntries = await localHistoryStore.list();

  if (localEntries.length === 0 || !shouldContinue()) {
    return;
  }

  for (const entry of localEntries) {
    if (!shouldContinue()) {
      return;
    }

    await remoteStore.save(entry);
  }

  if (!shouldContinue()) {
    return;
  }

  for (const entry of localEntries) {
    await localHistoryStore.remove(entry.id);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseAuthConfigured);

  useEffect(() => {
    if (!isSupabaseAuthConfigured) {
      return undefined;
    }

    let isMounted = true;
    const client = getSupabaseClient();
    if (!client) return undefined;

    client.auth.getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setSession(data.session || null);
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    const { data: subscriptionData } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscriptionData.subscription.unsubscribe();
    };
  }, []);

  // Switch history store between local and remote based on auth state,
  // and migrate local entries to the account on first sign-in.
  useEffect(() => {
    if (!session?.user?.id) {
      setHistoryStore(localHistoryStore);
      return undefined;
    }

    let isCancelled = false;
    const client = getSupabaseClient();
    if (!client) return undefined;

    const remoteStore = createRemoteHistoryStore({
      client,
      userId: session.user.id,
    });

    setHistoryStore(remoteStore);

    migrateLocalHistoryToAccount(remoteStore, () => !isCancelled)
      .then(() => {
        if (!isCancelled) {
          // Re-set after migration so listeners pick up the remote entries.
          setHistoryStore(remoteStore);
        }
      })
      .catch(() => {
        // Keep local history intact if migration fails.
      });

    return () => {
      isCancelled = true;
    };
  }, [session?.user?.id]);

  const signIn = useCallback(async ({ email, password }) => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: new Error("Supabase auth is not configured.") };
    }

    return client.auth.signInWithPassword({ email, password });
  }, []);

  const signUp = useCallback(async ({ email, password }) => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: new Error("Supabase auth is not configured.") };
    }

    return client.auth.signUp({ email, password });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Stubbed until Slice 5 wires up expo-auth-session.
    return { error: new Error("Google sign-in is not yet available on mobile.") };
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: null };
    }

    return client.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      configured: isSupabaseAuthConfigured,
      loading,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      user: session?.user || null,
    }),
    [loading, session, signIn, signInWithGoogle, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
