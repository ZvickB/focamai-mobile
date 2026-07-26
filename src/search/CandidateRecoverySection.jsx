import { Text, View } from "react-native";
import { Button, QuietStatusPanel, Surface } from "../components/MobileUI";

export function CandidateRecoverySection({ candidateRecovery, onFindBetterMatches, onKeepThesePicks }) {
  if (!candidateRecovery?.suggestedQuery) {
    return null;
  }

  const count = candidateRecovery.goodCandidateCount;

  return (
    <Surface className="gap-4" testID="candidateRecovery.section" variant="accent">
      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-[1.1px] text-accent">
          A more precise search may help
        </Text>
        <Text className="text-lg font-semibold leading-6 text-ink">
          These are the strongest matches we found.
        </Text>
        <Text className="text-sm leading-5 text-stone-600">
          {count} credible option{count === 1 ? "" : "s"} fit this search. A sharper phrase could uncover better matches.
        </Text>
      </View>

      <QuietStatusPanel>
        <Text className="text-xs font-semibold uppercase tracking-[1.1px] text-stone-500">
          Suggested search
        </Text>
        <Text className="mt-2 text-base font-semibold leading-6 text-ink">
          {candidateRecovery.suggestedQuery}
        </Text>
      </QuietStatusPanel>

      <View className="gap-2">
        <Button
          accessibilityLabel="Find better matches with the suggested search"
          onPress={onFindBetterMatches}
          testID="candidateRecovery.findBetterMatches"
        >
          Find better matches
        </Button>
        <Button
          accessibilityLabel="Keep these picks"
          onPress={onKeepThesePicks}
          testID="candidateRecovery.keepThesePicks"
          variant="secondary"
        >
          Keep these picks
        </Button>
      </View>
    </Surface>
  );
}
