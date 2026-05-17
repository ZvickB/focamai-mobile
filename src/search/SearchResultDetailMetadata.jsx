import { Text, View } from "react-native";

export function detailValue(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatRating(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) {
    return "Rating not shown";
  }

  return rating.toFixed(1);
}

function formatReviews(value) {
  if (value === null || value === undefined || value === "") {
    return "Reviews not shown";
  }

  return `${value} reviews`;
}

function getFeatureBullets(item) {
  return Array.isArray(item?.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
}

function getRatingValue(value) {
  const rating = Number(value);

  return Number.isFinite(rating) ? rating : null;
}

function SnapshotPill({ label, value }) {
  return (
    <View className="min-w-[120px] flex-1 rounded-2xl border border-line bg-white px-3 py-3">
      <Text className="text-xs font-medium uppercase tracking-[1.2px] text-slate-500">{label}</Text>
      <Text className="mt-1 text-sm font-semibold leading-5 text-slate-900">{value}</Text>
    </View>
  );
}

function DetailTextSection({ label, value }) {
  return (
    <View className="border-b border-line py-4">
      <Text className="text-xs font-medium uppercase tracking-[1.4px] text-slate-500">{label}</Text>
      <Text className="mt-2 text-base leading-6 text-slate-900">{value}</Text>
    </View>
  );
}

function FeatureBulletList({ bullets }) {
  if (!bullets.length) {
    return (
      <Text className="mt-2 text-base leading-6 text-slate-900">
        Feature notes are not available for this pick yet. Use the retailer page to confirm the
        current listing details.
      </Text>
    );
  }

  return (
    <View className="mt-2 gap-2">
      {bullets.map((bullet, index) => (
        <View key={`${bullet}-${index}`} className="flex-row gap-2">
          <Text className="text-base leading-6 text-accent">-</Text>
          <Text className="flex-1 text-base leading-6 text-slate-900">{String(bullet)}</Text>
        </View>
      ))}
    </View>
  );
}

function DetailRatingStars({ rating }) {
  const ratingValue = getRatingValue(rating);
  const roundedRating = ratingValue === null ? 0 : Math.round(ratingValue);

  return (
    <View className="flex-row gap-0.5" accessibilityLabel={formatRating(rating)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Text
          key={index}
          className={
            index < roundedRating
              ? "text-base leading-5 text-amber-500"
              : "text-base leading-5 text-slate-300"
          }
        >
          *
        </Text>
      ))}
    </View>
  );
}

export function SearchResultDetailOverview({ item, rank }) {
  const provider = detailValue(item.provider, "Unknown source");
  const price = detailValue(item.price, "Price not shown");
  const rating = formatRating(item.rating);
  const reviews = formatReviews(item.reviewCount);

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <View className="flex-row flex-wrap items-center gap-2">
        <View className="rounded-full bg-accent px-3 py-1">
          <Text className="text-xs font-semibold text-white">
            {rank === 1 ? "Best match" : rank ? `Pick #${rank}` : "Focused pick"}
          </Text>
        </View>
        <Text className="text-sm font-medium text-slate-600">{provider}</Text>
      </View>
      <Text className="mt-3 text-2xl font-semibold text-accent">{price}</Text>
      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <DetailRatingStars rating={item.rating} />
        <Text className="text-sm font-medium text-slate-600">
          {rating} - {reviews}
        </Text>
      </View>
    </View>
  );
}

export function SearchResultFeatureHighlights({ item }) {
  const featureBullets = getFeatureBullets(item);

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <Text className="text-sm font-semibold text-slate-900">What stands out</Text>
      <FeatureBulletList bullets={featureBullets} />
    </View>
  );
}

export function SearchResultDetailSnapshot({ item, rank }) {
  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <Text className="text-sm font-semibold text-slate-900">At a glance</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <SnapshotPill label="Shortlist" value={rank ? `Pick #${rank}` : "Focused pick"} />
        <SnapshotPill label="Source" value={detailValue(item.provider, "Unknown source")} />
        <SnapshotPill label="Price" value={detailValue(item.price, "Price not shown")} />
        <SnapshotPill label="Rating" value={formatRating(item.rating)} />
        <SnapshotPill label="Reviews" value={formatReviews(item.reviewCount)} />
      </View>
    </View>
  );
}

export function SearchResultDetailMetadata({ item }) {
  const featureBullets = getFeatureBullets(item);
  const hasReasoning = Boolean(item.fit_reason || item.caveat || featureBullets.length);

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-2">
      <Text className="py-3 text-sm font-semibold text-slate-900">Decision notes</Text>
      <DetailTextSection
        label="Why this pick"
        value={detailValue(
          item.fit_reason,
          "The assistant has not added a specific fit reason for this pick yet.",
        )}
      />
      <DetailTextSection
        label="Worth knowing"
        value={detailValue(
          item.caveat,
          "No specific caveat is available for this pick yet. Treat the retailer listing as the final source for availability, sizing, seller, and shipping details.",
        )}
      />
      {!hasReasoning ? (
        <Text className="border-t border-line py-4 text-sm leading-5 text-slate-500">
          Extra analysis was not available on this pick yet, so this screen is staying close to the
          finalized product data already on your device.
        </Text>
      ) : null}
    </View>
  );
}
