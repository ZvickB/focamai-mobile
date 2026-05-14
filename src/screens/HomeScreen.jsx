import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiBaseUrl } from "../search/searchApi";
import { useMobileSearchController } from "../search/useMobileSearchController";

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

function StatusLine({ label, value }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-line py-2">
      <Text className="text-sm text-slate-600">{label}</Text>
      <Text className="shrink text-right text-sm font-medium text-slate-900">{value}</Text>
    </View>
  );
}

function PreviewRow({ item, index }) {
  return (
    <View className="border-b border-line py-3">
      <Text className="text-sm font-semibold leading-5 text-slate-900">
        {index + 1}. {item.title}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-slate-700">
        {item.provider} | {item.price}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-slate-600">
        Rating: {item.rating ?? "not shown"}
      </Text>
    </View>
  );
}

function FinalResultRow({ item, index }) {
  return (
    <View className="border-b border-line py-4">
      <View className="flex-row gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Text className="text-sm font-semibold text-white">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold leading-5 text-slate-900">{item.title}</Text>
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
  );
}

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

        <View className="rounded-2xl border border-line bg-white px-4 py-4">
          <Text className="text-sm font-medium text-slate-800">What are you shopping for?</Text>
          <TextInput
            value={productQuery}
            onChangeText={setProductQuery}
            onSubmitEditing={startDiscoverySearch}
            placeholder="Example: travel stroller"
            returnKeyType="search"
            className="mt-3 rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
          />
          <View className="mt-4 flex-row gap-3">
            <Pressable
              disabled={isDiscovering}
              onPress={startDiscoverySearch}
              className={`flex-1 rounded-2xl px-4 py-3 ${
                isDiscovering ? "bg-slate-300" : "bg-accent"
              }`}
            >
              <Text className="text-center text-sm font-semibold text-white">
                {isDiscovering ? "Searching..." : "Search"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("About")}
              className="rounded-2xl border border-line bg-white px-4 py-3"
            >
              <Text className="text-sm font-semibold text-slate-800">About</Text>
            </Pressable>
          </View>
        </View>

        <View className="rounded-2xl border border-line bg-white px-4 py-4">
          <Text className="text-sm font-semibold text-slate-900">Progress</Text>
          <View className="mt-2">
            <StatusLine label="Draft query" value={productQuery || "none"} />
            <StatusLine label="Backend" value="discovery, refine, finalize" />
            <StatusLine label="API base" value={apiBaseUrl ? "configured" : "not set"} />
            {discoverySummary ? (
              <>
                <StatusLine label="Candidates" value={String(discoverySummary.candidateCount)} />
                <StatusLine label="Preview results" value={String(discoverySummary.previewCount)} />
                <StatusLine label="Source" value={discoverySummary.source} />
                <StatusLine label="Discovery timing" value={`${discoverySummary.timingMs}ms`} />
                <StatusLine
                  label="Discovery token"
                  value={discoverySummary.discoveryToken ? "received" : "missing"}
                />
              </>
            ) : null}
            {refinementPrompt ? (
              <StatusLine label="Refine timing" value={`${refinementPrompt.timingMs}ms`} />
            ) : null}
          </View>
          {errorMessage ? (
            <Text className="mt-3 text-sm leading-5 text-red-600">{errorMessage}</Text>
          ) : null}
          {isGeneratingPrompt ? (
            <Text className="mt-3 text-sm leading-5 text-slate-700">Generating follow-up...</Text>
          ) : null}
          {isFinalizing ? (
            <Text className="mt-3 text-sm leading-5 text-slate-700">Finalizing focused picks...</Text>
          ) : null}
          {!hasStartedSearch ? (
            <Text className="mt-3 text-sm leading-5 text-slate-600">
              Start with a simple product query to test the mobile search path.
            </Text>
          ) : null}
        </View>

        {previewItems.length > 0 ? (
          <View className="rounded-2xl border border-line bg-white px-4 py-4">
            <Text className="text-sm font-semibold text-slate-900">Tiny preview</Text>
            <View className="mt-1">
              {previewItems.map((item, index) => (
                <PreviewRow key={item.id} item={item} index={index} />
              ))}
            </View>
          </View>
        ) : null}

        {refinementPrompt ? (
          <View className="rounded-2xl border border-line bg-white px-4 py-4">
            <Text className="text-sm font-semibold text-slate-900">Refine</Text>
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
              className="mt-3 min-h-[96px] rounded-2xl border border-line bg-mist px-4 py-3 text-base text-ink"
            />
            <Pressable
              disabled={!canFinalize}
              onPress={finalizeFocusedPicks}
              className={`mt-3 rounded-2xl px-4 py-3 ${canFinalize ? "bg-slate-800" : "bg-slate-300"}`}
            >
              <Text className="text-center text-sm font-semibold text-white">
                {isFinalizing ? "Finalizing..." : "Show focused picks"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {finalResults.length > 0 ? (
          <View className="rounded-2xl border border-line bg-white px-4 py-4">
            <Text className="text-sm font-semibold text-slate-900">
              Focused picks ({finalResults.length})
            </Text>
            <View className="mt-1">
              {finalResults.map((item, index) => (
                <FinalResultRow key={item.id} item={item} index={index} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
