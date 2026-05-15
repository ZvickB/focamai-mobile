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
      {item.fit_reason ? <DetailMetadataRow label="Why this pick" value={item.fit_reason} /> : null}
      {item.caveat ? <DetailMetadataRow label="Worth knowing" value={item.caveat} /> : null}
    </View>
  );
}
