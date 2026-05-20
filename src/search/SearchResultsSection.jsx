import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SectionHeader, Surface } from "../components/MobileUI";
import { AffiliateDisclosureNote } from "./AffiliateDisclosureNote";
import { FocusedPickRow, PreviewResultRow } from "./SearchResultRows";

export function SearchResultsSection({
  finalResults = [],
  isFinalizing = false,
  onOpenResult,
  previewItems = [],
  showEmptyState = false,
}) {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const safeFinalResults = Array.isArray(finalResults) ? finalResults : [];
  const safePreviewItems = Array.isArray(previewItems) ? previewItems : [];
  const hasPreview = safePreviewItems.length > 0;
  const hasFocusedPicks = safeFinalResults.length > 0;

  if (!hasPreview && !hasFocusedPicks) {
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
    <View className="gap-4">
      {hasFocusedPicks ? (
        <View className="gap-3">
          {safeFinalResults.length < 6 ? (
            <Text className="px-1 text-sm leading-5 text-stone-600">
              {safeFinalResults.length} credible option
              {safeFinalResults.length === 1 ? "" : "s"} came back for this search. That can happen
              when fewer results look credible for your needs.
            </Text>
          ) : null}

          <View className="gap-3" testID="results.focusedPicks">
            {safeFinalResults.map((item, index) => (
              <FocusedPickRow
                key={item.id}
                item={item}
                index={index}
                onPress={() => onOpenResult(item, index)}
              />
            ))}
          </View>

          <Surface variant="quiet">
            <Text className="text-base font-semibold text-ink">Why these picks?</Text>
            <Text className="mt-1 text-sm leading-5 text-stone-600">
              Focamai narrows the list around your search and notes, then keeps the set short so
              each option is worth a closer look.
            </Text>
            <View className="mt-3 border-t border-line pt-3">
              <Text className="text-xs leading-4 text-stone-500">
                Retailer availability and pricing can change.
              </Text>
              <AffiliateDisclosureNote />
            </View>
          </Surface>
        </View>
      ) : null}

      {hasPreview ? (
        <Surface variant="quiet" className={hasFocusedPicks ? "py-4" : ""}>
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-[1px] text-stone-500">
                Early preview
              </Text>
              <Text className="mt-1 text-sm leading-5 text-stone-600">
                {hasFocusedPicks
                  ? "Discovery candidates are kept here for context."
                  : "Initial candidates will be narrowed into focused picks."}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPreviewVisible ? "Hide early preview" : "Show early preview"}
              onPress={() => setIsPreviewVisible((current) => !current)}
              className="min-h-[40px] items-center justify-center rounded-full border border-line bg-white px-3 py-2"
            >
              <Text className="text-sm font-semibold text-accent">
                {isPreviewVisible ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {isPreviewVisible ? (
            <View className="mt-3 border-t border-line pt-1">
              {safePreviewItems.map((item, index) => (
                <PreviewResultRow key={item.id} item={item} index={index} />
              ))}
            </View>
          ) : null}
        </Surface>
      ) : null}
    </View>
  );
}
