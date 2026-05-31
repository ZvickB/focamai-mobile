const mobileApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";

if (process.env.EAS_BUILD && !mobileApiBaseUrl) {
  throw new Error("Set EXPO_PUBLIC_API_BASE_URL to the Render backend API URL before running an EAS build.");
}

export default {
  expo: {
    name: "Focamai",
    slug: "focama-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/app-icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-brand.png",
      resizeMode: "contain",
      backgroundColor: "#fbf7ef",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-foreground.png",
        backgroundColor: "#fbf7ef",
      },
      edgeToEdgeEnabled: true,
      package: "com.focamai.app",
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
    plugins: ["expo-font"],
  },
};
