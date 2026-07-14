import { useCallback, useEffect, useMemo, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

import { getSupabaseClient, isSupabaseAuthConfigured } from "../lib/supabase";
import { AuthContext } from "./useAuth";
import { createRemoteHistoryStore } from "../lib/history/remoteHistoryStore";
import { setHistoryStore } from "../lib/history/historyStore";
import { localHistoryStore } from "../lib/history/localHistoryStore";

WebBrowser.maybeCompleteAuthSession();

const OAUTH_CALLBACK_PATH = "auth/callback";

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

function readOAuthCallbackParams(callbackUrl) {
  const query = callbackUrl.includes("?")
    ? callbackUrl.slice(callbackUrl.indexOf("?") + 1).split("#")[0]
    : "";
  const hash = callbackUrl.includes("#") ? callbackUrl.slice(callbackUrl.indexOf("#") + 1) : "";
  const queryParams = new URLSearchParams(query);
  const hashParams = new URLSearchParams(hash);
  const getParam = (key) => queryParams.get(key) || hashParams.get(key);

  return {
    accessToken: getParam("access_token"),
    code: getParam("code"),
    error: getParam("error"),
    errorDescription: getParam("error_description"),
    refreshToken: getParam("refresh_token"),
  };
}

export async function finishOAuthCallback(client, callbackUrl) {
  const params = readOAuthCallbackParams(callbackUrl);

  if (params.error) {
    return { error: new Error(params.errorDescription || params.error) };
  }

  if (params.code) {
    return client.auth.exchangeCodeForSession(params.code);
  }

  if (params.accessToken && params.refreshToken) {
    return client.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
  }

  return { error: new Error("Google sign-in did not return a usable session.") };
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

  const requestPasswordReset = useCallback(async ({ email }) => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: new Error("Supabase auth is not configured.") };
    }

    return client.auth.resetPasswordForEmail(email, {
      redirectTo: "https://focamai.com/reset-password",
    });
  }, []);

  const signInWithOAuthProvider = useCallback(async (provider) => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: new Error("Supabase auth is not configured.") };
    }

    const redirectTo = AuthSession.makeRedirectUri({ path: OAUTH_CALLBACK_PATH });
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: provider === "google"
          ? {
            access_type: "offline",
            prompt: "select_account",
          }
          : undefined,
      },
    });

    if (error) {
      return { error };
    }

    if (!data?.url) {
      return { error: new Error("Google sign-in could not start.") };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") {
      return { data: { cancelled: true }, error: null };
    }

    return finishOAuthCallback(client, result.url);
  }, []);

  const signInWithGoogle = useCallback(() => signInWithOAuthProvider("google"), [signInWithOAuthProvider]);

  const signOut = useCallback(async (options) => {
    const client = getSupabaseClient();
    if (!client) {
      return { error: null };
    }

    return client.auth.signOut(options);
  }, []);

  const value = useMemo(
    () => ({
      configured: isSupabaseAuthConfigured,
      loading,
      requestPasswordReset,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      user: session?.user || null,
    }),
    [loading, requestPasswordReset, session, signIn, signInWithGoogle, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
