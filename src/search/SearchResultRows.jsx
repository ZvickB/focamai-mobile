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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open focused pick ${index + 1}: ${item.title}`}
      onPress={onPress}
      className="border-b border-line py-4"
    >
      <View className="flex-row gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Text className="text-sm font-semibold text-white">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold leading-5 text-slate-900">{item.title}</Text>
          {item.fit_reason ? (
            <Text className="mt-1 text-sm leading-5 text-slate-700" numberOfLines={1}>
              {item.fit_reason}
            </Text>
          ) : null}
          <Text className="mt-1 text-sm leading-5 text-slate-600">{item.provider}</Text>
        </View>
        <Text className="pt-1 text-lg leading-5 text-accent">{">"}</Text>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {[item.price, formatRatingLabel(item.rating), formatReviewCountLabel(item.reviewCount)].map(
          (label) => <MetadataPill key={label} label={label} />,
        )}
      </View>
    </Pressable>
  );
}
