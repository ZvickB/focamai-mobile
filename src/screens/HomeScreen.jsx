import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchEntrySection } from "../search/SearchEntrySection";
import { SearchProgressStatus } from "../search/SearchProgressStatus";
import { SearchRefineSection } from "../search/SearchRefineSection";
import { SearchResultsSection } from "../search/SearchResultsSection";
import { useMobileSearchController } from "../search/useMobileSearchController";

export default function HomeScreen({ navigation }) {
  const {
    canFinalize,
    discoverySummary,
    errorMessage,
    finalResults,
    finalizeFocusedPicks,
    followUpNotes,
    hasStartedSearch,
    isDiscovering,
    isFinalizing,
    isGeneratingPrompt,
    previewItems,
    productQuery,
    refinementPrompt,
    setFollowUpNotes,
    setProductQuery,
    startDiscoverySearch,
  } = useMobileSearchController();

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className="text-[12px] font-medium uppercase tracking-[2px] text-accent">
            Focama Mobile
          </Text>
          <Text className="mt-2 text-3xl font-semibold text-ink">Find focused options</Text>
          <Text className="mt-3 text-base leading-6 text-slate-600">
            Search once, add a little context, then ask for a short list. This is still the plain
            verification flow while the mobile data path settles.
          </Text>
        </View>

        <SearchEntrySection
          isDiscovering={isDiscovering}
          onAboutPress={() => navigation.navigate("About")}
          productQuery={productQuery}
          setProductQuery={setProductQuery}
          startDiscoverySearch={startDiscoverySearch}
        />

        <SearchProgressStatus
          discoverySummary={discoverySummary}
          errorMessage={errorMessage}
          hasStartedSearch={hasStartedSearch}
          isFinalizing={isFinalizing}
          isGeneratingPrompt={isGeneratingPrompt}
          productQuery={productQuery}
          refinementPrompt={refinementPrompt}
        />

        <SearchResultsSection
          finalResults={finalResults}
          onOpenResult={(item, index) =>
            navigation.navigate("SearchResultDetail", {
              item,
              rank: index + 1,
            })
          }
          previewItems={previewItems}
        />

        <SearchRefineSection
          canFinalize={canFinalize}
          finalizeFocusedPicks={finalizeFocusedPicks}
          followUpNotes={followUpNotes}
          isFinalizing={isFinalizing}
          refinementPrompt={refinementPrompt}
          setFollowUpNotes={setFollowUpNotes}
        />

      </ScrollView>
    </SafeAreaView>
  );
}
