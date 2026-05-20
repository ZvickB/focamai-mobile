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

function getAttributeChips(item, featureBullets) {
  const chips = [];

  if (item.caveat) {
    chips.push("Caveat noted");
  }

  chips.push(...featureBullets);

  if (item.provider) {
    chips.push(item.provider);
  }

  return chips
    .map((chip) => String(chip).trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function FeaturedPickCard({ item, onPress }) {
  const featureBullets = Array.isArray(item.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
  const attributeChips = getAttributeChips(item, featureBullets);
  const priceLabel = item.price || "Price not shown";
  const reason = getPickReason(item, featureBullets);

  return (
    <Surface className="overflow-hidden rounded-[24px] border-transparent bg-white px-0 py-0 shadow-sm">
      <Pressable
        testID="results.focusedPick.1"
        accessibilityRole="button"
        accessibilityLabel={`Open focused pick 1: ${item.title}`}
        onPress={onPress}
        className="px-4 py-4"
      >
        <View className="flex-row gap-4">
          <View className="items-center gap-3">
            <ProductImageFrame
              containerClassName="h-40 w-36"
              image={item.image}
              title={item.title}
            />
          </View>
          <View className="min-w-0 flex-1 py-1">
            <Text className="text-[22px] font-semibold leading-[28px] text-ink" numberOfLines={3}>
              {item.title}
            </Text>
            <Text className="mt-2 text-sm leading-5 text-stone-600" numberOfLines={3}>
              {reason}
            </Text>

            {attributeChips.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {attributeChips.map((chip) => (
                  <View className="rounded-full bg-cream px-2.5 py-1.5" key={chip}>
                    <Text className="text-[11px] font-semibold text-stone-700" numberOfLines={1}>
                      {chip}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text className="mt-4 text-[21px] font-semibold text-accent">{priceLabel}</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View details for pick 1"
              className="mt-4 min-h-[46px] items-center justify-center rounded-full bg-accent px-4"
              onPress={onPress}
            >
              <Text className="text-sm font-semibold text-white">View details</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Surface>
  );
}

export function CompactPickRow({ item, index, onPress }) {
  const featureBullets = Array.isArray(item.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
  const reason = getPickReason(item, featureBullets);
  const priceLabel = item.price || "Price not shown";

  return (
    <Surface className="overflow-hidden rounded-[20px] border-transparent bg-white px-0 py-0 shadow-sm">
      <Pressable
        testID={`results.focusedPick.${index + 1}`}
        accessibilityRole="button"
        accessibilityLabel={`Open focused pick ${index + 1}: ${item.title}`}
        onPress={onPress}
        className="px-4 py-3"
      >
        <View className="flex-row items-center gap-3">
          <ProductImageFrame
            containerClassName="h-16 w-16"
            image={item.image}
            title={item.title}
          />
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold leading-5 text-ink" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-stone-600" numberOfLines={1}>
              {reason}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-sm font-semibold text-ink">{priceLabel}</Text>
              {item.provider ? (
                <Text className="text-xs font-medium text-stone-500" numberOfLines={1}>
                  {item.provider}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    </Surface>
  );
}

export function FocusedPickRow({ item, index, onPress }) {
  if (index === 0) {
    return <FeaturedPickCard item={item} onPress={onPress} />;
  }

  return <CompactPickRow item={item} index={index} onPress={onPress} />;
}
