import { useState } from "react";
import { ChevronDown, History, Trash2 } from "lucide-react-native";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import {
  AppHeader,
  Button,
  HeaderBackButton,
  ProductImageFrame,
  ScreenContainer,
  Surface,
  cx,
} from "../components/MobileUI";
import { useAuth } from "../contexts/useAuth";
import { useSearchHistory } from "../components/history/useSearchHistory";
import { getProductDisplayTitle } from "../search/productTitle";

function formatSavedDate(value) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getProductTitle(item, index) {
  return getProductDisplayTitle(item?.title || item?.name || `Pick ${index + 1}`);
}

function getProductMeta(item) {
  return [
    item?.price,
    item?.rating ? `${item.rating} rating` : "",
    item?.reviewCount ? `${item.reviewCount} reviews` : "",
  ].filter(Boolean).join(" | ");
}

function HistoryHeader({ onBack }) {
  return (
    <AppHeader
      left={<HeaderBackButton label="Settings" onPress={onBack} testID="history.backButton" />}
      right={<View className="h-11 w-11" />}
    />
  );
}

function HistoryIntro({ entriesCount, isSignedIn, onClear }) {
  return (
    <View className="gap-3">
      <View className="gap-2">
        <Text className="text-[28px] font-semibold leading-[35px] text-ink">
          Search history
        </Text>
        <Text className="text-[15px] leading-6 text-stone-600">
          {isSignedIn
            ? "Your searches are synced to your account."
            : "Completed searches are saved on this device after Focamai narrows them to six picks."}
        </Text>
      </View>
      {entriesCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          className="min-h-[44px] self-start justify-center"
          onPress={onClear}
          testID="history.clearButton"
        >
          <Text className="text-sm font-semibold text-accent">Clear history</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function HistoryPickPreview({ item, index }) {
  const title = getProductTitle(item, index);
  const meta = getProductMeta(item);

  return (
    <View className="flex-row gap-3 border-b border-line py-3" testID={`history.pick.${index + 1}`}>
      <ProductImageFrame
        containerClassName="h-14 w-14"
        frameClassName="rounded-[14px] border border-line bg-white p-1"
        image={item?.image}
        imageClassName="rounded-[10px]"
        moderation={item?.moderation}
        title={title}
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-sm font-semibold leading-5 text-ink" numberOfLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text className="text-xs leading-4 text-stone-500" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function HistoryEntryCard({ entry, isOpen, onRemove, onRerun, onToggle }) {
  const results = Array.isArray(entry.results) ? entry.results : [];
  const savedDate = formatSavedDate(entry.updatedAt || entry.createdAt);
  const resultCountText = `${results.length} ${results.length === 1 ? "pick" : "picks"}`;

  return (
    <Surface className="gap-4" testID={`history.entry.${entry.id}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        className="flex-row items-start gap-3"
        onPress={onToggle}
        testID={`history.entryToggle.${entry.id}`}
      >
        <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-cream">
          <History color="#0F6175" size={18} strokeWidth={2.2} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base font-semibold leading-6 text-ink" numberOfLines={2}>
            {entry.query}
          </Text>
          <Text className="text-sm leading-5 text-stone-600" numberOfLines={2}>
            {entry.followUp || "No extra notes added."}
          </Text>
          <Text className="text-xs font-medium text-stone-500">
            {[savedDate, resultCountText].filter(Boolean).join(" | ")}
          </Text>
        </View>
        <ChevronDown
          color="#78716c"
          size={18}
          strokeWidth={2.2}
          style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
        />
      </Pressable>

      <View className="flex-row gap-2">
        <Button
          className="min-h-[46px] flex-1"
          onPress={onRerun}
          testID={`history.rerun.${entry.id}`}
          variant="secondary"
        >
          Re-run
        </Button>
        <Pressable
          accessibilityLabel={`Delete history entry for ${entry.query}`}
          accessibilityRole="button"
          className="h-[46px] w-[52px] items-center justify-center rounded-[18px] border border-line bg-white"
          onPress={onRemove}
          testID={`history.delete.${entry.id}`}
        >
          <Trash2 color="#78716c" size={18} strokeWidth={2.2} />
        </Pressable>
      </View>

      {isOpen ? (
        results.length > 0 ? (
          <View className="border-t border-line pt-1">
            {results.map((item, index) => (
              <HistoryPickPreview
                index={index}
                item={item}
                key={item?.id || item?.asin || item?.link || `${entry.id}-${index}`}
              />
            ))}
          </View>
        ) : (
          <View className="rounded-[18px] border border-line bg-cream px-4 py-3">
            <Text className="text-sm leading-5 text-stone-600">
              This saved search has no stored picks.
            </Text>
          </View>
        )
      ) : null}
    </Surface>
  );
}

export default function HistoryScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isCompact = width <= 415;
  const { user } = useAuth();
  const { clear, entries, error, loading, remove } = useSearchHistory();
  const [openEntryId, setOpenEntryId] = useState("");
  const returnTo = route?.params?.returnTo || "Settings";

  function rerunSearch(entry) {
    navigation.navigate("Search", {
      historySearch: {
        followUp: entry.followUp,
        query: entry.query,
      },
    });
  }

  return (
    <ScreenContainer
      testID="history.screen"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: isCompact ? 18 : 22,
        paddingHorizontal: isCompact ? 16 : 24,
        paddingTop: 14,
        paddingBottom: isCompact ? 24 : 32,
      }}
    >
      <View className="w-full max-w-[430px] self-center">
        <HistoryHeader onBack={() => navigation.navigate(returnTo)} />
      </View>

      <View className={cx("w-full max-w-[430px] self-center", isCompact ? "gap-5" : "gap-6")}>
        <HistoryIntro entriesCount={entries.length} isSignedIn={Boolean(user)} onClear={clear} />

        {loading ? (
          <Surface variant="quiet">
            <Text className="text-sm leading-5 text-stone-600">Loading saved searches...</Text>
          </Surface>
        ) : error ? (
          <Surface className="border-secondary" variant="quiet">
            <Text className="text-sm leading-5 text-stone-600">{error}</Text>
          </Surface>
        ) : entries.length > 0 ? (
          <View className="gap-4">
            {entries.map((entry) => (
              <HistoryEntryCard
                entry={entry}
                isOpen={openEntryId === entry.id}
                key={entry.id}
                onRemove={() => remove(entry.id)}
                onRerun={() => rerunSearch(entry)}
                onToggle={() =>
                  setOpenEntryId((currentId) => (currentId === entry.id ? "" : entry.id))
                }
              />
            ))}
          </View>
        ) : (
          <Surface className="items-start gap-4" variant="quiet">
            <View className="gap-2">
              <Text className="text-lg font-semibold text-ink">No saved searches yet.</Text>
              <Text className="text-sm leading-6 text-stone-600">
                Run a search and choose focused picks. Once the six results are ready, they will
                show up here.
              </Text>
            </View>
            <Button onPress={() => navigation.navigate("Search")} testID="history.startSearchButton">
              Start a search
            </Button>
          </Surface>
        )}
      </View>
    </ScreenContainer>
  );
}
