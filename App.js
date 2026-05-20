import "./global.css";

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useState } from "react";
import { Text, TextInput } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import RootNavigator from "./src/navigation/RootNavigator";
import { BackgroundPaletteProvider } from "./src/theme/BackgroundPaletteContext";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [{ fontFamily: "Manrope_400Regular" }, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [{ fontFamily: "Manrope_400Regular" }, TextInput.defaultProps.style];

export default function App() {
  const [fontsLoaded] = useFonts({
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BackgroundPaletteProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </BackgroundPaletteProvider>
    </QueryClientProvider>
  );
}
