import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client = null;

const secureSessionStorage = {
  async getItem(key) {
    return SecureStore.getItemAsync(key);
  },

  async removeItem(key) {
    await SecureStore.deleteItemAsync(key);
  },

  async setItem(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
};

export function getSupabaseClient() {
  if (!isSupabaseAuthConfigured) {
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: secureSessionStorage,
      },
    });
  }

  return client;
}
