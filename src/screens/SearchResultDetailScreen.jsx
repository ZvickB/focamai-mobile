import { Image, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import {
  detailValue,
  SearchResultDetailOverview,
  SearchResultDetailMetadata,
  SearchResultDetailSnapshot,
  SearchResultFeatureHighlights,
} from "../search/SearchResultDetailMetadata";
import { AffiliateDisclosureNote } from "../search/AffiliateDisclosureNote";
import { useSearchFlow } from "../search/SearchFlowContext";

function DetailProductImage({ image, title }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!image || hasImageError) {
    return (
      <View className="h-56 items-center justify-center rounded-3xl border border-line bg-white px-8">
        <Text className="text-center text-sm font-semibold uppercase tracking-[1.4px] text-slate-400">
          Image pending
        </Text>
      </View>
    );
  }

  return (
    <View className="h-56 rounded-3xl border border-line bg-white p-4">
      <Image
        accessibilityLabel={title}
        className="h-full w-full rounded-2xl"
        onError={() => setHasImageError(true)}
        resizeMode="contain"
        source={{ uri: image }}
      />
    </View>
  );
}

function openRetailerLink(link) {
  if (!link) {
    return;
  }

  Linking.openURL(link).catch(() => {});
}

function DetailRetailerCta({ item }) {
  const provider = detailValue(item.provider, "the retailer");

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <Text className="text-sm font-semibold text-slate-900">Retailer check</Text>
      <Text className="mt-2 text-sm leading-5 text-slate-600">
        Confirm current price, availability, shipping, and seller details with {provider} before
        buying.
      </Text>
      {item.link ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View ${detailValue(item.title, "this product")} on ${provider}`}
          className="mt-4 items-center rounded-full bg-accent px-4 py-3"
          onPress={() => openRetailerLink(item.link)}
        >
          <Text className="text-base font-semibold text-white">View retailer</Text>
        </Pressable>
      ) : (
        <View className="mt-4 rounded-2xl bg-mist px-4 py-3">
          <Text className="text-sm font-semibold text-slate-600">Retailer link unavailable</Text>
        </View>
      )}
      <Text className="mt-3 text-xs leading-5 text-slate-500">
        Retailer listings can change after Focamai builds the shortlist.
      </Text>
      {item.link ? <AffiliateDisclosureNote className="mt-2" /> : null}
    </View>
  );
}

export default function SearchResultDetailScreen({ route }) {
  const { finalResults } = useSearchFlow();
  const candidateId = route.params?.candidateId;
  const routeItem = route.params?.item;
  const routeRank = route.params?.rank;
  const matchedIndex = candidateId
    ? finalResults.findIndex((result) => String(result.id) === String(candidateId))
    : -1;
  const item = matchedIndex >= 0 ? finalResults[matchedIndex] : routeItem || {};
  const rank = routeRank || (matchedIndex >= 0 ? matchedIndex + 1 : undefined);

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 18 }}
      >
        <View>
          <Text className="text-[12px] font-medium uppercase tracking-[2px] text-accent">
            Focused pick {rank ? `#${rank}` : ""}
          </Text>
          <Text className="mt-2 text-2xl font-semibold leading-8 text-ink">
            {detailValue(item.title, "Untitled product")}
          </Text>
          <Text className="mt-3 text-base leading-6 text-slate-600">
            The key details, fit notes, and caveats from the finalized shortlist.
          </Text>
        </View>

        <DetailProductImage image={item.image} title={detailValue(item.title, "Focused pick")} />
        <SearchResultDetailOverview item={item} rank={rank} />
        <SearchResultFeatureHighlights item={item} />
        <DetailRetailerCta item={item} />
        <SearchResultDetailSnapshot item={item} rank={rank} />
        <SearchResultDetailMetadata item={item} />
      </ScrollView>
    </SafeAreaView>
  );
}
