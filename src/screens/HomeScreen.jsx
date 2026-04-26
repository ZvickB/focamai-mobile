import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSearchProgress } from "../contexts/SearchProgressContext";
import { useGuidedSearch } from "../components/home/useGuidedSearch";

export default function HomeScreen({ navigation }) {
  const { progress } = useSearchProgress();
  const {
    beginGuidedSearch,
    candidatePool,
    discoveryToken,
    errorMessage,
    finalResults,
    followUpNotes,
    handleFinalizeRefinement,
    handleProbeFinalizeRequest,
    handleProbeSimpleFinalizeRoute,
    handleRetryWithFeedback,
    handleSelectProduct,
    handleShowProductsNow,
    hasDiscoveryResults,
    hasFinalResults,
    isDiscovering,
    isEnrichmentReady,
    isFinalizing,
    isGeneratingPrompt,
    previewResults,
    productQuery,
    queryFramingFields,
    requestTiming,
    refinementPrompt,
    resetToNewSearch,
    retryCount,
    retryFeedback,
    selectedProduct,
    setFollowUpNotes,
    setProductQuery,
    setRetryFeedback,
    showPreviewResults,
    submittedAmazonDomain,
    submittedQuery,
  } = useGuidedSearch();
  const progressMessage = progress.hasFinalResults
    ? "Final results are available."
    : progress.hasDiscoveryResults
      ? "Discovery results are available."
      : progress.hasStartedSearch
        ? "A search has started."
        : "Phase 3 shared plumbing is ready.";
  const canRetry = retryFeedback.trim().length > 0 && retryCount < 2 && hasFinalResults;
  const canStartSearch = !isDiscovering && !isGeneratingPrompt && productQuery.trim().length > 0;
  const canShowPreview = !isFinalizing && previewResults.length > 0;
  const canFinalize = !isFinalizing && Boolean(candidatePool) && Boolean(submittedQuery);
  const visibleResults = hasFinalResults ? finalResults : showPreviewResults ? previewResults : [];
  const framingTradeoffCount = Array.isArray(queryFramingFields?.tradeoffAxes)
    ? queryFramingFields.tradeoffAxes.length
    : 0;
  const framingSummary = queryFramingFields
    ? `category ${queryFramingFields.categoryHint || "unknown"} | tradeoff axes ${framingTradeoffCount}`
    : "pending or disabled";
  const currentAction = isFinalizing
    ? "Finalizing shortlist..."
    : isDiscovering
      ? "Loading discovery..."
      : isGeneratingPrompt
        ? "Generating follow-up prompt..."
        : "Idle";

  function formatTimingSection(label, timing) {
    if (!timing) {
      return `${label}: pending`;
    }

    const serverTimingKeys = Object.entries(timing.server || {})
      .filter(([, value]) => value != null)
      .map(([key, value]) => `${key} ${value}ms`)
      .join(", ");

    return `${label}: client ${timing.client?.totalMs ?? "?"}ms${serverTimingKeys ? ` | server ${serverTimingKeys}` : ""}`;
  }

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="rounded-[28px] border border-line bg-white px-5 py-6 shadow-sm">
          <Text className="text-center text-[12px] font-medium uppercase tracking-[2px] text-accent">
            Focama Mobile
          </Text>
          <Text className="mt-3 text-center text-3xl font-semibold text-ink">Phase 3 Harness</Text>
          <Text className="mt-3 text-center text-base leading-6 text-slate-600">
            This screen is intentionally plain. It is only here to verify guided search behavior in Expo
            Go before any Phase 4 UI port starts.
          </Text>

          <View className="mt-5 rounded-2xl bg-mist px-4 py-4">
            <Text className="text-sm font-medium text-slate-800">Progress</Text>
            <Text className="mt-2 text-sm leading-5 text-slate-700">{progressMessage}</Text>
            <Text className="mt-2 text-sm leading-5 text-slate-700">Current action: {currentAction}</Text>
          </View>

          <View className="mt-5">
            <Text className="mb-2 text-sm font-medium text-slate-800">Product query</Text>
            <TextInput
              value={productQuery}
              onChangeText={setProductQuery}
              placeholder="Example: travel stroller"
              returnKeyType="search"
              onSubmitEditing={() => {
                if (canStartSearch) {
                  beginGuidedSearch();
                }
              }}
              className="rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
            />
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-slate-800">Follow-up notes</Text>
            <TextInput
              value={followUpNotes}
              onChangeText={setFollowUpNotes}
              placeholder={refinementPrompt?.followUpPlaceholder || "Optional follow-up details"}
              multiline
              textAlignVertical="top"
              className="min-h-[100px] rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
            />
          </View>

          <View className="mt-4">
            <Text className="mb-2 text-sm font-medium text-slate-800">Retry feedback</Text>
            <TextInput
              value={retryFeedback}
              onChangeText={setRetryFeedback}
              placeholder="What should be different in the next shortlist?"
              multiline
              textAlignVertical="top"
              className="min-h-[84px] rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
            />
          </View>

          <View className="mt-5 flex-row flex-wrap gap-3">
            <Pressable
              onPress={beginGuidedSearch}
              disabled={!canStartSearch}
              className={`rounded-2xl px-4 py-3 ${canStartSearch ? "bg-accent" : "bg-slate-300"}`}
            >
              <Text className="text-sm font-semibold text-white">
                {isDiscovering || isGeneratingPrompt ? "Starting..." : "Start search"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleShowProductsNow}
              disabled={!canShowPreview}
              className={`rounded-2xl px-4 py-3 ${canShowPreview ? "bg-slate-800" : "bg-slate-300"}`}
            >
              <Text className="text-sm font-semibold text-white">Show products now</Text>
            </Pressable>
            <Pressable
              onPress={handleFinalizeRefinement}
              disabled={!canFinalize}
              className={`rounded-2xl px-4 py-3 ${canFinalize ? "bg-emerald-600" : "bg-slate-300"}`}
            >
              <Text className="text-sm font-semibold text-white">
                {isFinalizing ? "Finalizing..." : "Show focused picks"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleProbeFinalizeRequest}
              className="rounded-2xl bg-sky-600 px-4 py-3"
            >
              <Text className="text-sm font-semibold text-white">Probe finalize</Text>
            </Pressable>
            <Pressable
              onPress={handleProbeSimpleFinalizeRoute}
              className="rounded-2xl bg-cyan-700 px-4 py-3"
            >
              <Text className="text-sm font-semibold text-white">Probe simple route</Text>
            </Pressable>
            <Pressable
              onPress={handleRetryWithFeedback}
              disabled={!canRetry}
              className={`rounded-2xl px-4 py-3 ${canRetry ? "bg-amber-500" : "bg-slate-300"}`}
            >
              <Text className="text-sm font-semibold text-white">Retry with feedback</Text>
            </Pressable>
            <Pressable onPress={resetToNewSearch} className="rounded-2xl bg-white px-4 py-3 border border-line">
              <Text className="text-sm font-semibold text-slate-800">Reset</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("About")}
              className="rounded-2xl bg-white px-4 py-3 border border-line"
            >
              <Text className="text-sm font-semibold text-slate-800">About</Text>
            </Pressable>
          </View>

          {errorMessage ? (
            <View className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
              <Text className="text-sm font-medium text-red-700">Error</Text>
              <Text className="mt-2 text-sm leading-5 text-red-700">{errorMessage}</Text>
            </View>
          ) : null}

          <View className="mt-5 rounded-2xl border border-line bg-white px-4 py-4">
            <Text className="text-sm font-medium text-slate-800">Status snapshot</Text>
            <Text className="mt-2 text-sm leading-5 text-slate-700">
              Draft query: {productQuery || "none"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Submitted query: {submittedQuery || "none"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Submitted domain: {submittedAmazonDomain || "none"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Discovery token: {discoveryToken ? "present" : "missing"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Candidate pool count: {Array.isArray(candidatePool?.candidates) ? candidatePool.candidates.length : 0}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Prompt text: {refinementPrompt?.prompt || "pending"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Preview result count: {previewResults.length}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Final result count: {finalResults.length}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Finalize in flight: {isFinalizing ? "yes" : "no"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Retry count: {retryCount} / 2
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Preview visible: {showPreviewResults ? "yes" : "no"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Enrichment ready: {isEnrichmentReady ? "yes" : "no"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Context flags: started {progress.hasStartedSearch ? "yes" : "no"}, discovery{" "}
              {progress.hasDiscoveryResults ? "yes" : "no"}, final {progress.hasFinalResults ? "yes" : "no"}
            </Text>
            <Text className="mt-3 text-sm leading-5 text-slate-700">
              {formatTimingSection("Discover", requestTiming.discover)}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              {formatTimingSection("Refine", requestTiming.refine)}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              {formatTimingSection("Framing", requestTiming.framingFields)}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              {formatTimingSection("Finalize", requestTiming.finalize)}
            </Text>
            <Text className="mt-3 text-sm leading-5 text-slate-700">
              Query framing: {framingSummary}
            </Text>
            <Text className="mt-3 text-sm leading-5 text-slate-700">
              Discovery results ready: {hasDiscoveryResults ? "yes" : "no"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Final results ready: {hasFinalResults ? "yes" : "no"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Selected product: {selectedProduct?.title || selectedProduct?.id || "none"}
            </Text>
          </View>

          <View className="mt-5 rounded-2xl border border-line bg-white px-4 py-4">
            <Text className="text-sm font-medium text-slate-800">Results</Text>
            {visibleResults.length === 0 ? (
              <Text className="mt-2 text-sm leading-5 text-slate-700">No results shown yet.</Text>
            ) : (
              visibleResults.map((item, index) => {
                const resultSet = hasFinalResults ? "final" : "preview";

                return (
                  <Pressable
                    key={`${item.id}-${index}`}
                    onPress={() => handleSelectProduct(item, { position: index, resultSet })}
                    className="mt-3 rounded-2xl bg-mist px-4 py-4"
                  >
                    <Text className="text-sm font-semibold text-slate-900">
                      {index + 1}. {item.title || "Untitled result"}
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-700">
                      id: {String(item.id)} | badge: {item.badgeLabel || "none"} | provider:{" "}
                      {item.subtitle || "unknown"}
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-700">
                      price: {item.price || "n/a"} | rating: {item.rating ?? "n/a"} | reviews:{" "}
                      {item.reviewCount ?? "n/a"}
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-700">
                      fit: {item.fit_reason || "pending"}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
