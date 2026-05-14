import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function detailValue(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function DetailLine({ label, value }) {
  return (
    <View className="border-b border-line py-3">
      <Text className="text-xs font-medium uppercase tracking-[1.4px] text-slate-500">{label}</Text>
      <Text className="mt-1 text-base leading-6 text-slate-900">{value}</Text>
    </View>
  );
}

export default function SearchResultDetailScreen({ route }) {
  const item = route.params?.item || {};
  const rank = route.params?.rank;

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, gap: 18 }}
      >
        <View>
          <Text className="text-[12px] font-medium uppercase tracking-[2px] text-accent">
            Focused pick {rank ? `#${rank}` : ""}
          </Text>
          <Text className="mt-2 text-2xl font-semibold leading-8 text-ink">
            {detailValue(item.title, "Untitled product")}
          </Text>
          <Text className="mt-3 text-base leading-6 text-slate-600">
            This is a plain detail checkpoint using the finalized result metadata already on device.
          </Text>
        </View>

        <View className="rounded-2xl border border-line bg-white px-4 py-2">
          <DetailLine label="Source" value={detailValue(item.provider, "Unknown source")} />
          <DetailLine label="Price" value={detailValue(item.price, "Price not shown")} />
          <DetailLine label="Rating" value={detailValue(item.rating, "Rating not shown")} />
          <DetailLine label="Reviews" value={detailValue(item.reviewCount, "Reviews not shown")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
