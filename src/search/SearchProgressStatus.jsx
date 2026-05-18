import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { QuietStatusPanel, Surface } from "../components/MobileUI";
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

function hasRunningPhase(phaseEvents, phase) {
  return phaseEvents.some((event) => event.phase === phase && event.status === "running");
}

function getFriendlyErrorMessage(errorMessage) {
  if (!errorMessage) {
    return "";
  }

  if (
    errorMessage.includes("EXPO_PUBLIC_API_BASE_URL") ||
    errorMessage.includes("HTML instead of JSON")
  ) {
    return "The app is not reaching the backend API yet. Check the API base URL, then restart Expo.";
  }

  if (errorMessage.includes("invalid response")) {
    return "The backend response was not readable. Try again in a moment.";
  }

  return errorMessage;
}

function getSearchStatusCopy({
  discoverySummary,
  errorMessage,
  finalResults,
  hasStartedSearch,
  isFinalizing,
  isGeneratingPrompt,
  phaseEvents,
  previewItems,
  refinementPrompt,
}) {
  const focusedPickCount = Array.isArray(finalResults) ? finalResults.length : 0;
  const previewCount = Array.isArray(previewItems) ? previewItems.length : 0;

  if (errorMessage) {
    return {
      detail: "Diagnostics are available if you need the raw technical clue.",
      message: getFriendlyErrorMessage(errorMessage),
      title: "Search needs attention",
      tone: "error",
    };
  }

  if (isFinalizing) {
    return {
      detail: "This uses the current candidate pool and your optional notes.",
      message: "Focamai is narrowing the options into a focused shortlist.",
      title: "Narrowing to six",
      tone: "active",
    };
  }

  if (focusedPickCount > 0 && hasRunningPhase(phaseEvents, "enrich")) {
    return {
      detail: "You can open a pick now; fit notes may continue to fill in.",
      message: "Your shortlist is ready. Focamai is still checking details where available.",
      title: "Checking details",
      tone: "active",
    };
  }

  if (focusedPickCount > 0) {
    return {
      detail:
        focusedPickCount < 6
          ? "Fewer than six credible picks came back for this search."
          : "Open any pick for reasons, caveats, and retailer availability.",
      message: `${focusedPickCount} focused pick${focusedPickCount === 1 ? "" : "s"} ready to review.`,
      title: "Shortlist ready",
      tone: "ready",
    };
  }

  if (isGeneratingPrompt) {
    return {
      detail: "The follow-up is optional; it should not block the search.",
      message: "Focamai is preparing one short question to sharpen the shortlist.",
      title: "Preparing one question",
      tone: "active",
    };
  }

  if (discoverySummary && refinementPrompt) {
    return {
      detail: "Answer the question if it helps, or skip and build the shortlist.",
      message: "Early options and the optional follow-up are ready.",
      title: "Ready to refine",
      tone: "ready",
    };
  }

  if (discoverySummary) {
    const hasCandidates = Number(discoverySummary.candidateCount || 0) > 0 || previewCount > 0;

    return {
      detail: hasCandidates
        ? "These are not the final picks yet."
        : "Try a more specific product phrase if this keeps happening.",
      message: hasCandidates
        ? "Early options are ready while Focamai prepares the focused step."
        : "No useful options have surfaced yet for this search.",
      title: hasCandidates ? "Finding useful options" : "No options yet",
      tone: hasCandidates ? "active" : "empty",
    };
  }

  if (hasStartedSearch) {
    return {
      detail: "This can take a moment on live marketplace data.",
      message: "Focamai is looking for useful candidates to narrow down.",
      title: "Finding options",
      tone: "active",
    };
  }

  return {
    detail: "Enter the product in your own words.",
    message: "Start a search when you are ready.",
    title: "Ready to search",
    tone: "idle",
  };
}

export function SearchProgressStatus({
  discoverySummary,
  errorMessage,
  finalResults = [],
  hasStartedSearch,
  isFinalizing,
  isGeneratingPrompt,
  phaseEvents = [],
  previewItems = [],
  productQuery,
  refinementPrompt,
}) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const statusCopy = getSearchStatusCopy({
    discoverySummary,
    errorMessage,
    finalResults,
    hasStartedSearch,
    isFinalizing,
    isGeneratingPrompt,
    phaseEvents,
    previewItems,
    refinementPrompt,
  });
  const titleClassName =
    statusCopy.tone === "error"
      ? "text-red-700"
      : statusCopy.tone === "ready"
        ? "text-accent"
        : "text-ink";

  return (
    <Surface variant="quiet">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.2px] text-stone-500">
            Search status
          </Text>
          <Text className={`mt-2 text-lg font-semibold leading-6 ${titleClassName}`}>
            {statusCopy.title}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-stone-700">{statusCopy.message}</Text>
          {statusCopy.detail ? (
            <Text className="mt-1 text-sm leading-5 text-stone-500">{statusCopy.detail}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showDiagnostics ? "Hide search diagnostics" : "Show search diagnostics"}
          onPress={() => setShowDiagnostics((currentValue) => !currentValue)}
          className="rounded-full border border-line bg-white px-3 py-2"
        >
          <Text className="text-xs font-semibold text-slate-700">
            {showDiagnostics ? "Hide" : "Details"}
          </Text>
        </Pressable>
      </View>

      <QuietStatusPanel className="mt-3">
        <StatusLine label="Query" value={productQuery || "none"} />
        {discoverySummary ? (
          <StatusLine
            label="Amazon store"
            value={getAmazonMarketplaceLabel(discoverySummary.amazonDomain)}
          />
        ) : null}
      </QuietStatusPanel>

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
        <Text className="mt-3 text-xs leading-4 text-stone-500">
          Raw message: {errorMessage}
        </Text>
      ) : null}
    </Surface>
  );
}
