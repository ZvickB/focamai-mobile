import { Linking, Text } from "react-native";
import {
  Button,
  ScreenContainer,
  ScreenIntro,
  Surface,
  QuietStatusPanel,
} from "../components/MobileUI";
import {
  detailValue,
  SearchResultDetailHero,
  SearchResultDetailMetadata,
  SearchResultDetailSnapshot,
  SearchResultFeatureHighlights,
} from "../search/SearchResultDetailMetadata";
import { AffiliateDisclosureNote } from "../search/AffiliateDisclosureNote";
import { useSearchFlow } from "../search/SearchFlowContext";

function openRetailerLink(link) {
  if (!link) {
    return;
  }

  Linking.openURL(link).catch(() => {});
}

function DetailRetailerCta({ item }) {
  const provider = detailValue(item.provider, "the retailer");

  return (
    <Surface>
      <Text className="text-sm font-semibold text-slate-900">Check availability</Text>
      <Text className="mt-2 text-sm leading-5 text-slate-600">
        Confirm current price, availability, shipping, and seller details with {provider} before
        buying.
      </Text>
      {item.link ? (
        <Button
          accessibilityRole="link"
          accessibilityLabel={`View ${detailValue(item.title, "this product")} on ${provider}`}
          className="mt-4"
          onPress={() => openRetailerLink(item.link)}
        >
          View retailer
        </Button>
      ) : (
        <QuietStatusPanel className="mt-4">
          <Text className="text-sm font-semibold text-slate-600">Retailer link unavailable</Text>
          <Text className="mt-1 text-sm leading-5 text-slate-500">
            Search the retailer directly to confirm the current listing before making a decision.
          </Text>
        </QuietStatusPanel>
      )}
      <Text className="mt-3 text-xs leading-5 text-slate-500">
        Pricing, availability, shipping, and seller details can change after Focamai builds the
        shortlist.
      </Text>
      {item.link ? <AffiliateDisclosureNote className="mt-2" /> : null}
    </Surface>
  );
}

export default function SearchResultDetailScreen({ route }) {
  const { finalResults } = useSearchFlow();
  const candidateId = route.params?.candidateId;
  const routeItem = route.params?.item;
  const routeRank = route.params?.rank;
  const matchedIndex = candidateId
    ? finalResults.findIndex((result) => String(result.id) === String(candidateId))
    : -1;
  const item = matchedIndex >= 0 ? finalResults[matchedIndex] : routeItem || {};
  const rank = routeRank || (matchedIndex >= 0 ? matchedIndex + 1 : undefined);

  return (
    <ScreenContainer testID="detail.screen">
      <ScreenIntro
        eyebrow={`Focused pick ${rank ? `#${rank}` : ""}`}
        title="Product details"
        description="A quick decision view before you leave for the retailer."
      />

      <SearchResultDetailHero item={item} rank={rank} />
      <SearchResultDetailMetadata item={item} />
      <SearchResultFeatureHighlights item={item} />
      <DetailRetailerCta item={item} />
      <SearchResultDetailSnapshot item={item} rank={rank} />
    </ScreenContainer>
  );
}
