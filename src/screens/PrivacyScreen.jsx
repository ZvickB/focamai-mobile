import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <View className="flex-1 justify-center px-6">
        <View className="rounded-[28px] border border-line bg-white px-6 py-8 shadow-sm">
          <Text className="text-3xl font-semibold text-ink">Privacy</Text>
          <Text className="mt-4 text-base leading-6 text-slate-600">
            Privacy screen stub is in place for the Phase 2 shell.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
