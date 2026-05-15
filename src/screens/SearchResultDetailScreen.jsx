import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  detailValue,
  SearchResultDetailMetadata,
  SearchResultDetailSnapshot,
} from "../search/SearchResultDetailMetadata";

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
            A closer look at the finalized shortlist metadata already on device.
          </Text>
        </View>

        <SearchResultDetailSnapshot item={item} rank={rank} />
        <SearchResultDetailMetadata item={item} rank={rank} />
      </ScrollView>
    </SafeAreaView>
  );
}
