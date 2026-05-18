import { Text, View } from "react-native";
import { ProductImageFrame, Surface } from "../components/MobileUI";

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
    <View className="min-w-[120px] flex-1 rounded-lg border border-line bg-cream px-3 py-3">
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
        Feature notes may still be catching up. Confirm the latest specs, sizing, and included
        parts on the retailer page before buying.
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

export function DetailRatingStars({ rating }) {
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

export function SearchResultDetailHero({ item, rank }) {
  const provider = detailValue(item.provider, "Unknown source");
  const price = detailValue(item.price, "Price not shown");
  const rating = formatRating(item.rating);
  const reviews = formatReviews(item.reviewCount);

  return (
    <View className="gap-4">
      <ProductImageFrame
        containerClassName="h-64 w-full"
        image={item.image}
        imageClassName="rounded-md"
        title={detailValue(item.title, "Focused pick")}
      />
      <View>
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="rounded-full bg-accent px-3 py-1">
            <Text className="text-xs font-semibold text-white">
              {rank ? `Pick #${rank}` : "Focused pick"}
            </Text>
          </View>
          <Text className="text-sm font-medium text-stone-600">{provider}</Text>
        </View>
        <Text className="mt-3 text-[26px] font-semibold leading-[33px] text-ink">
          {detailValue(item.title, "Untitled product")}
        </Text>
        <View className="mt-3 flex-row flex-wrap items-center gap-3">
          <Text className="text-2xl font-semibold text-accent">{price}</Text>
          <View className="flex-row items-center gap-2">
            <DetailRatingStars rating={item.rating} />
            <Text className="text-sm font-medium text-stone-600">
              {rating} - {reviews}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function SearchResultFeatureHighlights({ item }) {
  const featureBullets = getFeatureBullets(item);

  return (
    <Surface>
      <Text className="text-sm font-semibold text-slate-900">Feature notes</Text>
      <FeatureBulletList bullets={featureBullets} />
    </Surface>
  );
}

export function SearchResultDetailSnapshot({ item, rank }) {
  return (
    <Surface>
      <Text className="text-sm font-semibold text-slate-900">At a glance</Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <SnapshotPill label="Shortlist" value={rank ? `Pick #${rank}` : "Focused pick"} />
        <SnapshotPill label="Source" value={detailValue(item.provider, "Unknown source")} />
        <SnapshotPill label="Price" value={detailValue(item.price, "Price not shown")} />
        <SnapshotPill label="Rating" value={formatRating(item.rating)} />
        <SnapshotPill label="Reviews" value={formatReviews(item.reviewCount)} />
      </View>
    </Surface>
  );
}

export function SearchResultDetailMetadata({ item }) {
  const featureBullets = getFeatureBullets(item);
  const hasReasoning = Boolean(item.fit_reason || item.caveat || featureBullets.length);

  return (
    <Surface className="py-2">
      <Text className="py-3 text-sm font-semibold text-slate-900">Decision notes</Text>
      <DetailTextSection
        label="Why this pick"
        value={detailValue(
          item.fit_reason,
          "The assistant may still be adding the specific fit reason. For now, use the product facts and retailer listing to judge whether it matches your needs.",
        )}
      />
      <DetailTextSection
        label="Worth knowing"
        value={detailValue(
          item.caveat,
          "No specific caveat is available yet. Treat the retailer listing as the final source for availability, sizing, seller, and shipping details.",
        )}
      />
      {!hasReasoning ? (
        <Text className="border-t border-line py-4 text-sm leading-5 text-slate-500">
          If extra analysis finishes while this page is open, these notes can fill in without
          changing the shortlist order.
        </Text>
      ) : null}
    </Surface>
  );
}
