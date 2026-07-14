import "./global.css";

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./src/contexts/AuthProvider";
import StartupSplash from "./src/components/StartupSplash";
import RootNavigator from "./src/navigation/RootNavigator";
import { initializeSentry, wrapWithSentry } from "./src/lib/sentry";
import { logResolvedApiBaseUrl } from "./src/search/searchApi";
import { markStartupTiming } from "./src/lib/startupTiming";

// Keep the native splash in place until the matching React Native layer has rendered.
SplashScreen.setOptions({ fade: false });
SplashScreen.preventAutoHideAsync().catch(() => {});
initializeSentry();

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: "Manrope_400Regular" }, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: "Manrope_400Regular" }, TextInput.defaultProps.style];

function App() {
  const [reactSplashReady, setReactSplashReady] = useState(false);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  const [showStartupSplash, setShowStartupSplash] = useState(true);

  useEffect(() => {
    logResolvedApiBaseUrl();
  }, []);

  useEffect(() => {
    markStartupTiming("React root mounted");
  }, []);

  const [fontsLoaded, fontLoadError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 2,
            staleTime: 1000 * 60 * 5,
          },
        },
      }),
  );

  useEffect(() => {
    if (fontsLoaded || fontLoadError) {
      markStartupTiming("startup resources ready");
    }
  }, [fontLoadError, fontsLoaded]);

  useEffect(() => {
    if (!reactSplashReady) {
      return;
    }

    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => setNativeSplashHidden(true));
  }, [reactSplashReady]);

  const handleNavigationReady = useCallback(() => {
    markStartupTiming("first interactive screen");
    markStartupTiming("total cold-start duration");
  }, []);

  const handleReactSplashReady = useCallback(() => {
    setReactSplashReady(true);
  }, []);

  const handleStartupSplashDismissed = useCallback(() => {
    setShowStartupSplash(false);
  }, []);

  const appReady = fontsLoaded || fontLoadError;

  return (
    <>
      {appReady ? (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator onReady={handleNavigationReady} />
          </AuthProvider>
          <StatusBar style="dark" />
        </QueryClientProvider>
      ) : null}
      {showStartupSplash ? (
        <StartupSplash
          appReady={appReady}
          nativeSplashHidden={nativeSplashHidden}
          onDismissed={handleStartupSplashDismissed}
          onReady={handleReactSplashReady}
        />
      ) : null}
    </>
  );
}

export default wrapWithSentry(App);
