import { Text } from "react-native";

export function AffiliateDisclosureNote({ className = "mt-2" }) {
  return (
    <Text className={`${className} text-xs leading-4 text-slate-500`}>
      As an Amazon Associate I earn from qualifying purchases.
    </Text>
  );
}
