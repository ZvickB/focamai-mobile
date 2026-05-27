// Dev-only screen — only registered in the navigator when __DEV__ is true.
// Lets you jump directly to any screen with mock data pre-loaded.

import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appThemeTokens } from "../theme/themeTokens";
import { useSearchFlow } from "../search/SearchFlowContext";

function Section({ title, children }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-widest text-stone-400">
        {title}
      </Text>
      {children}
    </View>
  );
}

function NavButton({ label, subtitle, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      className="rounded-xl bg-white px-4 py-3 active:opacity-70"
      style={{ borderWidth: 1, borderColor: appThemeTokens.borderSubtle }}
      onPress={onPress}
    >
      <Text className="text-base font-semibold text-ink">{label}</Text>
      {subtitle ? (
        <Text className="mt-0.5 text-xs text-stone-500">{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

export default function DevLauncherScreen({ navigation }) {
  const { loadDevFixture } = useSearchFlow();

  function goTo(screen, params) {
    navigation.navigate(screen, params);
  }

  function goWithMock(scene, screen, params) {
    loadDevFixture(scene);
    navigation.navigate(screen, params);
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1"
      style={{ backgroundColor: appThemeTokens.appBackground }}
    >
      <ScrollView
        contentContainerStyle={{ gap: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
      >
        <View className="gap-1">
          <Text className="text-2xl font-semibold text-ink">Dev Launcher</Text>
          <Text className="text-sm text-stone-500">Jump to any screen with mock data.</Text>
        </View>

        <Section title="Search flow">
          <NavButton
            label="Search"
            subtitle="Entry screen — no mock needed"
            onPress={() => goTo("Search")}
          />
          <NavButton
            label="FollowUp"
            subtitle="Mock: query + refinement prompt loaded"
            onPress={() => goWithMock("followup", "FollowUp")}
          />
          <NavButton
            label="Results"
            subtitle="Mock: 6 picks loaded"
            onPress={() => goWithMock("results", "Results")}
          />
          <NavButton
            label="SearchResultDetail"
            subtitle="Mock: pick 1 of 6 (Herman Miller Aeron)"
            onPress={() => {
              loadDevFixture("detail");
              const { MOCK_FINAL_RESULTS } = require("../dev/devFixtures");
              const item = MOCK_FINAL_RESULTS[0];
              navigation.navigate("SearchResultDetail", { candidateId: item.id, item, rank: 1 });
            }}
          />
        </Section>

        <Section title="Settings & info">
          <NavButton label="Settings" onPress={() => goTo("Settings")} />
          <NavButton label="Region" onPress={() => goTo("Region")} />
          <NavButton label="About" onPress={() => goTo("About")} />
          <NavButton label="Contact" onPress={() => goTo("Contact")} />
          <NavButton label="Privacy" onPress={() => goTo("Privacy")} />
          <NavButton label="AffiliateDisclosure" onPress={() => goTo("AffiliateDisclosure")} />
        </Section>

        <Section title="Other">
          <NavButton
            label="Home"
            subtitle="Marketing / info screen"
            onPress={() => goTo("Home")}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
