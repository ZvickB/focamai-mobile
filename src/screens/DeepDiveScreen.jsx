import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, Text, useWindowDimensions, View } from "react-native";
import { ArrowUpRight, SearchCheck } from "lucide-react-native";

import {
  AppHeader,
  Button,
  HeaderBackButton,
  ProductImageFrame,
  QuietStatusPanel,
  ScreenContainer,
  Surface,
} from "../components/MobileUI";
import { useAuth } from "../contexts/useAuth";
import { fetchProductDeepDive } from "../search/searchApi";
import { useSearchFlow } from "../search/SearchFlowContext";
import { formatDisplayPrice } from "../search/formatDisplayPrice";
import { getProductDisplayTitle } from "../search/productTitle";

function formatMoney(value, currency = "USD") {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "";

  try {
    return new Intl.NumberFormat(currency === "CAD" ? "en-CA" : "en-US", {
      currency,
      style: "currency",
    }).format(numericValue);
  } catch {
    return `${currency} ${numericValue.toFixed(2)}`;
  }
}

function openExternalLink(url) {
  if (!url) return;
  Linking.openURL(url).catch(() =>
    Alert.alert("Could not open link", "No browser was found on this device."),
  );
}

function DeepDiveHeader({ onBack }) {
  return (
    <AppHeader
      left={<HeaderBackButton label="Product" onPress={onBack} testID="deepDive.backButton" />}
      right={<View className="h-11 w-11" />}
    />
  );
}

