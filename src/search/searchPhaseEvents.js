const MAX_PHASE_EVENTS = 6;

const PHASE_LABELS = {
  discover: "Discover",
  finalize: "Finalize",
  refine: "Refine",
};

export function buildPhaseEvent({ detail = "", phase, requestId, status, timingMs = null }) {
  return {
    detail,
    id: `${requestId}-${phase}`,
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
