import { Text } from "react-native";

const AFFILIATE_TAGGED_AMAZON_DOMAINS = new Set(["amazon.com", "amazon.ca"]);

export function AffiliateDisclosureNote({ amazonDomain, className = "mt-2" }) {
  if (!AFFILIATE_TAGGED_AMAZON_DOMAINS.has(amazonDomain)) {
    return null;
  }

  return (
    <Text className={`${className} text-xs leading-4 text-slate-500`}>
      As an Amazon Associate I earn from qualifying purchases.
    </Text>
  );
}
