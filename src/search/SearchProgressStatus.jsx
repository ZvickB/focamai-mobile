import { Text, View } from "react-native";
import { getApiBaseUrl } from "./searchApi";

const apiBaseUrl = getApiBaseUrl();

function StatusLine({ label, value }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-line py-2">
      <Text className="text-sm text-slate-600">{label}</Text>
      <Text className="shrink text-right text-sm font-medium text-slate-900">{value}</Text>
    </View>
  );
}

function formatPhaseName(phase) {
  if (phase === "discover") {
    return "Discover";
  }

  if (phase === "refine") {
    return "Refine";
  }

  if (phase === "finalize") {
    return "Finalize";
  }

  return phase;
}

function formatPhaseStatus(event) {
  const timing = event.timingMs === null || event.timingMs === undefined ? "" : ` - ${event.timingMs}ms`;

  return `${event.status}${timing}`;
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
  return (
    <View className="rounded-2xl border border-line bg-white px-4 py-4">
      <Text className="text-sm font-semibold text-slate-900">Progress</Text>
      <View className="mt-2">
        <StatusLine label="Draft query" value={productQuery || "none"} />
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
      {errorMessage ? (
        <Text className="mt-3 text-sm leading-5 text-red-600">{errorMessage}</Text>
      ) : null}
      {isGeneratingPrompt ? (
        <Text className="mt-3 text-sm leading-5 text-slate-700">Generating follow-up...</Text>
      ) : null}
      {isFinalizing ? (
        <Text className="mt-3 text-sm leading-5 text-slate-700">Finalizing focused picks...</Text>
      ) : null}
      {!hasStartedSearch ? (
        <Text className="mt-3 text-sm leading-5 text-slate-600">
          Start with a simple product query to test the mobile search path.
        </Text>
      ) : null}
    </View>
  );
}
