import { Pressable, Text, View } from "react-native";

import { HeaderBackButton, ScreenContainer } from "../components/MobileUI";
import {
  sendSentryVerificationError,
  sendSentryVerificationTransaction,
} from "../lib/sentry";

function VerificationButton({ label, onPress, testID }) {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-[48px] items-center justify-center rounded-[18px] bg-accent px-5"
      onPress={onPress}
      testID={testID}
    >
      <Text className="text-sm font-semibold text-white">{label}</Text>
    </Pressable>
  );
}

export default function SentryVerificationScreen({ navigation }) {
  return (
    <ScreenContainer
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}
      testID="sentryVerification.screen"
    >
      <HeaderBackButton label="Settings" onPress={() => navigation.goBack()} />
      <View className="mt-8 gap-4">
        <Text className="text-[28px] font-semibold leading-[35px] text-ink">
          Sentry verification
        </Text>
        <Text className="text-[15px] leading-6 text-stone-600">
          Temporary internal-build tools. They send one clearly labeled test error and one
          performance transaction; neither records screens, input, or a replay.
        </Text>
        <VerificationButton
          label="Send test error"
          onPress={sendSentryVerificationError}
          testID="sentryVerification.error"
        />
        <VerificationButton
          label="Send performance transaction"
          onPress={sendSentryVerificationTransaction}
          testID="sentryVerification.transaction"
        />
        <Text className="text-sm leading-5 text-stone-500">
          Opening this screen also verifies a Sentry navigation transaction. Restart the installed
          app before testing to generate an app-start measurement.
        </Text>
      </View>
    </ScreenContainer>
  );
}
