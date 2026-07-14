const mobileApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
const accountUiEnabled =
  String(process.env.EXPO_PUBLIC_ACCOUNT_UI_ENABLED || "").trim().toLowerCase() === "true";
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN || "";
const sentryOrganization = process.env.SENTRY_ORG || "";
const sentryProject = process.env.SENTRY_PROJECT || "";
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN || "";

if (process.env.EAS_BUILD && !mobileApiBaseUrl) {
  throw new Error("Set EXPO_PUBLIC_API_BASE_URL to the Render backend API URL before running an EAS build.");
}

if (process.env.EAS_BUILD && accountUiEnabled && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    "Account UI is enabled, but EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing.",
  );
}

if (
  process.env.EAS_BUILD &&
  (!sentryDsn || !sentryOrganization || !sentryProject || !sentryAuthToken)
) {
  throw new Error(
    "Set EXPO_PUBLIC_SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN before running an EAS build.",
  );
}

export default {
  expo: {
    name: "Focamai",
    slug: "focama-mobile",
    scheme: "focamai",
    version: "1.5.0",
    orientation: "portrait",
    icon: "./assets/app-icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-wordmark.png",
      resizeMode: "contain",
      backgroundColor: "#fbf7ef",
    },
    ios: {
      bundleIdentifier: "com.focamai.app",
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription: "Focamai uses your microphone to let you search by voice.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-foreground.png",
        backgroundColor: "#fbf7ef",
      },
      edgeToEdgeEnabled: true,
      package: "com.focamai.app",
      permissions: ["android.permission.RECORD_AUDIO"],
      softwareKeyboardLayoutMode: "resize",
      versionCode: 1,
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon-brand.png",
    },
    extra: {
      apiBaseUrl: mobileApiBaseUrl,
      eas: {
        projectId: "cfc4fd1e-d40c-424e-91c0-a24866bb09d7",
      },
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          backgroundColor: "#fbf7ef",
          enableFullScreenImage_legacy: true,
          image: "./assets/splash-wordmark.png",
          resizeMode: "contain",
        },
      ],
      "expo-font",
      "expo-av",
      "expo-secure-store",
      "expo-web-browser",
      [
        "@sentry/react-native/expo",
        {
          organization: sentryOrganization,
          project: sentryProject,
        },
      ],
    ],
  },
};
