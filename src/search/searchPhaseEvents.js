const MAX_PHASE_EVENTS = 6;

const PHASE_LABELS = {
  constraintRefresh: "Refresh",
  discover: "Discover",
  enrich: "Enrich",
  finalize: "Finalize",
  queryQuality: "Query",
  refine: "Refine",
  session: "Session",
};

export function buildPhaseEvent({
  detail = "",
  eventKey = phase,
  phase,
  requestId,
  status,
  timingMs = null,
}) {
  return {
    detail,
    id: `${requestId}-${eventKey}`,
    phase,
    status,
    timingMs,
  };
}

export function replacePhaseEvent(events, nextEvent) {
  const remainingEvents = events.filter((event) => event.id !== nextEvent.id);

  return [...remainingEvents, nextEvent].slice(-MAX_PHASE_EVENTS);
}

export function formatPhaseName(phase) {
  return PHASE_LABELS[phase] || phase;
}

export function formatPhaseStatus(event) {
  const timing = event.timingMs === null || event.timingMs === undefined ? "" : ` - ${event.timingMs}ms`;

  return `${event.status}${timing}`;
}
