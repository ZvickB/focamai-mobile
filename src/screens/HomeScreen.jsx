import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  discoverProducts,
  finalizeSearch,
  getApiBaseUrl,
  getRefinementPrompt,
  normalizeFinalResults,
  normalizePreviewResults,
} from "../search/searchApi";

const apiBaseUrl = getApiBaseUrl();

function formatRatingLabel(rating) {
  if (rating === null || rating === undefined || rating === "") {
    return "Rating not shown";
  }

  return `${rating} rating`;
}

function formatReviewCountLabel(reviewCount) {
  if (reviewCount === null || reviewCount === undefined || reviewCount === "") {
    return "Reviews not shown";
  }

  return `${reviewCount} reviews`;
}

export default function HomeScreen({ navigation }) {
  const [productQuery, setProductQuery] = useState("");
  const [discoverySummary, setDiscoverySummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [finalResults, setFinalResults] = useState([]);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState(null);
  const previewItems = Array.isArray(discoverySummary?.previewItems)
    ? discoverySummary.previewItems
    : [];

  async function handleDiscoverySearch() {
    const normalizedQuery = productQuery.trim();

    if (!normalizedQuery) {
      setErrorMessage("Enter a product query first.");
      setDiscoverySummary(null);
      return;
    }

    setIsDiscovering(true);
    setIsGeneratingPrompt(true);
    setErrorMessage("");
    setDiscoverySummary(null);
    setFinalResults([]);
    setFollowUpNotes("");
    setRefinementPrompt(null);

    try {
      const [discoveryResult, refinementResult] = await Promise.allSettled([
        discoverProducts({ query: normalizedQuery }),
        getRefinementPrompt({ query: normalizedQuery }),
      ]);

      if (discoveryResult.status !== "fulfilled") {
        throw discoveryResult.reason;
      }

      const discoveryPayload = discoveryResult.value;
      const candidates = Array.isArray(discoveryPayload.candidatePool?.candidates)
        ? discoveryPayload.candidatePool.candidates
        : [];
      const previewResults = Array.isArray(discoveryPayload.previewResults)
        ? discoveryPayload.previewResults
        : [];

      setDiscoverySummary({
        candidateCount: candidates.length,
        discoveryToken: discoveryPayload.discoveryToken || "",
        previewCount: previewResults.length,
        previewItems: normalizePreviewResults(previewResults),
        query: normalizedQuery,
        source: discoveryPayload.source || "unknown",
        timingMs: discoveryPayload.clientTimingMs,
      });

      if (refinementResult.status === "fulfilled") {
        const refinementPayload = refinementResult.value;

        setRefinementPrompt({
          followUpPlaceholder:
            refinementPayload.followUpPlaceholder ||
            "Add budget, size, must-haves, dealbreakers, or how you plan to use it.",
          helperText: refinementPayload.helperText || "",
          prompt: refinementPayload.prompt || "What should we optimize for?",
          timingMs: refinementPayload.clientTimingMs,
        });
      } else {
        setErrorMessage("Discovery worked, but the follow-up question did not load yet.");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to run discovery.");
    } finally {
      setIsDiscovering(false);
      setIsGeneratingPrompt(false);
    }
  }

  async function handleFinalizeSearch() {
    if (!discoverySummary?.discoveryToken || !discoverySummary?.query || isFinalizing) {
      return;
    }

    setIsFinalizing(true);
    setErrorMessage("");
    setFinalResults([]);

    try {
      const payload = await finalizeSearch({
        discoveryToken: discoverySummary.discoveryToken,
        followUpNotes,
        query: discoverySummary.query,
      });

      setFinalResults(normalizeFinalResults(payload.results));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to finalize results.");
    } finally {
      setIsFinalizing(false);
    }
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
          <Text className="mt-3 text-center text-3xl font-semibold text-ink">Clean Mobile Start</Text>
          <Text className="mt-3 text-center text-base leading-6 text-slate-600">
            A small Expo shell is ready. The old guided-search/debug logic has been removed so the
            mobile rebuild can start from a calmer baseline.
          </Text>

          <View className="mt-5">
            <Text className="mb-2 text-sm font-medium text-slate-800">Product query</Text>
            <TextInput
              value={productQuery}
              onChangeText={setProductQuery}
              onSubmitEditing={handleDiscoverySearch}
              placeholder="Example: travel stroller"
              returnKeyType="search"
              className="rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
            />
          </View>

          <View className="mt-5 flex-row flex-wrap gap-3">
            <Pressable
              disabled={isDiscovering || isGeneratingPrompt}
              onPress={handleDiscoverySearch}
              className={`rounded-2xl px-4 py-3 ${
                isDiscovering || isGeneratingPrompt ? "bg-slate-300" : "bg-accent"
              }`}
            >
              <Text className="text-sm font-semibold text-white">
                {isDiscovering || isGeneratingPrompt ? "Searching..." : "Test discovery"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("About")}
              className="rounded-2xl border border-line bg-white px-4 py-3"
            >
              <Text className="text-sm font-semibold text-slate-800">About</Text>
            </Pressable>
          </View>

          <View className="mt-5 rounded-2xl border border-line bg-white px-4 py-4">
            <Text className="text-sm font-medium text-slate-800">Status snapshot</Text>
            <Text className="mt-2 text-sm leading-5 text-slate-700">
              Draft query: {productQuery || "none"}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              Backend wiring: discovery, refine, and finalize scaffold
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              API base: {apiBaseUrl || "not set"}
            </Text>
            {errorMessage ? (
              <Text className="mt-3 text-sm leading-5 text-red-600">{errorMessage}</Text>
            ) : null}
            {isGeneratingPrompt ? (
              <Text className="mt-3 text-sm leading-5 text-slate-700">Generating follow-up...</Text>
            ) : null}
            {isFinalizing ? (
              <Text className="mt-3 text-sm leading-5 text-slate-700">Finalizing focused picks...</Text>
            ) : null}
            {discoverySummary ? (
              <View className="mt-3 rounded-xl bg-mist px-3 py-3">
                <Text className="text-sm font-medium text-slate-800">
                  Discovery returned for "{discoverySummary.query}"
                </Text>
                <Text className="mt-2 text-sm leading-5 text-slate-700">
                  Candidates: {discoverySummary.candidateCount}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-slate-700">
                  Preview results: {discoverySummary.previewCount}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-slate-700">
                  Source: {discoverySummary.source}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-slate-700">
                  Client timing: {discoverySummary.timingMs}ms
                </Text>
                <Text className="mt-1 text-sm leading-5 text-slate-700">
                  Token: {discoverySummary.discoveryToken ? "received" : "missing"}
                </Text>
                {previewItems.length > 0 ? (
                  <View className="mt-3">
                    <Text className="text-sm font-medium text-slate-800">Tiny preview</Text>
                    {previewItems.map((item, index) => (
                      <View key={item.id} className="mt-2 rounded-xl border border-line bg-white px-3 py-3">
                        <Text className="text-sm font-semibold text-slate-900">
                          {index + 1}. {item.title}
                        </Text>
                        <Text className="mt-1 text-sm leading-5 text-slate-700">
                          {item.provider} | {item.price}
                        </Text>
                        <Text className="mt-1 text-sm leading-5 text-slate-700">
                          Rating: {item.rating ?? "not shown"}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            {refinementPrompt ? (
              <View className="mt-3 rounded-xl border border-line bg-white px-3 py-3">
                <Text className="text-sm font-medium text-slate-800">Follow-up question</Text>
                <Text className="mt-2 text-sm leading-5 text-slate-800">{refinementPrompt.prompt}</Text>
                {refinementPrompt.helperText ? (
                  <Text className="mt-2 text-sm leading-5 text-slate-600">
                    {refinementPrompt.helperText}
                  </Text>
                ) : null}
                <TextInput
                  value={followUpNotes}
                  onChangeText={setFollowUpNotes}
                  placeholder={refinementPrompt.followUpPlaceholder}
                  multiline
                  textAlignVertical="top"
                  className="mt-3 min-h-[92px] rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
                />
                <Text className="mt-2 text-sm leading-5 text-slate-600">
                  Refine timing: {refinementPrompt.timingMs}ms
                </Text>
                <Pressable
                  disabled={isFinalizing || !discoverySummary?.discoveryToken}
                  onPress={handleFinalizeSearch}
                  className={`mt-3 rounded-2xl px-4 py-3 ${
                    isFinalizing || !discoverySummary?.discoveryToken ? "bg-slate-300" : "bg-slate-800"
                  }`}
                >
                  <Text className="text-center text-sm font-semibold text-white">
                    {isFinalizing ? "Finalizing..." : "Show focused picks"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {finalResults.length > 0 ? (
              <View className="mt-3 rounded-xl border border-line bg-white px-3 py-3">
                <Text className="text-sm font-medium text-slate-800">
                  Final results: {finalResults.length}
                </Text>
                {finalResults.map((item, index) => (
                  <View key={item.id} className="mt-3 rounded-2xl border border-line bg-mist px-3 py-3">
                    <View className="flex-row gap-3">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <Text className="text-sm font-semibold text-white">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold leading-5 text-slate-900">
                          {item.title}
                        </Text>
                        <Text className="mt-1 text-sm leading-5 text-slate-700">{item.provider}</Text>
                      </View>
                    </View>
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {[item.price, formatRatingLabel(item.rating), formatReviewCountLabel(item.reviewCount)].map(
                        (label) => (
                          <View key={label} className="rounded-full border border-line bg-white px-3 py-1">
                            <Text className="text-xs font-medium text-slate-700">{label}</Text>
                          </View>
                        ),
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