function OfferCard({ index, offer }) {
  const total = formatMoney(offer.knownTotal || offer.price, offer.currency || "USD");
  const savings = formatMoney(offer.savingsVsAmazon?.amount, offer.currency || "USD");
  const caveats = Array.isArray(offer.caveats) ? offer.caveats.filter(Boolean) : [];

  return (
    <Surface className="gap-3 bg-[#f8fcfb]" testID={`deepDive.offer.${index}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-semibold text-ink" numberOfLines={2}>
            {offer.retailer || "Store offer"}
          </Text>
          {savings ? <Text className="text-sm font-semibold text-accent">Saves {savings}</Text> : null}
          {offer.shipping ? (
            <Text className="text-xs leading-5 text-stone-500">{offer.shipping}</Text>
          ) : null}
        </View>
        <Text className="text-base font-semibold text-accent">{total}</Text>
      </View>
      {caveats.length > 0 ? (
        <Text className="text-xs leading-5 text-amber-700">{caveats.join(" ")}</Text>
      ) : null}
      <Pressable
        accessibilityRole="link"
        className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-[16px] border border-line bg-white px-4"
        onPress={() => openExternalLink(offer.url)}
      >
        <Text className="text-sm font-semibold text-ink">Visit {offer.retailer || "store"}</Text>
        <ArrowUpRight color="#0F6175" size={16} strokeWidth={2.2} />
      </Pressable>
    </Surface>
  );
}

function ReviewSections({ reviews }) {
  const insights = Array.isArray(reviews?.topInsights) ? reviews.topInsights.slice(0, 6) : [];
  const criticRatings = Array.isArray(reviews?.criticRatings) ? reviews.criticRatings.slice(0, 4) : [];
  const userReviews = Array.isArray(reviews?.userReviews) ? reviews.userReviews.slice(0, 4) : [];

  if (!reviews?.summary && insights.length === 0 && criticRatings.length === 0 && userReviews.length === 0) {
    return null;
  }

  return (
    <View className="gap-4">
      {reviews?.summary ? (
        <View className="gap-2 border-t border-line pt-5">
          <Text className="text-lg font-semibold text-ink">What reviewers say</Text>
          <Text className="text-sm leading-6 text-stone-600">{reviews.summary}</Text>
          {Array.isArray(reviews.sources) && reviews.sources.length > 0 ? (
            <Text className="text-xs leading-5 text-stone-500">
              Sources: {reviews.sources.join(", ")}
            </Text>
          ) : null}
        </View>
      ) : null}

      {insights.length > 0 ? (
        <View className="gap-3 border-t border-line pt-5">
          <Text className="text-lg font-semibold text-ink">Review signals</Text>
          <Text className="text-xs leading-5 text-stone-500">
            Themes Google surfaced from available product reviews.
          </Text>
          {insights.map((insight, index) => (
            <QuietStatusPanel key={`${insight.text}-${index}`}>
              <Text className="text-sm leading-6 text-stone-700">{insight.text}</Text>
            </QuietStatusPanel>
          ))}
        </View>
      ) : null}

      {criticRatings.length > 0 ? (
        <View className="gap-2 border-t border-line pt-5">
          <Text className="text-lg font-semibold text-ink">Critic ratings</Text>
          {criticRatings.map((rating, index) => (
            <Text className="text-sm leading-6 text-stone-600" key={`${rating.source}-${index}`}>
              <Text className="font-semibold text-ink">{rating.source || "Review source"}</Text>
              {rating.rating ? `: ${rating.rating}` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      {userReviews.length > 0 ? (
        <View className="gap-3 border-t border-line pt-5">
          <Text className="text-lg font-semibold text-ink">Buyer reviews</Text>
          {userReviews.map((review, index) => (
            <QuietStatusPanel key={`${review.source}-${review.date}-${index}`}>
              <Text className="text-xs font-medium text-stone-500">
                {[review.rating ? `${review.rating} stars` : "", review.source, review.date]
                  .filter(Boolean)
                  .join(" | ")}
              </Text>
              <Text className="mt-1 text-sm leading-6 text-stone-700">{review.text}</Text>
            </QuietStatusPanel>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ProductVariantNote({ product }) {
  const dimensions = Array.isArray(product?.variantDimensions) ? product.variantDimensions : [];
  if (dimensions.length === 0) return null;

  return (
    <Text className="border-t border-line pt-4 text-xs leading-5 text-stone-500">
      Reviews and store offers may cover other variants of this product. Check size, color, and edition before buying.
    </Text>
  );
}

export default function DeepDiveScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const { session, user } = useAuth();
  const { activeSearchSession, finalResults } = useSearchFlow();
  const candidateId = String(route.params?.candidateId || "");
  const item = (Array.isArray(finalResults) ? finalResults : []).find(
    (result) => String(result.id) === candidateId,
  );
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showingUsFallback, setShowingUsFallback] = useState(false);

  async function loadDeepDive({ crossMarketFallback = false } = {}) {
    if (!user || !session?.access_token) {
      setPayload({ status: "gated", error: "Sign in to use Deep Dive." });
      return;
    }

    if (!item || !activeSearchSession?.discoveryToken || !activeSearchSession?.submittedQuery) {
      setError("Deep Dive needs an active finalized search. Return to your picks and try again.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const nextPayload = await fetchProductDeepDive({
        amazonDomain: activeSearchSession.amazonDomain,
        candidateId,
        crossMarketFallback,
        discoveryToken: activeSearchSession.discoveryToken,
        query: activeSearchSession.submittedQuery,
        token: session.access_token,
      });
      setPayload(nextPayload);
      setShowingUsFallback(crossMarketFallback);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Deep Dive was limited this time.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDeepDive();
    // Navigation to this screen is the user's explicit request; do not refetch on unrelated context updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  const offers = Array.isArray(payload?.offers) ? payload.offers : [];
  const isCanadianMarket = /amazon\.ca/i.test(activeSearchSession?.amazonDomain || "");
  const canOfferUsFallback =
    isCanadianMarket && payload?.status === "ready" && offers.length === 0 && !showingUsFallback;

  return (
    <ScreenContainer
      safeAreaEdges={["top", "bottom"]}
      testID="deepDive.screen"
      contentContainerStyle={{
        gap: isCompact ? 16 : 20,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center gap-5">
        <DeepDiveHeader onBack={() => navigation.goBack()} />

        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-[1px] text-accent">Deep Dive</Text>
          <Text className="text-[28px] font-semibold leading-[35px] text-ink">
            Store prices and reviews
          </Text>
          <Text className="text-[15px] leading-6 text-stone-600">
            An optional check for verified lower offers and review signals for this exact pick.
          </Text>
        </View>

        {item ? (
          <Surface className="flex-row items-center gap-4">
            <ProductImageFrame
              containerClassName="h-20 w-20"
              image={item.image}
              moderation={item.moderation}
              title={item.title}
            />
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-base font-semibold leading-6 text-ink" numberOfLines={2}>
                {getProductDisplayTitle(item.title)}
              </Text>
              <Text className="text-sm text-stone-500">
                {formatDisplayPrice(item.price)} on {item.provider || "Amazon"}
              </Text>
            </View>
          </Surface>
        ) : null}

        {loading ? (
          <QuietStatusPanel testID="deepDive.loading">
            <View className="flex-row items-center gap-3">
              <ActivityIndicator color="#0F6175" size="small" />
              <Text className="flex-1 text-sm leading-6 text-stone-600">
                Checking store offers and review signals...
              </Text>
            </View>
          </QuietStatusPanel>
        ) : null}

        {error ? (
          <Surface className="gap-3 border-amber-200 bg-amber-50">
            <Text className="text-sm leading-6 text-amber-900">{error}</Text>
            <Button onPress={() => loadDeepDive()} variant="secondary">Try again</Button>
          </Surface>
        ) : null}

        {payload?.status === "gated" ? (
          <QuietStatusPanel>
            <Text className="text-sm font-semibold text-ink">Deep Dive is account-based.</Text>
            <Text className="mt-1 text-sm leading-6 text-stone-600">
              {payload.error || "Sign in to use Deep Dive."}
            </Text>
          </QuietStatusPanel>
        ) : null}

        {payload?.status === "limited" || payload?.status === "unavailable" ? (
          <QuietStatusPanel>
            <Text className="text-sm font-semibold text-ink">Store comparison limited</Text>
            <Text className="mt-1 text-sm leading-6 text-stone-600">
              {payload?.limitedData?.message || payload?.error || "There was not enough verified data to show this time."}
            </Text>
          </QuietStatusPanel>
        ) : null}

        {payload?.ambiguous ? (
          <QuietStatusPanel className="border-amber-200 bg-amber-50">
            <Text className="text-sm leading-6 text-amber-800">
              Google Shopping returned similar products. Offers and reviews may cover a different color, size, or edition.
            </Text>
          </QuietStatusPanel>
        ) : null}

        {canOfferUsFallback ? (
          <Surface className="gap-3">
            <Text className="text-sm leading-6 text-stone-600">
              No lower Canadian offers were verified. You can run a separate check for US retailers in USD.
            </Text>
            <Button onPress={() => loadDeepDive({ crossMarketFallback: true })} variant="secondary">
              Show US retailer prices
            </Button>
          </Surface>
        ) : null}

        {offers.length > 0 ? (
          <View className="gap-3">
            <Text className="text-lg font-semibold text-ink">
              {showingUsFallback ? "US store offers (USD)" : "Store offers"}
            </Text>
            {offers.map((offer, index) => (
              <OfferCard index={index} key={`${offer.retailer}-${offer.url}-${index}`} offer={offer} />
            ))}
          </View>
        ) : null}

        <ReviewSections reviews={payload?.reviews} />
        {payload?.status === "ready" ? <ProductVariantNote product={payload.product} /> : null}

        {payload?.status === "ready" && offers.length === 0 && !canOfferUsFallback ? (
          <QuietStatusPanel>
            <View className="flex-row items-start gap-3">
              <SearchCheck color="#0F6175" size={19} strokeWidth={2} />
              <Text className="flex-1 text-sm leading-6 text-stone-600">
                No verified lower store offer was found. Any available review signals are shown above.
              </Text>
            </View>
          </QuietStatusPanel>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
