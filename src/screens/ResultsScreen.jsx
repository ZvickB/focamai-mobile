import { useCallback, useEffect, useState } from "react";
import { Search, Star } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import {
  AppHeader,
  HeaderBackButton,
  ProductImageFrame,
  ScreenContainer,
  Surface,
} from "../components/MobileUI";
import { FinalizeLoadingState } from "../search/FinalizeLoadingState";
import { SearchProgressStatus } from "../search/SearchProgressStatus";
import { SearchRetrySection } from "../search/SearchRetrySection";
import { SearchResultsSection } from "../search/SearchResultsSection";
import { useSearchFlow } from "../search/SearchFlowContext";

function ResultsTopBar({ onBack, onNewSearch }) {
  return (
    <View className="w-full max-w-[430px] self-center">
      <AppHeader
        left={<HeaderBackButton label="Refine" onPress={onBack} testID="results.backButton" />}
        wordmarkClassName="h-9 w-32"
        right={
          <Pressable
            accessibilityLabel="Start a new search"
            accessibilityRole="button"
            className="min-h-[38px] flex-row items-center gap-1 rounded-full bg-white px-3 shadow-sm"
            onPress={onNewSearch}
            testID="results.newSearchButton"
          >
            <Search color="#14222b" size={16} strokeWidth={2.2} />
            <Text className="text-xs font-semibold text-ink">New</Text>
          </Pressable>
        }
      />
    </View>
  );
}

function ResultsHero() {
  return (
    <View className="gap-3">
      <Text className="text-[32px] font-semibold leading-[39px] text-ink">
        Here are your <Text className="text-ember">6</Text> best picks
      </Text>
      <Text className="text-[15px] leading-6 text-stone-600">
        Carefully selected based on your needs and preferences.
      </Text>
    </View>
  );
}

function getRatingValue(rating) {
  if (rating === null || rating === undefined || rating === "" || typeof rating === "boolean") {
    return null;
  }

  const ratingValue = Number(rating);

  return Number.isFinite(ratingValue) ? ratingValue : null;
}

function truncateAtWord(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim().replace(/\s+/g, " ");

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  const clippedValue = normalizedValue.slice(0, maxLength).trimEnd();
  const lastSpaceIndex = clippedValue.lastIndexOf(" ");
  const wordSafeValue =
    lastSpaceIndex > Math.floor(maxLength * 0.55)
      ? clippedValue.slice(0, lastSpaceIndex)
      : clippedValue;

  return `${wordSafeValue}...`;
}

function SelectedRating({ rating }) {
  const ratingValue = getRatingValue(rating);

  if (ratingValue === null) {
    return <Text className="text-xs font-medium text-stone-500">Rating not shown</Text>;
  }

  const filledStars = Math.max(0, Math.min(5, Math.round(ratingValue)));

  return (
    <View className="flex-row items-center gap-1">
      {[0, 1, 2, 3, 4].map((starIndex) => (
        <Star
          color="#0F6175"
          fill={starIndex < filledStars ? "#0F6175" : "transparent"}
          key={starIndex}
          size={14}
          strokeWidth={2}
        />
      ))}
      <Text className="ml-1 text-xs font-medium text-stone-500">
        {ratingValue.toFixed(1)}
      </Text>
    </View>
  );
}

function SelectedResultImagePanel({ item, onPress }) {
  if (!item) {
    return null;
  }

  const priceLabel = item.price || "Price not shown";
  const displayTitle = truncateAtWord(item.title, 91);

  return (
    <Surface className="overflow-hidden bg-white px-0 py-0">
      <Pressable
        accessibilityLabel={`Open selected result details: ${item.title}`}
        accessibilityRole="button"
        className="flex-row items-center gap-4 px-4 py-4"
        onPress={onPress}
      >
        <View className="min-w-0 flex-1 gap-3">
          <Text
            className="text-base font-semibold leading-[22px] text-ink"
            ellipsizeMode="tail"
            numberOfLines={3}
          >
            {displayTitle}
          </Text>

          <View className="gap-2">
            <Text className="text-base font-semibold text-ink">{priceLabel}</Text>
            <SelectedRating rating={item.rating} />
          </View>
        </View>

        <ProductImageFrame
          containerClassName="h-40 w-[156px]"
          frameClassName="rounded-[18px] bg-white p-2"
          image={item.image}
          title={item.title}
        />
      </Pressable>
    </Surface>
  );
}

