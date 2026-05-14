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

export function PreviewResultRow({ item, index }) {
  return (
    <View className="border-b border-line py-3">
      <Text className="text-sm font-semibold leading-5 text-slate-900">
        {index + 1}. {item.title}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-slate-700">
        {item.provider} | {item.price}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-slate-600">
        Rating: {item.rating ?? "not shown"}
      </Text>
    </View>
  );
}

export function FocusedPickRow({ item, index, onPress }) {
  return (
    <Pressable onPress={onPress} className="border-b border-line py-4">
      <View className="flex-row gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-accent">
          <Text className="text-sm font-semibold text-white">{index + 1}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold leading-5 text-slate-900">{item.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-700">{item.provider}</Text>
        </View>
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {[item.price, formatRatingLabel(item.rating), formatReviewCountLabel(item.reviewCount)].map(
          (label) => (
            <View key={label} className="rounded-full border border-line bg-white px-3 py-1">
              <Text className="text-xs font-medium text-slate-700">{label}</Text>
            </View>
          ),
        )}
      </View>
    </Pressable>
  );
}
