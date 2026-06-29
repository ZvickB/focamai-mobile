import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Bell, ChevronDown, ExternalLink, Trash2 } from "lucide-react-native";

import {
  AppHeader,
  Button,
  HeaderBackButton,
  ProductImageFrame,
  QuietStatusPanel,
  ScreenContainer,
  Surface,
} from "../components/MobileUI";
import { useWatches } from "../components/watch/useWatches";
import { useAuth } from "../contexts/useAuth";
import { MAX_PRICE_WATCHES } from "../lib/watch/watchStore";

function formatMoney(value, amazonDomain = "amazon.com") {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return "—";
  const currency = amazonDomain === "amazon.ca" ? "CAD" : "USD";
  try {
    return new Intl.NumberFormat(amazonDomain === "amazon.ca" ? "en-CA" : "en-US", {
      currency,
      style: "currency",
    }).format(numericValue);
  } catch {
    return `${currency} ${numericValue.toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) return "Waiting for first price check";
  try {
    return `Checked ${new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))}`;
  } catch {
    return "Price checked";
  }
}

function openProduct(url) {
  if (!url) return;
  Linking.openURL(url).catch(() =>
    Alert.alert("Could not open link", "No browser was found on this device."),
  );
}

function PriceWatchesHeader({ onBack }) {
  return (
    <AppHeader
      left={<HeaderBackButton label="Settings" onPress={onBack} testID="watches.backButton" />}
      right={<View className="h-11 w-11" />}
    />
  );
}

function PriceFact({ label, value, accent = false }) {
  return (
    <View className="flex-1 rounded-[16px] bg-cream px-3 py-3">
      <Text className="text-xs font-medium text-stone-500">{label}</Text>
      <Text className={accent ? "mt-1 text-sm font-semibold text-accent" : "mt-1 text-sm font-semibold text-ink"}>
        {value}
      </Text>
    </View>
  );
}

function WatchCard({ onRemove, onUpdate, watch }) {
  const [expanded, setExpanded] = useState(false);
  const [threshold, setThreshold] = useState(String(watch.thresholdPct || 5));
  const [target, setTarget] = useState(watch.targetPrice ? String(watch.targetPrice) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setThreshold(String(watch.thresholdPct || 5));
    setTarget(watch.targetPrice ? String(watch.targetPrice) : "");
  }, [watch.targetPrice, watch.thresholdPct]);

  async function saveChanges() {
    const thresholdValue = Number(threshold);
    const targetValue = target.trim() ? Number(target) : null;
    if (!Number.isFinite(thresholdValue) || thresholdValue <= 0 || thresholdValue > 100) {
      setError("Price drop percentage must be between 1 and 100.");
      return;
    }
    if (targetValue !== null && (!Number.isFinite(targetValue) || targetValue <= 0)) {
      setError("Target price must be a positive amount or left blank.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onUpdate(watch.id, { targetPrice: targetValue, thresholdPct: thresholdValue });
      setExpanded(false);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update this watch.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePaused() {
    setSaving(true);
    setError("");
    try {
      await onUpdate(watch.id, { paused: !watch.paused });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update this watch.");
    } finally {
      setSaving(false);
    }
  }

  async function removeWatch() {
    setSaving(true);
    setError("");
    try {
      await onRemove(watch.id);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove this watch.");
      setSaving(false);
    }
  }

  return (
    <Surface className="gap-4" testID={`watches.item.${watch.id}`}>
      <View className="flex-row gap-3">
        <ProductImageFrame containerClassName="h-20 w-20" image={watch.imageUrl} title={watch.productTitle} />
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-semibold leading-6 text-ink" numberOfLines={2}>
            {watch.productTitle || watch.asin}
          </Text>
          <Text className="text-xs leading-5 text-stone-500" numberOfLines={2}>
            {[watch.asin, watch.amazonDomain, formatDate(watch.lastCheckedAt)].filter(Boolean).join(" | ")}
          </Text>
          <Text className={watch.paused ? "text-xs font-semibold text-amber-700" : "text-xs font-semibold text-accent"}>
            {watch.paused ? "Paused — still counts toward your limit" : "Active email alert"}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <PriceFact label="Alert baseline" value={formatMoney(watch.baselinePrice, watch.amazonDomain)} />
        <PriceFact
          accent
          label="Last seen"
          value={formatMoney(watch.lastSeenPrice || watch.baselinePrice, watch.amazonDomain)}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="min-h-[44px] flex-row items-center justify-between border-t border-line pt-3"
        onPress={() => setExpanded((current) => !current)}
      >
        <Text className="text-sm font-semibold text-ink">Alert settings</Text>
        <ChevronDown
          color="#78716c"
          size={18}
          strokeWidth={2.2}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      {expanded ? (
        <View className="gap-4" testID={`watches.editor.${watch.id}`}>
          <View className="gap-2">
            <Text className="text-sm font-semibold text-stone-700">Drop alert percentage</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                className="h-12 flex-1 rounded-[18px] border border-line bg-white px-4 text-base text-ink"
                keyboardType="decimal-pad"
                onChangeText={setThreshold}
                testID={`watches.threshold.${watch.id}`}
                value={threshold}
              />
              <Text className="text-base font-semibold text-stone-500">%</Text>
            </View>
          </View>
          <View className="gap-2">
            <Text className="text-sm font-semibold text-stone-700">Target price (optional)</Text>
            <TextInput
              className="h-12 rounded-[18px] border border-line bg-white px-4 text-base text-ink"
              keyboardType="decimal-pad"
              onChangeText={setTarget}
              placeholder="No target price"
              placeholderTextColor="#a8a29e"
              testID={`watches.target.${watch.id}`}
              value={target}
            />
          </View>
          {error ? <Text className="text-sm leading-6 text-red-700">{error}</Text> : null}
          <Button disabled={saving} onPress={saveChanges}>Save changes</Button>
        </View>
      ) : null}

      {!expanded && error ? <Text className="text-sm leading-6 text-red-700">{error}</Text> : null}

      <View className="flex-row gap-2">
        <Button className="min-h-[46px] flex-1" disabled={saving} onPress={togglePaused} variant="secondary">
          {watch.paused ? "Resume" : "Pause"}
        </Button>
        <Pressable
          accessibilityLabel={`Remove watch for ${watch.productTitle || watch.asin}`}
          accessibilityRole="button"
          className="h-[46px] w-[52px] items-center justify-center rounded-[18px] border border-line bg-white"
          onPress={() => Alert.alert(
            "Remove price watch?",
            "Focamai will stop checking this product and sending price-drop emails.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Remove", style: "destructive", onPress: () => void removeWatch() },
            ],
          )}
        >
          <Trash2 color="#78716c" size={18} strokeWidth={2.2} />
        </Pressable>
      </View>

      {watch.productUrl ? (
        <Pressable
          accessibilityRole="link"
          className="min-h-[44px] flex-row items-center justify-center gap-2"
          onPress={() => openProduct(watch.productUrl)}
        >
          <Text className="text-sm font-semibold text-accent">View on Amazon</Text>
          <ExternalLink color="#0F6175" size={15} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </Surface>
  );
}

export default function PriceWatchesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const { configured, user } = useAuth();
  const { error, loading, refresh, remove, update, watches } = useWatches({ enabled: Boolean(user) });

  useFocusEffect(useCallback(() => {
    if (user) void refresh();
  }, [refresh, user]));

  return (
    <ScreenContainer
      safeAreaEdges={["top", "bottom"]}
      testID="watches.screen"
      contentContainerStyle={{
        gap: isCompact ? 16 : 20,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center gap-5">
        <PriceWatchesHeader onBack={() => navigation.goBack()} />
        <View className="gap-2">
          <View className="flex-row items-end justify-between gap-3">
            <Text className="text-[28px] font-semibold leading-[35px] text-ink">Price watches</Text>
            {user ? <Text className="pb-1 text-sm font-semibold text-stone-500">{watches.length}/{MAX_PRICE_WATCHES}</Text> : null}
          </View>
          <Text className="text-[15px] leading-6 text-stone-600">
            Focamai checks finalized Amazon picks and emails you when a watched price reaches your alert.
          </Text>
        </View>

        {!configured ? (
          <QuietStatusPanel>
            <Text className="text-sm leading-6 text-stone-600">Account features are not configured in this build.</Text>
          </QuietStatusPanel>
        ) : !user ? (
          <Surface className="items-center gap-3 py-8">
            <Bell color="#0F6175" size={30} strokeWidth={1.8} />
            <Text className="text-lg font-semibold text-ink">Sign in to watch prices</Text>
            <Text className="text-center text-sm leading-6 text-stone-600">
              Watches are tied to your account so price-drop emails and settings work across devices.
            </Text>
            <Button
              className="mt-2 w-full"
              onPress={() => navigation.navigate("Auth", { backLabel: "Price watches" })}
            >
              Sign in
            </Button>
          </Surface>
        ) : loading ? (
          <QuietStatusPanel><Text className="text-sm text-stone-600">Loading price watches...</Text></QuietStatusPanel>
        ) : error ? (
          <Surface className="gap-3 border-red-200 bg-red-50">
            <Text className="text-sm leading-6 text-red-700">{error}</Text>
            <Button onPress={refresh} variant="secondary">Try again</Button>
          </Surface>
        ) : watches.length === 0 ? (
          <Surface className="items-center gap-3 py-8">
            <Bell color="#0F6175" size={30} strokeWidth={1.8} />
            <Text className="text-lg font-semibold text-ink">No price watches yet</Text>
            <Text className="text-center text-sm leading-6 text-stone-600">
              Run a search, open a finalized pick, and choose Watch price.
            </Text>
            <Button className="mt-2 w-full" onPress={() => navigation.navigate("Search")}>Start a search</Button>
          </Surface>
        ) : (
          watches.map((watch) => (
            <WatchCard key={watch.id} onRemove={remove} onUpdate={update} watch={watch} />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}
