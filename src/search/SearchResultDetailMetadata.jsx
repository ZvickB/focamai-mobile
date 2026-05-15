import { Text, View } from "react-native";

export function detailValue(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function formatRating(value) {
  return detailValue(value, "Rating not shown");
}

function formatReviews(value) {
  return detailValue(value, "Reviews not shown");
}

function getFeatureBullets(item) {
  return Array.isArray(item?.feature_bullets)
    ? item.feature_bullets.map((bullet) => String(bullet).trim()).filter(Boolean)
    : [];
}

function SnapshotPill({ label, value }) {
  return (
    <View className="min-w-[120px] flex-1 rounded-2xl border border-line bg-white px-3 py-3">
      <Text className="text-xs font-medium uppercase tracking-[1.2px] text-slate-500">{label}</Text>
      <Text className="mt-1 text-sm font-semibold leading-5 text-slate-900">{value}</Text>
    </View>
  );
}

function DetailMetadataRow({ label, value }) {
  return (
    <View className="border-b border-line py-3">
      <Text className="text-xs font-medium uppercase tracking-[1.4px] text-slate-500">{label}</Text>
      <Text className="mt-1 text-base leading-6 text-slate-900">{value}</Text>
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
        Feature notes are not available for this pick yet.
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

function DetailFeatureSection({ bullets }) {
  return (
    <View className="py-4">
      <Text className="text-xs font-medium uppercase tracking-[1.4px] text-slate-500">
        Feature notes
      </Text>
      <FeatureBulletList bullets={bullets} />
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

export function SearchResultDetailMetadata({ item, rank }) {
  const featureBullets = getFeatureBullets(item);

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-2">
      <DetailMetadataRow
        label="Shortlist position"
        value={rank ? `Focused pick #${rank}` : "Focused pick"}
      />
      <DetailMetadataRow label="Source" value={detailValue(item.provider, "Unknown source")} />
      <DetailMetadataRow label="Price" value={detailValue(item.price, "Price not shown")} />
      <DetailMetadataRow label="Rating" value={formatRating(item.rating)} />
      <DetailMetadataRow label="Reviews" value={formatReviews(item.reviewCount)} />
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
          "No specific caveat is available for this pick yet.",
        )}
      />
      <DetailFeatureSection bullets={featureBullets} />
    </View>
  );
}
