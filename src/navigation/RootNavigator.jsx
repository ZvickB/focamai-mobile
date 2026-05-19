import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AboutScreen from "../screens/AboutScreen";
import AffiliateDisclosureScreen from "../screens/AffiliateDisclosureScreen";
import ContactScreen from "../screens/ContactScreen";
import FollowUpScreen from "../screens/FollowUpScreen";
import HomeScreen from "../screens/HomeScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import ResultsScreen from "../screens/ResultsScreen";
import SearchResultDetailScreen from "../screens/SearchResultDetailScreen";
import SearchScreen from "../screens/SearchScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { SearchFlowProvider } from "../search/SearchFlowContext";

const Stack = createNativeStackNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f7f2ea",
    card: "#f7f2ea",
    text: "#14222b",
    border: "#e4d7c6",
    primary: "#0F6175",
  },
};

export default function RootNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <SearchFlowProvider>
          <Stack.Navigator
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: "#f7f2ea",
              },
              headerTitleStyle: {
                color: "#14222b",
                fontFamily: "Manrope_600SemiBold",
                fontWeight: "600",
              },
              contentStyle: {
                backgroundColor: "#f7f2ea",
              },
            }}
          >
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="FollowUp"
              component={FollowUpScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{ title: "Focused Picks" }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
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
        </SearchFlowProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
