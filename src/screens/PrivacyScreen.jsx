import { Linking, Pressable, Text, useWindowDimensions, View } from "react-native";
import { ScreenContainer, ScreenIntro } from "../components/MobileUI";

export default function PrivacyScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 400;

  return (
    <ScreenContainer
      contentContainerStyle={{
        paddingHorizontal: isCompact ? 16 : 24,
        paddingVertical: isCompact ? 24 : 32,
      }}
    >
      <ScreenIntro
        eyebrow="Privacy Policy"
        title="How information is handled in this app."
        description="This is a simple privacy policy for the current version of Focamai and will be updated as the app adds more features."
      />

      <View className="mt-8 gap-5">
        <Text className="text-base leading-7 text-stone-600">
          Focamai lets you enter product topics and optional refinement notes to generate shopping
          shortlists. That information is used to operate the guided search flow, help refine the
          final shortlist, and improve the reliability of the experience.
        </Text>
        <Text className="text-base leading-7 text-stone-600">
          Search requests pass through third-party services that power product search, AI
          refinement, and storage for the app. Basic analytics and hosting logs may also be
          collected to diagnose issues and improve performance.
        </Text>
        <Text className="text-base leading-7 text-stone-600">
          Focamai participates in the Amazon Associates affiliate program. When you follow a product
          link to Amazon, Amazon may set cookies on your device to attribute any resulting purchase
          for commission purposes. This is standard affiliate tracking and is covered by{" "}
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
        <Text className="text-base leading-7 text-stone-600">
          Focamai does not currently offer user accounts, and it does not ask you to submit payment
          information through the app.
        </Text>
      </View>
    </ScreenContainer>
  );
}
