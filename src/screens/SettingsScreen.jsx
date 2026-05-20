import { Pressable, Text, View } from "react-native";
import { ScreenContainer, Surface } from "../components/MobileUI";

export default function SettingsScreen({ navigation }) {
  const menuItems = [
    { label: "Shopping region", routeName: "Region" },
    { label: "About Focama", routeName: "About" },
    { label: "Contact", routeName: "Contact" },
    { label: "Privacy", routeName: "Privacy" },
    { label: "Affiliate Disclosure", routeName: "AffiliateDisclosure" },
  ];

  return (
    <ScreenContainer testID="settings.screen">
      <Surface>
        <View className="gap-2">
          {menuItems.map((item) => (
            <Pressable
              key={item.routeName}
              onPress={() => navigation.navigate(item.routeName)}
              className="min-h-[48px] justify-center rounded-lg border border-line bg-cream px-4 py-3"
            >
              <Text className="text-sm font-semibold text-slate-800">{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </Surface>
    </ScreenContainer>
  );
}
