import { Star } from "lucide-react-native";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import { ProductImageFrame, Surface } from "../components/MobileUI";

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

export function FocusedPickRow({ isSelected = false, item, index, onLayout, onPress }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const featureBullets = Array.isArray(item.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
  const reason = getPickReason(item, featureBullets);
  const priceLabel = item.price || "Price not shown";
  const ratingLabel = formatRatingLabel(item.rating);
  const reviewLabel = formatReviewLabel(item.reviewCount);

  return (
    <Surface
      className={`overflow-hidden px-0 py-0 ${isSelected ? "bg-cream" : "bg-white"}`}
      onLayout={onLayout}
      testID={`results.focusedPickRow.${index + 1}`}
    >
      {isSelected ? <View className="absolute bottom-0 left-0 top-0 w-1 bg-accent" /> : null}
      <Pressable
        testID={`results.focusedPick.${index + 1}`}
        accessibilityRole="button"
        accessibilityLabel={`${isSelected ? "Selected result. " : ""}Open result: ${item.title}`}
        onPress={onPress}
        className={isCompact ? "min-h-[84px] px-3 py-3" : "min-h-[88px] px-3 py-3"}
      >
        <View className={isCompact ? "flex-row items-center gap-2.5" : "flex-row items-center gap-3"}>
          <ProductImageFrame
            containerClassName={isCompact ? "h-11 w-11" : "h-12 w-12"}
            frameClassName="rounded-[14px] bg-cream p-1.5"
            image={item.image}
            imageClassName="rounded-[10px]"
            title={item.title}
          />
          <View className="min-w-0 flex-1">
            <Text className="text-[13px] font-medium leading-[18px] text-ink" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="mt-1.5 text-[13px] leading-[18px] text-stone-700" numberOfLines={2}>
              {reason}
            </Text>
            <View className="mt-1.5 flex-row flex-wrap items-center gap-x-3 gap-y-0.5">
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
            </View>
            <Text className="mt-0.5 text-xs font-semibold text-accent">View details</Text>
          </View>
        </View>
      </Pressable>
    </Surface>
  );
}
