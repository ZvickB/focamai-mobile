import { Text, View } from "react-native";

export function detailValue(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function DetailMetadataRow({ label, value }) {
  return (
    <View className="border-b border-line py-3">
      <Text className="text-xs font-medium uppercase tracking-[1.4px] text-slate-500">{label}</Text>
      <Text className="mt-1 text-base leading-6 text-slate-900">{value}</Text>
    </View>
  );
}

export function SearchResultDetailMetadata({ item }) {
  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-2">
      <DetailMetadataRow label="Source" value={detailValue(item.provider, "Unknown source")} />
      <DetailMetadataRow label="Price" value={detailValue(item.price, "Price not shown")} />
      <DetailMetadataRow label="Rating" value={detailValue(item.rating, "Rating not shown")} />
      <DetailMetadataRow
        label="Reviews"
        value={detailValue(item.reviewCount, "Reviews not shown")}
      />
    </View>
  );
}
