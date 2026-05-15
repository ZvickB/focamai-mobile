import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getAmazonMarketplaceLabel } from "./amazonMarketplaces";
import { getApiBaseUrl } from "./searchApi";
import { formatPhaseName, formatPhaseStatus } from "./searchPhaseEvents";

const apiBaseUrl = getApiBaseUrl();

function StatusLine({ label, value }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-line py-2">
      <Text className="text-sm text-slate-600">{label}</Text>
      <Text className="shrink text-right text-sm font-medium text-slate-900">{value}</Text>
    </View>
  );
}

function PhaseEventLine({ event }) {
  return (
    <View className="border-b border-line py-2">
      <View className="flex-row justify-between gap-4">
        <Text className="text-sm font-medium text-slate-900">{formatPhaseName(event.phase)}</Text>
        <Text className="text-right text-sm font-medium text-slate-700">
          {formatPhaseStatus(event)}
        </Text>
      </View>
      {event.detail ? (
        <Text className="mt-1 text-sm leading-5 text-slate-600">{event.detail}</Text>
      ) : null}
    </View>
  );
}

function getSearchStatusMessage({
  discoverySummary,
  errorMessage,
  hasStartedSearch,
  isFinalizing,
  isGeneratingPrompt,
  refinementPrompt,
}) {
  if (errorMessage) {
    return "Something needs attention before this search can continue.";
  }

  if (isFinalizing) {
    return "Building the focused shortlist.";
  }

  if (isGeneratingPrompt) {
    return "Preparing a follow-up question.";
  }

  if (discoverySummary && refinementPrompt) {
    return "Ready to refine or build focused picks.";
  }

  if (discoverySummary) {
    return "Early options are ready.";
  }

  if (hasStartedSearch) {
    return "Searching for useful options.";
  }

  return "Start with a product query.";
}

export function SearchProgressStatus({
  discoverySummary,
  errorMessage,
  hasStartedSearch,
  isFinalizing,
  isGeneratingPrompt,
  phaseEvents = [],
  productQuery,
  refinementPrompt,
}) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const statusMessage = getSearchStatusMessage({
    discoverySummary,
    errorMessage,
    hasStartedSearch,
    isFinalizing,
    isGeneratingPrompt,
    refinementPrompt,
  });

  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-900">Search status</Text>
          <Text className="mt-2 text-base leading-6 text-slate-900">{statusMessage}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showDiagnostics ? "Hide search diagnostics" : "Show search diagnostics"}
          onPress={() => setShowDiagnostics((currentValue) => !currentValue)}
          className="rounded-full border border-line bg-mist px-3 py-2"
        >
          <Text className="text-xs font-semibold text-slate-700">
            {showDiagnostics ? "Hide" : "Details"}
          </Text>
        </Pressable>
      </View>

      <View className="mt-3">
        <StatusLine label="Query" value={productQuery || "none"} />
        {discoverySummary ? (
          <StatusLine
            label="Amazon store"
            value={getAmazonMarketplaceLabel(discoverySummary.amazonDomain)}
          />
        ) : null}
      </View>

      {showDiagnostics ? (
        <View className="mt-4">
          <Text className="text-xs font-semibold uppercase text-slate-500">Diagnostics</Text>
          <View className="mt-2">
            <StatusLine label="Backend" value="discovery, refine, finalize" />
            <StatusLine label="API base" value={apiBaseUrl ? "configured" : "not set"} />
            {discoverySummary ? (
              <>
                <StatusLine label="Candidates" value={String(discoverySummary.candidateCount)} />
                <StatusLine label="Preview results" value={String(discoverySummary.previewCount)} />
                <StatusLine label="Source" value={discoverySummary.source} />
                <StatusLine label="Discovery timing" value={`${discoverySummary.timingMs}ms`} />
                <StatusLine
                  label="Discovery token"
                  value={discoverySummary.discoveryToken ? "received" : "missing"}
                />
              </>
            ) : null}
            {refinementPrompt ? (
              <StatusLine label="Refine timing" value={`${refinementPrompt.timingMs}ms`} />
            ) : null}
          </View>
          {phaseEvents.length > 0 ? (
            <View className="mt-4">
              <Text className="text-xs font-semibold uppercase text-slate-500">Phase events</Text>
              <View className="mt-1">
                {phaseEvents.map((event) => (
                  <PhaseEventLine key={event.id} event={event} />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      {errorMessage ? (
        <Text className="mt-3 text-sm leading-5 text-red-600">{errorMessage}</Text>
      ) : null}
    </View>
  );
}
