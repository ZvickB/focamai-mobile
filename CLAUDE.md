# Focama Mobile — Claude Code Context

## What This Is
React Native (Expo) port of the Focama web app. Same product: user enters a query → AI asks one follow-up question → returns 6 focused product picks with fit explanations.

**The backend is not touched.** The same three API endpoints (`discover`, `refine`, `finalize`) deployed on Render serve both the web app and this mobile app. All work here is frontend-only. (The web frontend is deployed on Vercel — that is separate from the API backend.)

Current branch reality: `restart/mobile-clean-slate` is intentionally rolled back to a basic Expo shell. Read `project-notes/restart-strategy.md` before rebuilding search behavior.

Source of truth for the broad migration plan: `migration-roadmap.md` in this directory. Treat it as a reference, not permission to copy the old Phase 3 search hook back in one pass.

## Claude vs Codex — When to Use Which
**Use Claude Code (this tool) when:**
- The task touches multiple parts of the system or needs codebase-wide understanding
- You want to think it through together — tradeoffs, architecture, back-and-forth
- The task involves a judgment call about what fits existing patterns

**Use Codex when:**
- The task is well-scoped and self-contained — you can write a clear spec
- You want to step away and come back to a finished result
- The task is pure implementation with no ambiguity about approach

**Rule of thumb:** Conversation and judgment → Claude. Autonomous heads-down execution → Codex.

## Product Voice — AI Copy Tone
Non-negotiable. Same rules as the web app.

- Write like a **trusted assistant**, not a salesperson or a review site.
- For each pick, explain **why the AI chose it** AND surface **at least one honest drawback or caveat** — without being harsh.
- Drawbacks can be practical (exceeds stated budget, heavier than alternatives) or contextual (better if you care more about Y than Z).
- Do **not** write copy that implies the product is definitely the right choice. Help the user decide for themselves.
- Avoid superlatives, hype phrases, and generic positives ("renowned for", "ideal for", "go-to choice", "perfectly suited").
- Be specific to the user's stated context — not generic product descriptions.
- Honest caveats make the product feel more trustworthy, not less.

**The office chair case is the reference example** — it flagged budget overruns and noted when a pick prioritized support over minimalism. That is the target.

## Run Commands
```bash
npx expo start              # Start Metro bundler (scan QR with Expo Go)
npx expo start --lan        # Normal physical-device workflow for Expo Go
npx expo start --clear --lan # Use after env/package/import changes or stale Metro errors
npx expo start --android    # Open directly in Android emulator
npx expo start --ios        # Open directly in iOS simulator (Mac only)
# EAS build/submit comes later after app behavior is stable.
```

When giving Zvi a run command, say explicitly whether to use normal `npx expo start --lan` or cache-clearing `npx expo start --clear --lan`.
Use the normal command for ordinary UI/code edits. Use `--clear` after `.env` changes, dependency changes, moved imports/files, or stale red transform errors.

## Tech Stack
- **Framework:** Expo (managed workflow)
- **Navigation:** React Navigation v7
- **Styling:** NativeWind v4 (Tailwind class syntax)
- **Animations:** React Native Reanimated
- **Currently removed during clean-slate reset:** TanStack Query, AsyncStorage, Expo Constants, Expo Crypto, Expo Linking, Expo Dev Client, lucide-react-native
- **Re-add later only when the rebuild slice needs them.**

## Key Directories
```
src/screens/            Screen-level components (one per route)
src/navigation/         RootNavigator and stack config
assets/                 App icons and splash assets
project-notes/          Current mobile status and restart strategy
```

## Migration Convention
- **Read from `../web/src/`**, write to `./src/`
- One phase at a time — don't start the next phase until the current checkpoint passes
- Test on a real device or emulator before calling a phase done — not just "it compiles"
- Use `project-notes/restart-strategy.md` for the current rebuild discipline: one small verified slice at a time.
- Do not copy the whole old guided-search hook back into mobile.

## RN Gotchas — Know These Before Touching Any File
| Web | React Native replacement |
|---|---|
| `window.setTimeout` | `setTimeout` (global, no `window.` prefix) |
| `performance.now()` | `Date.now()` |
| `crypto.randomUUID()` | `Crypto.randomUUID()` from `expo-crypto` |
| `import.meta.env.*` | `Constants.expoConfig.extra.*` or `__DEV__` |
| `localStorage` | `AsyncStorage` — watch out, it's async |
| `<a href>` | `Linking.openURL()` from `expo-linking` |
| `hover:` Tailwind classes | No effect on native — use `Pressable` press state |
| `scrollIntoView` | `ScrollView` ref `.scrollTo()` + `onLayout` measurement |
| `typeof window === 'undefined'` guards | Remove them — there is no window in RN |

## Working Conventions

### Communication
- **Zvi is stronger in React/frontend and new to React Native** — explain RN-specific behavior clearly, in practical terms
- For any non-obvious RN behavior, state: **what it does**, **why it's different from web**, **what to watch out for**
- **Never print raw secrets** in output or logs
- For meaningful checkpoints, report what changed, what was verified, and what phase we're on

### Behavior rules
- **Deviate warning:** If your next action would meaningfully differ from my instruction or preference, say so before proceeding. Briefly state the mismatch and why. Do not silently override my intent. Do not warn for minor details.
- **If unsure:** Prefer the smallest change that keeps the codebase aligned with the roadmap. Ask before making a product decision with non-obvious consequences.
- **Keep changes scoped** — finish one phase or task cleanly before starting another
- **No overengineering** — build for what's needed now; no speculative abstractions
- Treat implemented behavior and planned work as different things — never present a future idea as already decided

### Environment
- **Windows machine** — prefer commands that work in both PowerShell and bash; Expo CLI works the same on Windows

### Testing
- There is no test suite yet for mobile — when one is added, run it after touching logic files
- Manual device/emulator testing is the verification method for now — do it at every phase checkpoint

### After meaningful changes — update notes
- `project-notes/current-status.md` — short snapshot of what phase we're on and what's working
- `project-notes/session-handoff.md` — if a fresh chat would otherwise be misled about current state

### Archive rules
- Don't leave dead components, stale screens, or retired assets in active folders
- Move superseded things to a nearby `archive/` folder
- Active folders should reflect current product direction only

### Commit workflow (when user says "commit")
- Use only the current git diff — no full repo scan
- Write: short subject line + blank line + concise body (what + why)
- Avoid vague wording; warn if changes are unrelated
- Then commit AND push

## Session Reading Order
When starting a new session:
1. `AGENTS.md` — mobile front door and source-of-truth map
2. `project-notes/session-handoff.md` — what phase we're on and what's left
3. `project-notes/current-status.md` — immediate snapshot
4. `project-notes/restart-strategy.md` — why the reset happened and how to rebuild safely
5. `migration-roadmap.md` — broad phase reference, not a copy-wholesale instruction
