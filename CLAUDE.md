# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npx expo start       # Start dev server (scan QR for Expo Go, or press i/a for simulator)
npx expo start --ios     # Open directly in iOS simulator
npx expo start --android # Open directly in Android emulator
npx expo start --web     # Open in browser
npm run lint         # Run ESLint via expo lint
npm run reset-project    # Move current app/ to app-example/ and start fresh
```

There is no test suite configured yet.

## Architecture

**Routing:** Expo Router with file-based routing. The `app/` directory defines all routes:
- `app/_layout.tsx` — root layout; wraps the app in React Navigation's `ThemeProvider` and defines the Stack navigator
- `app/(tabs)/` — bottom tab group; `_layout.tsx` configures two tabs (Home, Explore)
- `app/modal.tsx` — modal screen accessible via `Link href="/modal"`

**Path alias:** `@/*` maps to the repo root, so `import { X } from '@/components/x'` works everywhere (configured in `tsconfig.json`).

**Theming:** Light/dark mode is handled by:
- `hooks/use-color-scheme.ts` — wraps React Native's `useColorScheme`
- `constants/theme.ts` — exports `Colors` (per-mode palette) and `Fonts` (per-platform font stacks)
- `hooks/use-theme-color.ts` — resolves a color key against the active mode
- `components/themed-text.tsx` / `components/themed-view.tsx` — drop-in themed wrappers; use these instead of raw `Text`/`View` when color should adapt to the theme

**Platform splits:** Files ending in `.ios.tsx` are used on iOS only; the bare `.tsx` version is the Android/web fallback. Example: `components/ui/icon-symbol.ios.tsx` uses SF Symbols via `expo-symbols`; `components/ui/icon-symbol.tsx` falls back to `@expo/vector-icons/MaterialIcons`.

**Key flags in `app.json`:**
- `newArchEnabled: true` — React Native New Architecture is on
- `experiments.typedRoutes: true` — Expo Router generates typed route params (use `Href` types)
- `experiments.reactCompiler: true` — React Compiler is enabled; avoid manual `useMemo`/`useCallback` unless profiling shows a need
