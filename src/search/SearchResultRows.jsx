import { Pressable, Text, View } from "react-native";

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

function MetadataPill({ label }) {
  return (
    <View className="rounded-full border border-line bg-white px-3 py-1">
      <Text className="text-xs font-medium text-slate-700">{label}</Text>
    </View>
  );
}

function CardMetadataPill({ label }) {
  return (
    <View className="rounded-full border border-line bg-mist px-3 py-1">
      <Text className="text-xs font-medium text-slate-700">{label}</Text>
    </View>
  );
}

export function PreviewResultRow({ item, index }) {
  return (
    <View className="border-b border-line py-3">
      <View className="flex-row gap-3">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-mist">
          <Text className="text-xs font-semibold text-accent">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold leading-5 text-slate-900">{item.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-600">{item.provider}</Text>
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open focused pick ${index + 1}: ${item.title}`}
      onPress={onPress}
      className="rounded-2xl border border-line bg-white px-4 py-4"
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent">
          <Text className="text-sm font-semibold text-white">#{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold leading-6 text-slate-900">{item.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-600">{item.provider}</Text>
        </View>
        <Text className="pt-1 text-lg leading-5 text-accent">{">"}</Text>
      </View>

      {item.fit_reason ? (
        <View className="mt-4 rounded-2xl bg-mist px-3 py-3">
          <Text className="text-xs font-semibold uppercase text-slate-500">Why it made the list</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-800" numberOfLines={3}>
            {item.fit_reason}
          </Text>
        </View>
      ) : null}

      {item.caveat ? (
        <View className="mt-3 rounded-2xl border border-line px-3 py-3">
          <Text className="text-xs font-semibold uppercase text-slate-500">Worth knowing</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-800" numberOfLines={2}>
            {item.caveat}
          </Text>
        </View>
      ) : primaryFeature ? (
        <View className="mt-3 rounded-2xl border border-line px-3 py-3">
          <Text className="text-xs font-semibold uppercase text-slate-500">Feature note</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-800" numberOfLines={2}>
            {primaryFeature}
          </Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row flex-wrap gap-2">
        {[item.price, formatRatingLabel(item.rating), formatReviewCountLabel(item.reviewCount)].map(
          (label) => <CardMetadataPill key={label} label={label} />,
        )}
      </View>

      <View className="mt-4 border-t border-line pt-3">
        <Text className="text-sm font-semibold text-accent">Tap for details</Text>
      </View>
    </Pressable>
  );
}
