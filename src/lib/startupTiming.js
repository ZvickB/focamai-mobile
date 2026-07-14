const startupStartedAt = Date.now();
const recordedMilestones = new Set();

export function markStartupTiming(label) {
  if (!__DEV__ || recordedMilestones.has(label)) {
    return;
  }

  recordedMilestones.add(label);
  console.info(`[Focamai startup] ${label}: ${Date.now() - startupStartedAt}ms`);
}
