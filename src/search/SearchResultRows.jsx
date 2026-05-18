import { Linking, Pressable, Text, View } from "react-native";
import { Pill, ProductImageFrame, Surface } from "../components/MobileUI";
import { AffiliateDisclosureNote } from "./AffiliateDisclosureNote";

function formatRatingLabel(rating) {
  if (rating === null || rating === undefined || rating === "" || typeof rating === "boolean") {
    return "Rating not shown";
  }

  const ratingValue = Number(rating);

  if (Number.isFinite(ratingValue)) {
    return `${ratingValue.toFixed(1)} rating`;
  }

  if (typeof rating === "string") {
    const trimmedRating = rating.trim();

    return trimmedRating ? `${trimmedRating} rating` : "Rating not shown";
  }

  return "Rating not shown";
}

function formatReviewCountLabel(reviewCount) {
  if (reviewCount === null || reviewCount === undefined || reviewCount === "") {
    return "Reviews not shown";
  }

  if (typeof reviewCount === "number") {
    return `${reviewCount} reviews`;
  }

  if (typeof reviewCount === "string") {
    const trimmedReviewCount = reviewCount.trim();

    return trimmedReviewCount ? `${trimmedReviewCount} reviews` : "Reviews not shown";
  }

  return "Reviews not shown";
}

function getRatingValue(rating) {
  if (rating === null || rating === undefined || rating === "" || typeof rating === "boolean") {
    return null;
  }

  const value = Number(rating);

  return Number.isFinite(value) ? value : null;
}

function MetadataPill({ label }) {
  return <Pill>{label}</Pill>;
}

function openRetailerLink(link) {
  if (!link) {
    return;
  }

  Linking.openURL(link).catch(() => {});
}

export function PreviewResultRow({ item, index }) {
  return (
    <View className="border-b border-line py-3">
      <View className="flex-row gap-3">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-white">
          <Text className="text-xs font-semibold text-accent">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold leading-5 text-ink">{item.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-stone-600">{item.provider}</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <MetadataPill label={item.price} />
            <MetadataPill label={formatRatingLabel(item.rating)} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function FocusedPickRow({ item, index, onPress }) {
  const featureBullets = Array.isArray(item.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
  const primaryFeature = featureBullets[0];
  const ratingValue = getRatingValue(item.rating);
  const priceLabel = item.price || "Price not shown";
  const fitPreview = item.fit_reason || item.caveat || primaryFeature || "";
  const fitPreviewLabel = item.fit_reason
    ? "Why it fits"
    : item.caveat
      ? "Worth knowing"
      : primaryFeature
        ? "Feature note"
        : "";
  const imageFrameClassName = index === 0 ? "h-28 w-28" : "h-24 w-24";

  return (
    <Surface className="overflow-hidden px-0 py-0">
      <Pressable
        testID={`results.focusedPick.${index + 1}`}
        accessibilityRole="button"
        accessibilityLabel={`Open focused pick ${index + 1}: ${item.title}`}
        onPress={onPress}
        className="px-4 py-4"
      >
        <View className="flex-row gap-3">
          <View className="items-center gap-2">
            <View className="h-8 min-w-[40px] items-center justify-center rounded-full bg-accent px-3">
              <Text className="text-xs font-semibold text-white">#{index + 1}</Text>
            </View>
            <ProductImageFrame
              containerClassName={imageFrameClassName}
              image={item.image}
              title={item.title}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold leading-6 text-ink" numberOfLines={3}>
              {item.title}
            </Text>
            {item.provider ? (
              <Text className="mt-1 text-sm leading-5 text-stone-600">{item.provider}</Text>
            ) : null}
            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              <Text className="text-base font-semibold text-accent">{priceLabel}</Text>
              <Text className="text-xs font-medium text-stone-500">
                {ratingValue === null ? "Rating not shown" : `${ratingValue.toFixed(1)} rating`}
              </Text>
              <Text className="text-xs font-medium text-stone-500">
                {formatReviewCountLabel(item.reviewCount)}
              </Text>
            </View>

            {fitPreview ? (
              <View className="mt-3 rounded-lg border border-line bg-cream px-3 py-2">
                <Text className="text-[11px] font-semibold uppercase tracking-[0.8px] text-stone-500">
                  {fitPreviewLabel}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-stone-800" numberOfLines={2}>
                  {fitPreview}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View className="border-t border-line bg-cream px-4 py-3">
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open details for focused pick ${index + 1}`}
            onPress={onPress}
            className="min-h-[40px] flex-1 justify-center"
          >
            <Text className="text-sm font-semibold text-accent">View details</Text>
          </Pressable>
          {item.link ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`View ${item.title} on ${item.provider}`}
              className="min-h-[40px] items-center justify-center rounded-full border border-line bg-white px-3 py-2"
              onPress={() => openRetailerLink(item.link)}
            >
              <Text className="text-sm font-semibold text-slate-700">
                View retailer
              </Text>
            </Pressable>
          ) : (
            <Text className="text-sm font-medium text-slate-500">Retailer link unavailable</Text>
          )}
        </View>
        {item.link ? (
          <>
            <Text className="mt-2 text-xs leading-4 text-slate-500">
              Retailer availability and pricing can change.
            </Text>
            <AffiliateDisclosureNote />
          </>
        ) : null}
      </View>
    </Surface>
  );
}
