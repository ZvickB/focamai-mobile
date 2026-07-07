import { useState } from "react";
import { Alert, Linking, Text, useWindowDimensions, View } from "react-native";
import {
  AppHeader,
  Button,
  HeaderBackButton,
  ScreenContainer,
  QuietStatusPanel,
} from "../components/MobileUI";
import {
  detailValue,
  SearchResultDetailHero,
  SearchResultDetailMetadata,
  SearchResultFeatureHighlights,
} from "../search/SearchResultDetailMetadata";
import { AffiliateDisclosureNote } from "../search/AffiliateDisclosureNote";
import { formatDisplayPrice } from "../search/formatDisplayPrice";
import { useSearchFlow } from "../search/SearchFlowContext";
import { getProductDisplayTitle } from "../search/productTitle";
import { useAuth } from "../contexts/useAuth";
import { useWatches } from "../components/watch/useWatches";
import {
  isMobileDeepDiveUiEnabled,
  isMobilePriceWatchUiEnabled,
} from "../config/features";

function openRetailerLink(link) {
  if (!link) {
    return;
  }

  Linking.openURL(link).catch(() =>
    Alert.alert("Could not open link", "No browser was found on this device."),
  );
}

function DetailRetailerFooter({ item }) {
  const provider = detailValue(item.provider, "");
  const price = formatDisplayPrice(item.price) || "Price not shown";
  const displayTitle = getProductDisplayTitle(item.title) || detailValue(item.title, "this product");

  return (
    <View>
      <View className="flex-row items-center gap-3">
        <View className="w-28">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>{price}</Text>
          {provider ? (
            <Text className="text-xs text-stone-500" numberOfLines={1}>{provider}</Text>
          ) : null}
        </View>
        {item.link ? (
          <Button
            accessibilityRole="link"
            accessibilityLabel={`View ${displayTitle} on ${provider || "the retailer"}`}
            className="flex-1"
            onPress={() => openRetailerLink(item.link)}
            style={{ backgroundColor: "#E59B26" }}
          >
            {`View on ${provider || "retailer"}`}
          </Button>
        ) : (
          <Text className="text-sm text-stone-400">Link unavailable</Text>
        )}
      </View>
      {item.link ? <AffiliateDisclosureNote className="mt-2" /> : null}
    </View>
  );
}

function DetailHeader({ onBack }) {
  return (
    <AppHeader
      left={<HeaderBackButton label="Picks" onPress={onBack} testID="detail.backButton" />}
      right={
        <View
          accessibilityElementsHidden
          className="h-11 w-11"
          importantForAccessibility="no"
        />
      }
    />
  );
}

function normalizePrimitive(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value === "object" ||
    typeof value === "function"
  ) {
    return "";
  }

  return String(value).trim();
}

function normalizeFeatureBullets(value) {
  return Array.isArray(value)
    ? value.map((bullet) => normalizePrimitive(bullet)).filter(Boolean)
    : [];
}

function normalizePositiveNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

function normalizeDetailRouteItem(routeItem) {
  if (!routeItem || typeof routeItem !== "object" || Array.isArray(routeItem)) {
    return null;
  }

  const item = {
    asin: normalizePrimitive(routeItem.asin || routeItem.product_id),
    caveat: normalizePrimitive(routeItem.caveat),
    deepDiveEligibility:
      routeItem.deepDiveEligibility && typeof routeItem.deepDiveEligibility === "object"
        ? routeItem.deepDiveEligibility
        : null,
    feature_bullets: normalizeFeatureBullets(routeItem.feature_bullets || routeItem.featureBullets),
    fit_reason: normalizePrimitive(routeItem.fit_reason || routeItem.fitReason),
    id: normalizePrimitive(routeItem.id || routeItem.candidateId || routeItem.candidate_id),
    image: normalizePrimitive(routeItem.image || routeItem.imageUrl),
    link: normalizePrimitive(routeItem.link || routeItem.url),
    moderation:
      routeItem.moderation && typeof routeItem.moderation === "object"
        ? routeItem.moderation
        : null,
    numericPrice: normalizePositiveNumber(
      routeItem.numericPrice ?? routeItem.numeric_price ?? routeItem.extracted_price,
    ),
    price: normalizePrimitive(routeItem.price),
    provider: normalizePrimitive(routeItem.provider || routeItem.source),
    rating: routeItem.rating,
    reviewCount: routeItem.reviewCount ?? routeItem.review_count,
    sourceTitle: normalizePrimitive(routeItem.sourceTitle || routeItem.source_title),
    title: normalizePrimitive(routeItem.title || routeItem.name),
  };

  return item.id || item.title || item.link ? item : null;
}

