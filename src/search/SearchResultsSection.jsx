import { Text, View } from "react-native";
import { FocusedPickRow, PreviewResultRow } from "./SearchResultRows";

export function SearchResultsSection({ finalResults, onOpenResult, previewItems }) {
  const hasPreview = previewItems.length > 0;
  const hasFocusedPicks = finalResults.length > 0;

  if (!hasPreview && !hasFocusedPicks) {
    return null;
  }

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <View>
        <Text className="text-sm font-semibold text-slate-900">Results checkpoint</Text>
        <Text className="mt-1 text-sm leading-5 text-slate-600">
          Preview results show the early discovery shape. Focused picks are the capped shortlist.
        </Text>
      </View>

      {hasPreview ? (
        <View className={hasFocusedPicks ? "mt-4 border-b border-line pb-3" : "mt-4"}>
          <Text className="text-xs font-semibold uppercase text-slate-500">Discovery preview</Text>
          <View className="mt-1">
            {previewItems.map((item, index) => (
              <PreviewResultRow key={item.id} item={item} index={index} />
            ))}
          </View>
        </View>
      ) : null}

      {hasFocusedPicks ? (
        <View className="mt-4" testID="results.focusedPicks">
          <Text className="text-xs font-semibold uppercase text-slate-500">
            Focused picks ({finalResults.length}/6)
          </Text>
          <View className="mt-3 gap-3">
            {finalResults.map((item, index) => (
              <FocusedPickRow
                key={item.id}
                item={item}
                index={index}
                onPress={() => onOpenResult(item, index)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
