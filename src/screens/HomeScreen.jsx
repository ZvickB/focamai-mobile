import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://focamai.com";

async function readDiscoveryResponse(response, requestStartedAt) {
  const rawBody = await response.text();
  const contentType = response.headers?.get?.("content-type") || "";
  let payload = {};

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      const bodyPreview = rawBody.trim().slice(0, 120);
      const receivedHtml = contentType.includes("text/html") || /^<!doctype html/i.test(bodyPreview);

      throw new Error(
        receivedHtml
          ? "The server returned HTML instead of JSON. Check EXPO_PUBLIC_API_BASE_URL."
          : "The server returned an invalid response.",
      );
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || "Discovery request failed.");
  }

  return {
    ...payload,
    clientTimingMs: Date.now() - requestStartedAt,
  };
}

export default function HomeScreen({ navigation }) {
  const [productQuery, setProductQuery] = useState("");
  const [discoverySummary, setDiscoverySummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);

  async function handleDiscoverySearch() {
    const normalizedQuery = productQuery.trim();

    if (!normalizedQuery) {
      setErrorMessage("Enter a product query first.");
      setDiscoverySummary(null);
      return;
    }

    setIsDiscovering(true);
    setErrorMessage("");
    setDiscoverySummary(null);

    try {
      const requestStartedAt = Date.now();
      const response = await fetch(
        `${API_BASE_URL}/api/search/rainforest-discover?query=${encodeURIComponent(normalizedQuery)}`,
      );
      const payload = await readDiscoveryResponse(response, requestStartedAt);
      const candidates = Array.isArray(payload.candidatePool?.candidates)
        ? payload.candidatePool.candidates
        : [];
      const previewResults = Array.isArray(payload.previewResults) ? payload.previewResults : [];

      setDiscoverySummary({
        candidateCount: candidates.length,
        discoveryToken: payload.discoveryToken || "",
        previewCount: previewResults.length,
        query: normalizedQuery,
        source: payload.source || "unknown",
        timingMs: payload.clientTimingMs,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to run discovery.");
    } finally {
      setIsDiscovering(false);
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
              disabled={isDiscovering}
              onPress={handleDiscoverySearch}
              className={`rounded-2xl px-4 py-3 ${isDiscovering ? "bg-slate-300" : "bg-accent"}`}
            >
              <Text className="text-sm font-semibold text-white">
                {isDiscovering ? "Searching..." : "Test discovery"}
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
              Backend wiring: discovery only
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-700">
              API base: {API_BASE_URL}
            </Text>
            {errorMessage ? (
              <Text className="mt-3 text-sm leading-5 text-red-600">{errorMessage}</Text>
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
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
