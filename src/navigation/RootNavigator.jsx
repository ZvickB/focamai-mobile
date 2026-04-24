import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SearchProgressProvider } from "../contexts/SearchProgressContext";
import AboutScreen from "../screens/AboutScreen";
import AffiliateDisclosureScreen from "../screens/AffiliateDisclosureScreen";
import ContactScreen from "../screens/ContactScreen";
import HomeScreen from "../screens/HomeScreen";
import PrivacyScreen from "../screens/PrivacyScreen";

const Stack = createNativeStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f4f7fb",
    card: "#ffffff",
    text: "#172033",
    border: "#d8e0ea",
    primary: "#3d7ef0",
  },
};

export default function RootNavigator() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SearchProgressProvider>
          <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
              screenOptions={{
                headerShadowVisible: false,
                headerStyle: {
                  backgroundColor: "#f4f7fb",
                },
                headerTitleStyle: {
                  color: "#172033",
                  fontWeight: "600",
                },
                contentStyle: {
                  backgroundColor: "#f4f7fb",
                },
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: "Focama" }}
              />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen name="Contact" component={ContactScreen} />
              <Stack.Screen name="Privacy" component={PrivacyScreen} />
              <Stack.Screen
                name="AffiliateDisclosure"
                component={AffiliateDisclosureScreen}
                options={{ title: "Affiliate Disclosure" }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SearchProgressProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
