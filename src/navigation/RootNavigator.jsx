import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AuthScreen from "../screens/AuthScreen";
import DevLauncherScreen from "../screens/DevLauncherScreen";
import AboutScreen from "../screens/AboutScreen";
import AffiliateDisclosureScreen from "../screens/AffiliateDisclosureScreen";
import ContactScreen from "../screens/ContactScreen";
import DeepDiveScreen from "../screens/DeepDiveScreen";
import FollowUpScreen from "../screens/FollowUpScreen";
import HistoryScreen from "../screens/HistoryScreen";
import HomeScreen from "../screens/HomeScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import PriceWatchesScreen from "../screens/PriceWatchesScreen";
import RegionScreen from "../screens/RegionScreen";
import ResultsScreen from "../screens/ResultsScreen";
import RetryUpdatingScreen from "../screens/RetryUpdatingScreen";
import SearchResultDetailScreen from "../screens/SearchResultDetailScreen";
import SearchScreen from "../screens/SearchScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { SearchFlowProvider } from "../search/SearchFlowContext";
import { appThemeTokens } from "../theme/themeTokens";
import { AppErrorBoundary } from "../components/AppErrorBoundary";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: appThemeTokens.appBackground,
      card: appThemeTokens.appBackground,
      text: "#14222b",
      border: appThemeTokens.borderSubtle,
      primary: "#0F6175",
    },
  };

  return (
    <AppErrorBoundary>
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <SearchFlowProvider>
          <Stack.Navigator
            initialRouteName={__DEV__ ? "DevLauncher" : "Search"}
            screenOptions={{
              ...(Platform.OS === "ios"
                ? {
                    fullScreenGestureEnabled: true,
                    gestureDirection: "horizontal",
                    gestureEnabled: true,
                  }
                : {}),
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: appThemeTokens.appBackground,
              },
              headerTitleStyle: {
                color: "#14222b",
                fontFamily: "Manrope_600SemiBold",
                fontWeight: "600",
              },
              contentStyle: {
                backgroundColor: appThemeTokens.appBackground,
              },
            }}
          >
            {__DEV__ ? (
              <Stack.Screen
                name="DevLauncher"
                component={DevLauncherScreen}
                options={{ headerShown: false }}
              />
            ) : null}
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
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RetryUpdating"
              component={RetryUpdatingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateAccount"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Region" component={RegionScreen} options={{ title: "Shopping region" }} />
            <Stack.Screen
              name="SearchResultDetail"
              component={SearchResultDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="DeepDive"
              component={DeepDiveScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PriceWatches"
              component={PriceWatchesScreen}
              options={{ headerShown: false }}
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
    </AppErrorBoundary>
  );
}
