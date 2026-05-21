import { Pressable, Text, View } from "react-native";
import { Pill, ProductImageFrame, Surface } from "../components/MobileUI";

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

function MetadataPill({ label }) {
  return <Pill>{label}</Pill>;
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

function getPickReason(item, featureBullets) {
  return item.fit_reason || item.caveat || featureBullets[0] || "A focused match for this search.";
}

export function FocusedPickRow({ isSelected = false, item, index, onLayout, onPress }) {
  const featureBullets = Array.isArray(item.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
  const reason = getPickReason(item, featureBullets);
  const priceLabel = item.price || "Price not shown";
  const ratingLabel = formatRatingLabel(item.rating);

  return (
    <Surface
      className={`overflow-hidden px-0 py-0 ${isSelected ? "bg-cream" : "bg-white"}`}
      onLayout={onLayout}
    >
      {isSelected ? <View className="absolute bottom-0 left-0 top-0 w-1 bg-accent" /> : null}
      <Pressable
        testID={`results.focusedPick.${index + 1}`}
        accessibilityRole="button"
        accessibilityLabel={`${isSelected ? "Selected result. " : ""}Open result: ${item.title}`}
        onPress={onPress}
        className="min-h-24 px-3 py-3"
      >
        <View className="flex-row items-center gap-2">
          <ProductImageFrame
            containerClassName="h-14 w-14"
            image={item.image}
            title={item.title}
          />
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold leading-5 text-ink" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-stone-600" numberOfLines={2}>
              {reason}
            </Text>
            <View className="mt-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
              <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                {priceLabel}
              </Text>
              <Text className="text-xs font-medium text-stone-500" numberOfLines={1}>
                {ratingLabel}
              </Text>
              {item.provider ? (
                <Text className="text-xs font-medium text-stone-500" numberOfLines={1}>
                  {item.provider}
                </Text>
              ) : null}
            </View>
            <Text className="mt-1 text-xs font-semibold text-accent">View details</Text>
          </View>
        </View>
      </Pressable>
    </Surface>
  );
}
