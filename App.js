import "./global.css";

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import RootNavigator from "./src/navigation/RootNavigator";
import { logResolvedApiBaseUrl } from "./src/search/searchApi";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: "Manrope_400Regular" }, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: "Manrope_400Regular" }, TextInput.defaultProps.style];

export default function App() {
  useEffect(() => {
    logResolvedApiBaseUrl();
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

  if (!fontsLoaded && !fontLoadError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}