function ProductActions({ activeSearchSession, isFinalizedItem, item, navigation }) {
  const { user } = useAuth();
  const deepDiveUiEnabled = isMobileDeepDiveUiEnabled();
  const priceWatchUiEnabled = isMobilePriceWatchUiEnabled();
  const { create, watches } = useWatches({
    enabled: Boolean(priceWatchUiEnabled && user && isFinalizedItem),
  });
  const [watchMessage, setWatchMessage] = useState("");
  const [watchSaving, setWatchSaving] = useState(false);
  const amazonDomain = activeSearchSession?.amazonDomain || "amazon.com";
  const eligibility = item.deepDiveEligibility;
  const canShowDeepDive =
    deepDiveUiEnabled &&
    isFinalizedItem &&
    ["show", "maybe"].includes(eligibility?.recommendation);
  const canWatch = Boolean(
    priceWatchUiEnabled && isFinalizedItem && item.asin && item.numericPrice,
  );
  const existingWatch = watches.find(
    (watch) => watch.asin === item.asin && watch.amazonDomain === amazonDomain,
  );

  if (!canShowDeepDive && !canWatch) return null;

  async function handleWatchPrice() {
    if (!user) {
      navigation.navigate("Auth", { backLabel: "Product" });
      return;
    }
    if (existingWatch) {
      setWatchMessage("Already watching this product.");
      return;
    }

    setWatchSaving(true);
    setWatchMessage("");
    try {
      await create({
        amazonDomain,
        asin: item.asin,
        baselinePrice: item.numericPrice,
        imageUrl: item.image || "",
        productTitle: getProductDisplayTitle(item.title) || item.sourceTitle || item.asin,
        productUrl: item.link || "",
        targetPrice: null,
        thresholdPct: 5,
      });
      setWatchMessage("Watching this price. We’ll email you when it reaches your alert.");
    } catch (error) {
      setWatchMessage(error instanceof Error ? error.message : "Unable to add this watch right now.");
    } finally {
      setWatchSaving(false);
    }
  }

  return (
    <View className="gap-3 border-t border-line pt-5" testID="detail.productActions">
      <Text className="text-base font-semibold text-ink">Optional tools</Text>
      {canShowDeepDive ? (
        <Button
          onPress={() => {
            if (!user) {
              navigation.navigate("Auth", { backLabel: "Product" });
              return;
            }
            navigation.navigate("DeepDive", { candidateId: item.id });
          }}
          variant="secondary"
        >
          {eligibility?.recommendation === "maybe" || eligibility?.mode === "reviews_only"
            ? "Check reviews and other stores"
            : "Deep dive — store prices and reviews"}
        </Button>
      ) : null}
      {canWatch ? (
        <Button
          disabled={watchSaving || Boolean(user && existingWatch)}
          onPress={handleWatchPrice}
          variant="secondary"
        >
          {user && existingWatch ? "Price watch added" : watchSaving ? "Adding price watch..." : "Watch price"}
        </Button>
      ) : null}
      {watchMessage ? <Text className="text-center text-xs leading-5 text-stone-500">{watchMessage}</Text> : null}
    </View>
  );
}

function UnavailableDetailState({ onBack }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;

  return (
    <ScreenContainer
      safeAreaEdges={["top", "bottom"]}
      testID="detail.screen"
      contentContainerStyle={{
        gap: isCompact ? 16 : 20,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center gap-5">
        <DetailHeader onBack={onBack} />
        <View>
          <Text className="text-[30px] font-semibold leading-[37px] text-ink">
            Pick details unavailable
          </Text>
          <Text className="mt-3 text-base leading-6 text-stone-600">
            This pick is no longer available in the current shortlist.
          </Text>
        </View>
        <QuietStatusPanel>
          <Text className="text-sm font-semibold text-slate-700">
            Go back and select a current pick.
          </Text>
          <Text className="mt-1 text-sm leading-5 text-slate-500">
            Focamai keeps detail pages tied to the latest shortlist. If the results changed or the
            detail link opened without a saved pick snapshot, the old item cannot be shown reliably.
          </Text>
        </QuietStatusPanel>
      </View>
    </ScreenContainer>
  );
}

export default function SearchResultDetailScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const { activeSearchSession, finalResults } = useSearchFlow();
  const safeFinalResults = Array.isArray(finalResults) ? finalResults : [];
  const candidateId = route.params?.candidateId;
  const routeItem = normalizeDetailRouteItem(route.params?.item);
  const routeRank = route.params?.rank;
  const matchedIndex = candidateId
    ? safeFinalResults.findIndex((result) => String(result.id) === String(candidateId))
    : -1;
  const matchedItem = matchedIndex >= 0 ? safeFinalResults[matchedIndex] : null;
  const item = matchedItem || routeItem;
  const rank = matchedIndex >= 0 ? matchedIndex + 1 : routeRank;
  const enrichmentStatus = activeSearchSession?.phases?.enrich || "idle";
  const isStaleSnapshot = Boolean(routeItem && !matchedItem);
  const goBack = () => navigation?.goBack?.();

  if (!item) {
    return <UnavailableDetailState onBack={goBack} />;
  }

  return (
    <ScreenContainer
      footer={<DetailRetailerFooter item={item} />}
      safeAreaEdges={["top", "bottom"]}
      testID="detail.screen"
      contentContainerStyle={{
        gap: isCompact ? 16 : 20,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center gap-5">
        <DetailHeader onBack={goBack} />

        <SearchResultDetailHero item={item} rank={rank} />
        {isStaleSnapshot ? (
          <QuietStatusPanel>
            <Text className="text-sm font-semibold text-slate-700">
              Showing the pick you opened earlier.
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-500">
              The current shortlist has changed, so these details may no longer match the latest
              result order.
            </Text>
          </QuietStatusPanel>
        ) : null}
        <SearchResultDetailMetadata enrichmentStatus={enrichmentStatus} item={item} />
        <SearchResultFeatureHighlights enrichmentStatus={enrichmentStatus} item={item} />
        <ProductActions
          activeSearchSession={activeSearchSession}
          isFinalizedItem={Boolean(matchedItem)}
          item={item}
          navigation={navigation}
        />
      </View>
    </ScreenContainer>
  );
}
