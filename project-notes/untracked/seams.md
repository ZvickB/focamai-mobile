File organization — cohesion over size
Organize code by responsibility, not by line count. A file should hold one coherent job and everything that naturally belongs to it. Length alone is never a reason to split a file, and shortness is never a reason to merge one.
Default to leaving files as they are. Only split when there's a real seam — a distinct responsibility that wants its own home. When unsure, keep it together. A handful of small fragments is worse than one cohesive file: it scatters related logic and makes the code harder to follow.
Split only when a genuine seam exists, e.g.:

A pure, side-effect-free layer (helpers, constants, formatters, data transforms) that can stand alone and be tested in isolation.
A genuinely separate domain sharing the file with others — a "god module" holding, say, cache + analytics + feedback storage is three jobs and should be three files.
Self-contained presentational components, or utilities reused by more than one file.

Do NOT split (leave it, even if long) when:

It's a cohesive single-purpose module — one algorithm or pipeline whose parts only make sense together (a scoring/dedup pipeline, an API client). Long ≠ wrong.
It's a stateful hook/component whose useState/useRef values thread through most of its body. Don't break such a hook into sub-hooks — the shared state means few clean seams and real risk of subtle bugs.
It's an orchestrator that wires children together. Extract the children; leave the orchestrator.
The split would produce single-function files, or force you to thread state/props around just to satisfy a line count.

Size is a prompt to look, not a limit to enforce. If a file grows past a few hundred lines, ask "is this still doing one job?" If yes, leave it. If it's several jobs glued together, split along the seam. Do not cut a file down just to reduce its length.
When you do split, preserve the seam. Moves are behavior-preserving: same names, same signatures, no logic changes in the same step. If other files import a name you move, re-export it from the original file so callers don't change.
Bias toward less. If you're debating whether something is worth extracting, it usually isn't yet.
