import { Text, useWindowDimensions, View } from "react-native";
import { ScreenContainer, ScreenIntro } from "../components/MobileUI";

export default function AboutScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 400;

  return (
    <ScreenContainer
      contentContainerStyle={{
        paddingHorizontal: isCompact ? 16 : 24,
        paddingVertical: isCompact ? 24 : 32,
      }}
    >
      <ScreenIntro eyebrow="Why Focamai" title={"Find what you need.\nGet on with your day."} />

      <View className="mt-8 gap-5">
        <Text className="text-base leading-7 text-stone-600">
          Most product search is built to keep you searching. Sponsored results, endless
          recommendations, filters that multiply instead of narrow -- none of it is designed to get
          you out the door. It's designed to keep you inside.
        </Text>
        <Text className="text-base leading-7 text-stone-600">
          You feel it even if you've never said it out loud. You went in for one thing. Twenty
          minutes later you're less sure than when you started.
        </Text>
        <Text className="text-base leading-7 text-stone-600">
          Focamai is built on a different assumption: you have something you need, and your time is
          worth something. Describe what you're looking for. Answer one question. Get a short list
          of picks chosen for your situation -- each one with an honest explanation of why it made
          the cut and where it falls short.
        </Text>
        <Text className="text-base leading-7 text-stone-600">
          That's the whole experience. Find what you need and move on.
        </Text>
      </View>
    </ScreenContainer>
  );
}
