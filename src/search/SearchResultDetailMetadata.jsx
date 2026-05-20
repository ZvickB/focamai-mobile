import { CheckCircle2, Info, ShieldCheck, Sparkles, Star } from "lucide-react-native";
import { Text, View } from "react-native";
import { ProductImageFrame, Surface } from "../components/MobileUI";

export function detailValue(value, fallback) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    typeof value === "object" ||
    typeof value === "function"
  ) {
    return fallback;
  }

  return String(value);
}

function formatRating(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") {
    return "Rating not shown";
  }

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

  if (typeof value === "number") {
    return `${value} reviews`;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    return trimmedValue ? `${trimmedValue} reviews` : "Reviews not shown";
  }

  return "Reviews not shown";
}

function getFeatureBullets(item) {
  return Array.isArray(item?.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
}

function getRatingValue(value) {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") {
    return null;
  }

  const rating = Number(value);

  return Number.isFinite(rating) ? rating : null;
}

function getEnrichmentCopy(enrichmentStatus) {
  if (enrichmentStatus === "running") {
    return {
      caveat:
        "Focamai is still checking for a clearer caveat. Confirm availability, sizing, seller, and shipping details on the retailer page before buying.",
      feature:
        "Feature notes are still catching up. Confirm the latest specs, sizing, and included parts on the retailer page before buying.",
      reason:
        "Focamai is still checking for a clearer fit reason. For now, use the product facts and retailer listing to judge whether it matches your needs.",
      status:
        "Extra analysis is still running. These notes can fill in without changing the shortlist order.",
    };
  }

  if (enrichmentStatus === "complete") {
    return {
      caveat:
        "Extra analysis did not return a specific caveat for this pick. Still treat the retailer listing as the final source for availability, sizing, seller, and shipping details.",
      feature:
        "Extra analysis did not return feature notes for this pick. Confirm the latest specs, sizing, and included parts on the retailer page before buying.",
      reason:
        "Extra analysis did not return a specific fit reason for this pick. Use the product facts and retailer listing to decide whether it matches your needs.",
      status:
        "Extra analysis finished, but some notes are limited for this pick. The shortlist order has not changed.",
    };
  }

  if (enrichmentStatus === "timeout") {
    return {
      caveat:
        "Extra analysis was not ready in time to add a specific caveat. Confirm availability, sizing, seller, and shipping details on the retailer page before buying.",
      feature:
        "Feature notes were not ready in time. Confirm the latest specs, sizing, and included parts on the retailer page before buying.",
      reason:
        "Extra analysis was not ready in time to add a specific fit reason. Use the product facts and retailer listing to decide whether it matches your needs.",
      status:
        "Extra analysis was not ready in time, so this page is showing the reliable product facts Focamai already has.",
    };
  }

  return {
    caveat:
      "No specific caveat is available yet. Treat the retailer listing as the final source for availability, sizing, seller, and shipping details.",
    feature:
      "Feature notes may still be catching up. Confirm the latest specs, sizing, and included parts on the retailer page before buying.",
    reason:
      "The assistant may still be adding the specific fit reason. For now, use the product facts and retailer listing to judge whether it matches your needs.",
    status:
      "If extra analysis finishes while this page is open, these notes can fill in without changing the shortlist order.",
  };
}

function SnapshotPill({ label, value }) {
  return (
    <View className="min-w-[120px] flex-1 rounded-[18px] border border-line bg-cream px-3 py-3">
      <Text className="text-xs font-medium uppercase tracking-[1.2px] text-stone-500">{label}</Text>
      <Text className="mt-1 text-sm font-semibold leading-5 text-ink">{value}</Text>
    </View>
  );
}

function DetailTextSection({ icon: Icon, label, tone = "accent", value }) {
  const color = tone === "warning" ? "#dd7b2d" : "#0F6175";

  return (
    <View className="flex-row gap-3 py-4">
      <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-cream">
        <Icon color={color} size={19} strokeWidth={2.1} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-ink">{label}</Text>
        <Text className="mt-2 text-[15px] leading-6 text-stone-700">{value}</Text>
      </View>
    </View>
  );
}

