import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { ScreenContainer, ScreenIntro, Surface } from "../components/MobileUI";

export default function SettingsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 400;
  const menuItems = [
    { label: "Shopping region", routeName: "Region" },
    { label: "About Focama", routeName: "About" },
    { label: "Contact", routeName: "Contact" },
    { label: "Privacy", routeName: "Privacy" },
    { label: "Affiliate Disclosure", routeName: "AffiliateDisclosure" },
  ];

  return (
    <ScreenContainer
      testID="settings.screen"
      contentContainerStyle={{
        gap: isCompact ? 24 : 32,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingVertical: isCompact ? 24 : 32,
      }}
    >
      <ScreenIntro
        eyebrow="Settings"
        title="Preferences and app details."
        description="Manage your shopping region and find the core app information in one place."
      />
      <Surface>
        <View className="gap-3">
          {menuItems.map((item) => (
            <Pressable
              key={item.routeName}
              onPress={() => navigation.navigate(item.routeName)}
              className="min-h-[52px] justify-center rounded-[18px] border border-line bg-cream px-4 py-3"
            >
              <Text className="text-sm font-semibold text-ink">{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Surface>
    </ScreenContainer>
  );
}
