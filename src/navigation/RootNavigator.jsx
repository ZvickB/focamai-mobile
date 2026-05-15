import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AboutScreen from "../screens/AboutScreen";
import AffiliateDisclosureScreen from "../screens/AffiliateDisclosureScreen";
import ContactScreen from "../screens/ContactScreen";
import HomeScreen from "../screens/HomeScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import SearchResultDetailScreen from "../screens/SearchResultDetailScreen";
import SettingsScreen from "../screens/SettingsScreen";

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
  return (
    <SafeAreaProvider>
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
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen
            name="SearchResultDetail"
            component={SearchResultDetailScreen}
            options={{ title: "Focused Pick" }}
          />
          <Stack.Screen
            name="AffiliateDisclosure"
            component={AffiliateDisclosureScreen}
            options={{ title: "Affiliate Disclosure" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