function FeatureBulletList({ bullets, enrichmentStatus }) {
  const enrichmentCopy = getEnrichmentCopy(enrichmentStatus);

  if (!bullets.length) {
    return (
      <Text className="mt-2 text-base leading-6 text-slate-900">
        {enrichmentCopy.feature}
      </Text>
    );
  }

  return (
    <View className="mt-2 gap-2">
      {bullets.map((bullet, index) => (
        <View key={`${bullet}-${index}`} className="flex-row gap-3">
          <CheckCircle2 color="#0F6175" size={19} strokeWidth={2} />
          <Text className="flex-1 text-[15px] leading-6 text-stone-800">{String(bullet)}</Text>
        </View>
      ))}
    </View>
  );
}

export function DetailRatingStars({ rating }) {
  const ratingValue = getRatingValue(rating);

  if (ratingValue === null) {
    return null;
  }

  const roundedRating = Math.round(ratingValue);

  return (
    <View className="flex-row gap-0.5" accessibilityLabel={formatRating(rating)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          color={index < roundedRating ? "#dd7b2d" : "#d8cec0"}
          fill={index < roundedRating ? "#dd7b2d" : "transparent"}
          size={15}
          strokeWidth={2}
        />
      ))}
    </View>
  );
}

function HeroFact({ label, value }) {
  return (
    <View className="rounded-full border border-line bg-cream px-3 py-2">
      <Text className="text-xs font-semibold text-stone-500">{label}</Text>
      <Text className="mt-0.5 text-sm font-semibold text-ink">{value}</Text>
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
        containerClassName="h-72 w-full"
        image={item.image}
        imageClassName="rounded-md"
        title={detailValue(item.title, "Focused pick")}
      />
      <View className="gap-4">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View className="rounded-full border border-line bg-white px-3 py-1.5">
            <Text className="text-xs font-semibold text-accent">
              {rank ? `Pick #${rank}` : "Focused pick"}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <ShieldCheck color="#0F6175" size={17} strokeWidth={2} />
            <Text className="text-sm font-semibold text-stone-600">{provider}</Text>
          </View>
        </View>
        <Text className="text-[31px] font-semibold leading-[38px] text-ink">
          {detailValue(item.title, "Untitled product")}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <HeroFact label="Price" value={price} />
          <HeroFact label="Rating" value={rating} />
          <HeroFact label="Reviews" value={reviews} />
        </View>
        <View className="flex-row items-center gap-2">
          <DetailRatingStars rating={item.rating} />
          <Text className="text-sm font-medium text-stone-600">
            {rating} - {reviews}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function SearchResultFeatureHighlights({ enrichmentStatus = "idle", item }) {
  const featureBullets = getFeatureBullets(item);

  return (
    <Surface className="bg-white">
      <View className="flex-row items-center gap-2">
        <CheckCircle2 color="#0F6175" size={19} strokeWidth={2} />
        <Text className="text-base font-semibold text-ink">Feature notes</Text>
      </View>
      <FeatureBulletList bullets={featureBullets} enrichmentStatus={enrichmentStatus} />
    </Surface>
  );
}

export function SearchResultDetailSnapshot({ item, rank }) {
  return (
    <Surface variant="quiet">
      <View className="flex-row items-center gap-2">
        <Info color="#0F6175" size={18} strokeWidth={2} />
        <Text className="text-base font-semibold text-ink">At a glance</Text>
      </View>
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

export function SearchResultDetailMetadata({ enrichmentStatus = "idle", item }) {
  const featureBullets = getFeatureBullets(item);
  const enrichmentCopy = getEnrichmentCopy(enrichmentStatus);
  const hasReasoning = Boolean(item.fit_reason || item.caveat || featureBullets.length);

  return (
    <Surface className="py-4">
      <DetailTextSection
        icon={Sparkles}
        label="Why this pick"
        value={detailValue(
          item.fit_reason,
          enrichmentCopy.reason,
        )}
      />
      <View className="h-px bg-line" />
      <DetailTextSection
        icon={Info}
        label="Worth knowing"
        tone="warning"
        value={detailValue(
          item.caveat,
          enrichmentCopy.caveat,
        )}
      />
      {!hasReasoning ? (
        <Text className="border-t border-line py-4 text-sm leading-5 text-slate-500">
          {enrichmentCopy.status}
        </Text>
      ) : null}
    </Surface>
  );
}