export default function ResultsScreen({ navigation }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [resultsSectionY, setResultsSectionY] = useState(0);
  const [focusedPicksY, setFocusedPicksY] = useState(0);
  const [rowLayouts, setRowLayouts] = useState({});
  const {
    applyRetrySuggestion,
    canRetry,
    canRequestRetryAdvice,
    discoverySummary,
    errorMessage,
    finalResults,
    followUpNotes,
    isFinalizing,
    isGeneratingRetryAdvice,
    isGeneratingPrompt,
    phaseEvents,
    previewItems,
    productQuery,
    refinementPrompt,
    requestRetryAdvice,
    retryAdvice,
    retryAdviceError,
    retryCount,
    retryFeedback,
    setRetryFeedback,
    submitRetry,
  } = useSearchFlow();
  const focusedPickCount = Array.isArray(finalResults) ? finalResults.length : 0;
  const finalResultIdentity = Array.isArray(finalResults)
    ? finalResults.map((item) => item?.id || item?.title || "").join("|")
    : "";
  useEffect(() => {
    setSelectedIndex(0);
    setRowLayouts({});
  }, [finalResultIdentity]);

  const safeSelectedIndex =
    focusedPickCount > 0 ? Math.min(selectedIndex, focusedPickCount - 1) : 0;
  const shouldShowFinalizeLoading = isFinalizing && focusedPickCount === 0;
  const shouldShowStatus = Boolean(
    errorMessage || (!shouldShowFinalizeLoading && (isFinalizing || focusedPickCount === 0)),
  );
  const selectedResult = focusedPickCount > 0 ? finalResults[safeSelectedIndex] : null;
  const handleRowLayout = useCallback((index, event) => {
    const { height, y } = event.nativeEvent.layout;

    setRowLayouts((currentLayouts) => ({
      ...currentLayouts,
      [index]: { height, y },
    }));
  }, []);
  const updateSelectedIndexForScroll = useCallback(
    (scrollY) => {
      if (focusedPickCount === 0) {
        return;
      }

      const visibleTop = scrollY + 4;
      const rows = Object.entries(rowLayouts)
        .map(([index, layout]) => ({
          index: Number(index),
          top: resultsSectionY + focusedPicksY + layout.y,
          bottom: resultsSectionY + focusedPicksY + layout.y + layout.height,
        }))
        .filter((row) => row.index >= 0 && row.index < focusedPickCount)
        .sort((firstRow, secondRow) => firstRow.top - secondRow.top);
      const topVisibleRow = rows.find((row) => row.bottom > visibleTop) || rows[0];

      if (topVisibleRow) {
        setSelectedIndex((currentIndex) =>
          currentIndex === topVisibleRow.index ? currentIndex : topVisibleRow.index,
        );
      }
    },
    [focusedPickCount, focusedPicksY, resultsSectionY, rowLayouts],
  );
  const handleScroll = useCallback(
    (event) => {
      updateSelectedIndexForScroll(event.nativeEvent.contentOffset.y);
    },
    [updateSelectedIndexForScroll],
  );
  const fixedHeader = (
    <View className="gap-4 px-6 pb-3 pt-3">
      <ResultsTopBar
        onBack={() => navigation.navigate("FollowUp")}
        onNewSearch={() => navigation.navigate("Search")}
      />

      {shouldShowFinalizeLoading ? null : <ResultsHero />}

      {shouldShowStatus ? (
        <SearchProgressStatus
          discoverySummary={discoverySummary}
          errorMessage={errorMessage}
          finalResults={finalResults}
          hasStartedSearch={focusedPickCount > 0 || isFinalizing}
          isFinalizing={isFinalizing}
          isGeneratingPrompt={isGeneratingPrompt}
          phaseEvents={phaseEvents}
          previewItems={previewItems}
          productQuery={productQuery}
          refinementPrompt={refinementPrompt}
        />
      ) : null}

      {selectedResult ? (
        <SelectedResultImagePanel
          item={selectedResult}
          onPress={() =>
            navigation.navigate("SearchResultDetail", {
              candidateId: selectedResult.id,
              item: selectedResult,
              rank: safeSelectedIndex + 1,
            })
          }
        />
      ) : null}
    </View>
  );
  const scrollContent = shouldShowFinalizeLoading
    ? [
        <FinalizeLoadingState key="finalize-loading" />,
      ]
    : [
        <SearchResultsSection
          key="results"
          finalResults={finalResults}
          isFinalizing={isFinalizing}
          onFocusedPicksLayout={(event) => setFocusedPicksY(event.nativeEvent.layout.y)}
          onOpenResult={(item, index) =>
            navigation.navigate("SearchResultDetail", {
              candidateId: item.id,
              item,
              rank: index + 1,
            })
          }
          onResultsLayout={(event) => setResultsSectionY(event.nativeEvent.layout.y)}
          onRowLayout={handleRowLayout}
          previewItems={previewItems}
          selectedIndex={safeSelectedIndex}
          showEmptyState
        />,
        <SearchRetrySection
          key="retry"
          applyRetrySuggestion={applyRetrySuggestion}
          canRetry={canRetry}
          canRequestRetryAdvice={canRequestRetryAdvice}
          finalResults={finalResults}
          followUpNotes={followUpNotes}
          isGeneratingRetryAdvice={isGeneratingRetryAdvice}
          productQuery={productQuery}
          requestRetryAdvice={requestRetryAdvice}
          retryAdvice={retryAdvice}
          retryAdviceError={retryAdviceError}
          retryCount={retryCount}
          retryFeedback={retryFeedback}
          setRetryFeedback={setRetryFeedback}
          submitRetry={submitRetry}
        />,
      ];

  return (
    <ScreenContainer
      testID="results.screen"
      keyboardShouldPersistTaps="handled"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={{
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 0,
        paddingBottom: 32,
      }}
      fixedHeader={fixedHeader}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {scrollContent}
    </ScreenContainer>
  );
}
