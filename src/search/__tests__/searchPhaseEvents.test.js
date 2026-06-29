import {
  buildPhaseEvent,
  formatPhaseName,
  formatPhaseStatus,
  replacePhaseEvent,
} from "../searchPhaseEvents";

describe("buildPhaseEvent", () => {
  it("creates an event with explicit eventKey", () => {
    const event = buildPhaseEvent({
      detail: "Searching products",
      eventKey: "discover",
      phase: "discover",
      requestId: "req-1",
      status: "running",
      timingMs: 250,
    });

    expect(event).toEqual({
      detail: "Searching products",
      id: "req-1-discover",
      phase: "discover",
      status: "running",
      timingMs: 250,
    });
  });

  it("uses eventKey for id when provided", () => {
    const event = buildPhaseEvent({
      eventKey: "discover-retry",
      phase: "discover",
      requestId: "req-1",
      status: "retrying",
    });

    expect(event.id).toBe("req-1-discover-retry");
  });

  it("defaults timingMs to null and detail to empty", () => {
    const event = buildPhaseEvent({
      eventKey: "refine",
      phase: "refine",
      requestId: "req-2",
      status: "done",
    });

    expect(event.timingMs).toBeNull();
    expect(event.detail).toBe("");
  });
});

describe("replacePhaseEvent", () => {
  it("replaces an event with the same id", () => {
    const events = [
      { id: "req-1-discover", status: "running" },
      { id: "req-1-refine", status: "pending" },
    ];
    const updated = { id: "req-1-discover", status: "done" };

    const result = replacePhaseEvent(events, updated);

    expect(result).toHaveLength(2);
    expect(result.find((e) => e.id === "req-1-discover").status).toBe("done");
  });

  it("appends a new event when id is not found", () => {
    const events = [{ id: "req-1-discover", status: "done" }];
    const newEvent = { id: "req-1-refine", status: "running" };

    const result = replacePhaseEvent(events, newEvent);

    expect(result).toHaveLength(2);
  });

  it("caps the event list at 6 entries", () => {
    const events = Array.from({ length: 6 }, (_, i) => ({ id: `e-${i}`, status: "done" }));
    const newEvent = { id: "e-new", status: "running" };

    const result = replacePhaseEvent(events, newEvent);

    expect(result).toHaveLength(6);
    expect(result[result.length - 1].id).toBe("e-new");
    // First event should have been dropped
    expect(result.find((e) => e.id === "e-0")).toBeUndefined();
  });
});

describe("formatPhaseName", () => {
  it("maps known phases to display labels", () => {
    expect(formatPhaseName("discover")).toBe("Discover");
    expect(formatPhaseName("refine")).toBe("Refine");
    expect(formatPhaseName("finalize")).toBe("Finalize");
    expect(formatPhaseName("enrich")).toBe("Enrich");
    expect(formatPhaseName("queryQuality")).toBe("Query");
    expect(formatPhaseName("constraintRefresh")).toBe("Refresh");
    expect(formatPhaseName("session")).toBe("Session");
  });

  it("falls back to the raw phase string for unknown phases", () => {
    expect(formatPhaseName("unknownPhase")).toBe("unknownPhase");
  });
});

describe("formatPhaseStatus", () => {
  it("shows status with timing when present", () => {
    expect(formatPhaseStatus({ status: "done", timingMs: 150 })).toBe("done - 150ms");
  });

  it("shows status without timing when timingMs is null", () => {
    expect(formatPhaseStatus({ status: "running", timingMs: null })).toBe("running");
  });

  it("shows status without timing when timingMs is undefined", () => {
    expect(formatPhaseStatus({ status: "pending", timingMs: undefined })).toBe("pending");
  });
});
