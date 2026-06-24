import { Star } from "lucide-react-native";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { ProductImageFrame, cx } from "../components/MobileUI";
import { getDeliverySignal } from "./primeEligibility";
import { getProductDisplayTitle } from "./productTitle";

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

function formatReviewLabel(reviewCount) {
  if (reviewCount === null || reviewCount === undefined || reviewCount === "") {
    return "";
  }

  if (typeof reviewCount === "number") {
    return `${reviewCount} reviews`;
  }

  if (typeof reviewCount === "string") {
    const trimmedReviewCount = reviewCount.trim();

    return trimmedReviewCount ? `${trimmedReviewCount} reviews` : "";
  }

  return "";
}

function getPickReason(item, featureBullets) {
  return item.fit_reason || item.caveat || featureBullets[0] || "A focused match for this search.";
}

export function FocusedPickRow({
  isLast = false,
  isSelected = false,
  item,
  index,
  onLayout,
  onPress,
}) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const featureBullets = Array.isArray(item.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
  const reason = getPickReason(item, featureBullets);
  const priceLabel = item.price || "Price not shown";
  const ratingLabel = formatRatingLabel(item.rating);
  const reviewLabel = formatReviewLabel(item.reviewCount);
  const deliverySignal = getDeliverySignal(item);
  const displayTitle = getProductDisplayTitle(item.title);

  return (
    <View
      className={cx(
        "relative overflow-hidden border-line",
        isLast ? "" : "border-b",
        isSelected ? "bg-cream" : "bg-transparent",
      )}
      onLayout={onLayout}
      testID={`results.focusedPickRow.${index + 1}`}
    >
      {isSelected ? <View className="absolute bottom-3 left-0 top-3 w-1 rounded-full bg-accent" /> : null}
      <Pressable
        testID={`results.focusedPick.${index + 1}`}
        accessibilityRole="button"
        accessibilityLabel={`${isSelected ? "Selected result. " : ""}Open result: ${displayTitle || item.title}`}
        onPress={onPress}
        className={isCompact ? "min-h-[78px] px-2.5 py-2.5" : "min-h-[82px] px-3 py-2.5"}
      >
        <View className={isCompact ? "flex-row items-center gap-2.5" : "flex-row items-center gap-3.5"}>
          <ProductImageFrame
            containerClassName={isCompact ? "h-11 w-11" : "h-12 w-12"}
            frameClassName="rounded-[12px] bg-white p-1"
            image={item.image}
            imageClassName="rounded-[9px]"
            title={displayTitle || item.title}
          />
          <View className="min-w-0 flex-1">
            <Text
              className={cx(
                "text-[13px] leading-[18px] text-ink",
                isSelected ? "font-semibold" : "font-medium",
              )}
              numberOfLines={2}
            >
              {displayTitle || item.title}
            </Text>
            <Text className="mt-1 text-[12px] leading-[17px] text-stone-600" numberOfLines={2}>
              {reason}
            </Text>
            <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-0.5">
              <Text className="text-[11px] font-medium text-stone-500" numberOfLines={1}>
                {priceLabel}
              </Text>
              <View className="flex-row items-center gap-1">
                <Star color="#0F6175" opacity={0.55} size={10} strokeWidth={2} />
                <Text className="text-[11px] text-stone-500" numberOfLines={1}>
                  {ratingLabel}
                </Text>
              </View>
              {reviewLabel ? (
                <Text className="text-[11px] text-stone-400" numberOfLines={1}>
                  {reviewLabel}
                </Text>
              ) : null}
              {item.provider ? (
                <Text className="text-[11px] text-stone-400" numberOfLines={1}>
                  {item.provider}
                </Text>
              ) : null}
              {deliverySignal ? (
                <View className="rounded-full border border-secondary/30 bg-accent/5 px-2 py-0.5">
                  <Text className="text-[10px] font-semibold text-accent">
                    {deliverySignal.label}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-0.5 text-[11px] font-semibold text-accent">View details</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
