import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
      >
        <Text className="text-xs font-medium uppercase tracking-widest text-accent">
          Why Focamai
        </Text>
        <Text className="mt-3 text-3xl font-semibold leading-tight text-ink">
          Find what you need.{"\n"}Get on with your day.
        </Text>

        <View className="mt-8 gap-5">
          <Text className="text-base leading-7 text-slate-600">
            Most product search is built to keep you searching. Sponsored results, endless
            recommendations, filters that multiply instead of narrow — none of it is designed to get
            you out the door. It's designed to keep you inside.
          </Text>
          <Text className="text-base leading-7 text-slate-600">
            You feel it even if you've never said it out loud. You went in for one thing. Twenty
            minutes later you're less sure than when you started.
          </Text>
          <Text className="text-base leading-7 text-slate-600">
            Focamai is built on a different assumption: you have something you need, and your time
            is worth something. Describe what you're looking for. Answer one question. Get a short
            list of picks chosen for your situation — each one with an honest explanation of why it
            made the cut and where it falls short.
          </Text>
          <Text className="text-base leading-7 text-slate-600">
            That's the whole experience. Find what you need and move on.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
