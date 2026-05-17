import { useState } from "react";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { AffiliateDisclosureNote } from "./AffiliateDisclosureNote";

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

function getRatingValue(rating) {
  const value = Number(rating);

  return Number.isFinite(value) ? value : null;
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

function RatingStars({ rating }) {
  const ratingValue = getRatingValue(rating);
  const roundedRating = ratingValue === null ? 0 : Math.round(ratingValue);

  return (
    <View className="flex-row gap-0.5" accessibilityLabel={formatRatingLabel(rating)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Text
          key={index}
          className={
            index < roundedRating
              ? "text-sm leading-5 text-amber-500"
              : "text-sm leading-5 text-slate-300"
          }
        >
          *
        </Text>
      ))}
    </View>
  );
}

function ProductImage({ image, title }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!image || hasImageError) {
    return (
      <View className="h-28 w-28 items-center justify-center rounded-2xl border border-line bg-mist">
        <Text className="text-center text-xs font-semibold uppercase leading-4 text-slate-400">
          Image pending
        </Text>
      </View>
    );
  }

  return (
    <View className="h-28 w-28 rounded-2xl border border-line bg-white p-2">
      <Image
        accessibilityLabel={title}
        className="h-full w-full rounded-xl"
        onError={() => setHasImageError(true)}
        resizeMode="contain"
        source={{ uri: image }}
      />
    </View>
  );
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
  const ratingValue = getRatingValue(item.rating);

  return (
    <View className="overflow-hidden rounded-2xl border border-line bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open focused pick ${index + 1}: ${item.title}`}
        onPress={onPress}
        className="px-4 py-4"
      >
        <View className="flex-row gap-3">
          <ProductImage image={item.image} title={item.title} />
          <View className="flex-1">
            <View className="self-start rounded-full bg-accent px-3 py-1">
              <Text className="text-xs font-semibold text-white">
                {index === 0 ? "Best match" : `Pick #${index + 1}`}
              </Text>
            </View>
            <Text className="mt-3 text-base font-semibold leading-6 text-slate-900" numberOfLines={3}>
              {item.title}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-slate-600">{item.provider}</Text>
            <Text className="mt-2 text-lg font-semibold text-accent">{item.price}</Text>
            <View className="mt-2 flex-row items-center gap-2">
              <RatingStars rating={item.rating} />
              <Text className="text-xs font-medium text-slate-600">
                {ratingValue === null ? "Rating not shown" : ratingValue.toFixed(1)}
              </Text>
            </View>
          </View>
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
          <CardMetadataPill label={formatReviewCountLabel(item.reviewCount)} />
        </View>
      </Pressable>

      <View className="border-t border-line bg-mist px-4 py-3">
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open details for focused pick ${index + 1}`}
            onPress={onPress}
          >
            <Text className="text-sm font-semibold text-accent">Tap for details</Text>
          </Pressable>
          {item.link ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`View ${item.title} on ${item.provider}`}
              className="rounded-full border border-line bg-white px-3 py-2"
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
    </View>
  );
}
