import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
      >
        <Text className="text-xs font-medium uppercase tracking-widest text-accent">
          Contact
        </Text>
        <Text className="mt-3 text-3xl font-semibold leading-tight text-ink">
          Questions, feedback, or corrections.
        </Text>
        <Text className="mt-3 text-base leading-6 text-slate-500">
          If you want to get in touch about the app, content, or future partnership questions, this
          is the starting point.
        </Text>

        <View className="mt-8 gap-5">
          <Pressable onPress={() => Linking.openURL("mailto:contact@focamai.com")}>
            <Text className="text-base font-medium text-accent underline underline-offset-4">
              contact@focamai.com
            </Text>
          </Pressable>
          <Text className="text-base leading-7 text-slate-600">
            This address is intended for general questions, feedback about app content, and
            correction requests if something needs updating.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
