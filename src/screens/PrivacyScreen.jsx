import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
      >
        <Text className="text-xs font-medium uppercase tracking-widest text-accent">
          Privacy Policy
        </Text>
        <Text className="mt-3 text-3xl font-semibold leading-tight text-ink">
          How information is handled in this app.
        </Text>
        <Text className="mt-3 text-base leading-6 text-slate-500">
          This is a simple privacy policy for the current version of Focamai and will be updated as
          the app adds more features.
        </Text>

        <View className="mt-8 gap-5">
          <Text className="text-base leading-7 text-slate-600">
            Focamai lets you enter product topics and optional refinement notes to generate shopping
            shortlists. That information is used to operate the guided search flow, help refine the
            final shortlist, and improve the reliability of the experience.
          </Text>
          <Text className="text-base leading-7 text-slate-600">
            Search requests pass through third-party services that power product search, AI
            refinement, and storage for the app. Basic analytics and hosting logs may also be
            collected to diagnose issues and improve performance.
          </Text>
          <Text className="text-base leading-7 text-slate-600">
            Focamai participates in the Amazon Associates affiliate program. When you follow a
            product link to Amazon, Amazon may set cookies on your device to attribute any resulting
            purchase for commission purposes. This is standard affiliate tracking and is covered by{" "}
            <Pressable
              onPress={() =>
                Linking.openURL(
                  "https://www.amazon.com/gp/help/customer/display.html?nodeId=468496",
                )
              }
            >
              <Text className="text-accent underline underline-offset-4">
                Amazon's own privacy policy
              </Text>
            </Pressable>
            .
          </Text>
          <Text className="text-base leading-7 text-slate-600">
            Focamai does not currently offer user accounts, and it does not ask you to submit
            payment information through the app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
