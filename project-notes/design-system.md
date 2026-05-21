# Focama Mobile Design System

All new components must follow these rules. A task or instruction can override a specific rule — if it does, the override applies only to that component unless stated otherwise.

## Color tokens (`tailwind.config.js`)

| Token | Hex | Use |
|---|---|---|
| `ink` | `#14222b` | Primary text, dark icons, back-button chevron |
| `cream` | `#fcf9f3` | Card backgrounds, quiet panel fills, pill backgrounds |
| `mist` | `#fbf7ef` | App/screen background (Cleaner Ivory) |
| `line` | `#e4d7c6` | All borders — cards, dividers, image frames, panels |
| `accent` | `#0F6175` | Primary action buttons, links, active pill borders |
| `secondary` | `#2F7F8A` | Secondary teal; accent surface borders (`Surface variant="accent"`) |
| `ember` | `#E59B26` | Restrained orange emphasis only — one place per screen max |

Use `stone-*` Tailwind classes for secondary/supporting text:
- `text-stone-600` — body/supporting copy
- `text-stone-500` — metadata, eyebrows
- `text-stone-400` — placeholder, fallback labels

Do not introduce new color values. If a color is missing from this list, ask before adding it.

## Typography

**Font family:** Manrope only. No second typeface.

| Class | Use |
|---|---|
| `font-semibold` | Headings, buttons, labels, eyebrows |
| `font-medium` (`Manrope_500Medium`) | Subheadings, price/rating values |
| default (`Manrope_400Regular`) | Body, supporting copy, metadata |
| `font-bold` (`Manrope_700Bold`) | Sparingly — strong emphasis only |

**Type scale (established sizes — use these, don't invent new ones):**

| Size | Use |
|---|---|
| `text-[30px] leading-[38px]` | Screen hero title (`ScreenIntro`) |
| `text-lg` | Card headings, section titles |
| `text-base` | Body text, section headers, back-button label |
| `text-[15px] leading-6` | Guidance/support copy (`GuidanceText`) |
| `text-sm` | Secondary body, button labels, metadata |
| `text-xs` | Eyebrows, pills, small labels |
| `text-[12px] tracking-[1.2px] uppercase` | Eyebrow caps (`ScreenIntro` eyebrow) |

## Spacing

| Value | Where |
|---|---|
| `px-6` / `paddingHorizontal: 24` | Screen horizontal gutters (`ScreenContainer`) |
| `py-6` / `paddingVertical: 24` | Screen top/bottom padding (`ScreenContainer`) |
| `gap-5` (20px) | Vertical gap between scroll content sections |
| `px-5 py-5` | Card/surface internal padding (`Surface`) |
| `px-4 py-4` | Quiet panel internal padding (`QuietStatusPanel`) |
| `gap-3` | Tight internal gaps (e.g. within `ScreenIntro`) |
| `gap-2` | Very tight gaps (e.g. button groups) |

Do not use arbitrary spacing values like `px-7` or `py-[18px]` unless a screen-specific layout genuinely requires it.

## Surfaces and cards

Always reach for `MobileUI.jsx` primitives first. Only add a custom `View` wrapper when no primitive fits and the deviation is justified.

| Primitive | Use |
|---|---|
| `ScreenContainer` | Every screen's root shell. Provides scroll, safe area, gutters, optional fixed footer |
| `Surface` | Content cards. Variants: `default` (white), `quiet` (cream), `accent` (white with secondary border) |
| `QuietStatusPanel` | Inline status/info panels — cream background, `line` border, `rounded-[18px]` |
| `RecoveryPanel` | Error/retry states |
| `ProductImageFrame` | All product images — handles fallback state, consistent border/radius |
| `SectionHeader` | Section titles with optional eyebrow and description |
| `ScreenIntro` | Hero heading block at the top of a screen |

**Surface shape rules:**
- Cards: `rounded-[20px]` (matches `Surface`)
- Buttons: `rounded-[18px]` (matches `Button`)
- Image frames: `rounded-[18px]` with `border border-line`
- Quiet panels: `rounded-[18px]`
- Pills/chips: `rounded-full`
- Icon buttons: `rounded-full h-11 w-11`
- All borders use `border-line` (`#e4d7c6`) unless the variant specifically requires `border-secondary`

## Buttons

Use the `Button` component from `MobileUI.jsx`.

| Variant | Appearance | Use |
|---|---|---|
| `primary` | `bg-accent` white text | Main action per screen |
| `secondary` | `bg-white border-line` ink text | Supporting action |
| `dark` | `bg-ink` white text | Rare — strong contrast needed |

- Min height: `min-h-[52px]`
- One primary button per screen section. Do not stack two primaries.
- Use `disabled` prop — do not fake a disabled state with opacity only.

For icon-only actions use `IconButton`. For back navigation use `HeaderBackButton`. Both are in `MobileUI.jsx`.

## Headers

Use `AppHeader` from `MobileUI.jsx` with the local PNG wordmark centered.

- Left slot: `HeaderBackButton` or nothing
- Right slot: `IconButton` with a Lucide icon (Settings, etc.)
- Hide the native stack header (`headerShown: false` in navigator) when using `AppHeader` — do not show both
- Wordmark default: `h-9 w-36`. Search screen variant: `h-12 w-52`

## Icons

Use `lucide-react-native` only. Do not add other icon libraries.

- Standard size: `size={20}` or `size={24}`
- Color: match surrounding text (`#14222b` for ink-context, `#0F6175` for accent-context)
- `strokeWidth={2}` or `strokeWidth={2.3}` — keep consistent within a screen

## Wordmark / brand asset

- Source: `assets/wordmark.png` (local copy — do not import from `../web`)
- Use `BrandWordmark` from `MobileUI.jsx` or `Image` with `resizeMode="contain"`
- Default header size: `h-9 w-36`. Hero size: `h-12 w-52`

## Background

The app background is Cleaner Ivory and comes from `src/theme/themeTokens.js` (`appThemeTokens.appBackground`). `ScreenContainer` applies it automatically.

- Do not hardcode a background color on `ScreenContainer` or `SafeAreaView` — use `appThemeTokens.appBackground`
- Card/surface backgrounds still use `bg-white` or `bg-cream` — they are not affected by the palette

## What to avoid

- New color values not in the token list
- One-off `View` wrappers with inline border/background/radius styles when a `MobileUI.jsx` primitive exists
- `hover:` Tailwind classes — no effect in React Native; use `Pressable` press state instead
- Hardcoded hex values in JSX — use Tailwind tokens or `appThemeTokens`
- Two primary buttons in the same section
- Stacking more than one `ember` emphasis element per screen
- Adding a second font family
- Importing assets from `../web` at runtime
