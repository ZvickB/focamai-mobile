import { Linking, Pressable, Text, View } from "react-native";
import { ScreenContainer, ScreenIntro } from "../components/MobileUI";

export default function ContactScreen() {
  return (
    <ScreenContainer contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}>
      <ScreenIntro
        eyebrow="Contact"
        title="Questions, feedback, or corrections."
        description="If you want to get in touch about the app, content, or future partnership questions, this is the starting point."
      />

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
    </ScreenContainer>
  );
}
