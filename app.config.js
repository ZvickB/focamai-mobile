export default {
  expo: {
    name: "Focama",
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
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon-brand.png",
    },
    plugins: ["expo-font"],
  },
};
