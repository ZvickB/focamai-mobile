import { Text, View } from "react-native";
import { SectionHeader, Surface } from "../components/MobileUI";
import { FocusedPickRow } from "./SearchResultRows";

export function SearchResultsSection({
  finalResults = [],
  isFinalizing = false,
  onFocusedPicksLayout,
  onOpenResult,
  onResultsLayout,
  onRowLayout,
  selectedIndex = 0,
  showEmptyState = false,
}) {
  const safeFinalResults = Array.isArray(finalResults) ? finalResults : [];
  const hasFocusedPicks = safeFinalResults.length > 0;

  if (!hasFocusedPicks) {
    if (showEmptyState) {
      return (
        <Surface variant="quiet">
          <SectionHeader
            eyebrow="Shortlist"
            title={isFinalizing ? "Shortlist is still building" : "No focused picks yet"}
            description={
              isFinalizing
                ? "Focamai is narrowing the options now. The shortlist will appear here when it is ready."
                : "If nothing appears after a search finishes, try a more specific product phrase or add a must-have in the follow-up step."
            }
          />
        </Surface>
      );
    }

    return null;
  }

  return (
    <View className="gap-4" onLayout={onResultsLayout} testID="results.section">
      <View className="gap-3">
        {safeFinalResults.length < 6 ? (
          <Text className="px-1 text-sm leading-5 text-stone-600">
            {safeFinalResults.length} credible option
            {safeFinalResults.length === 1 ? "" : "s"} came back for this search. That can happen
            when fewer results look credible for your needs.
          </Text>
        ) : null}

        <View
          className="overflow-hidden border-y border-line"
          onLayout={onFocusedPicksLayout}
          testID="results.focusedPicks"
        >
          {safeFinalResults.map((item, index) => (
            <FocusedPickRow
              isLast={index === safeFinalResults.length - 1}
              isSelected={index === selectedIndex}
              key={item.id}
              item={item}
              index={index}
              onLayout={(event) => onRowLayout?.(index, event)}
              onPress={() => onOpenResult(item, index)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
