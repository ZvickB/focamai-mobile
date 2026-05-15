import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AffiliateDisclosureScreen() {
  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-mist">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
      >
        <Text className="text-xs font-medium uppercase tracking-widest text-accent">
          Affiliate Disclosure
        </Text>
        <Text className="mt-3 text-3xl font-semibold leading-tight text-ink">
          How affiliate links work in this app.
        </Text>
        <Text className="mt-3 text-base leading-6 text-slate-500">
          Focamai participates in the Amazon Associates program. This page explains what that means
          for you.
        </Text>

        <View className="mt-8 gap-5">
          <Text className="text-base leading-7 text-slate-600">
            Focamai is a participant in the Amazon Services LLC Associates Program, an affiliate
            advertising program designed to provide a means for apps to earn advertising fees by
            advertising and linking to Amazon.com.
          </Text>
          <Text className="text-base leading-7 text-slate-600">
            When you tap a product link in Focamai and make a purchase on Amazon, Focamai may earn
            a small commission at no extra cost to you. This is how the app is supported.
          </Text>
          <Text className="text-base leading-7 text-slate-600">
            Affiliate relationships do not influence which products are recommended. Picks are
            selected by the AI based on your search and refinement input — not by commission
            potential or advertiser relationships.
          </Text>
          <View className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Text className="text-sm leading-6 text-slate-700">
              As an Amazon Associate I earn from qualifying purchases.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
