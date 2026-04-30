# CLAUDE.md — Vocl App Project

## Project Overview

You are building **Vocl**, a cross-platform vocabulary learning app (Android-first via Expo/React Native). The app features spaced-repetition flashcards, visual word recognition via camera, workspace management, and rich statistics.

**Primary Reference Documents:**
- `PROJECT_REQUIREMENTS.md` — Complete feature specifications and technical requirements
- `PROJECT_STRUCTURE.md` — File organization and architecture
- `task.md` — Current implementation progress and task tracking

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (SDK 52+), React Native |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based) |
| State | Zustand + React Query |
| Storage | SQLite via expo-sqlite |
| OCR | `@react-native-ml-kit/text-recognition` |
| Translation | LibreTranslate API (self-hostable) or MyMemory fallback |
| Notifications | `expo-notifications` |
| Charts/Stats | `react-native-gifted-charts` or Victory Native |
| Testing | Jest + React Native Testing Library |

## Repository Structure

See `PROJECT_STRUCTURE.md` for the full folder tree.

## Core Principles

1. **Offline-first**: All core learning functions work without internet. Translation and sync are graceful-degradation features.
2. **No vendor lock-in**: Translation is pluggable — LibreTranslate, MyMemory, or local model. Never hardcode a single provider.
3. **Weighted spaced repetition**: Every vocab item has a `weight` (float 0–1) persisted in SQLite. The scheduler reads weights to select the next 10 items. Never skip weight updates.
4. **Workspace isolation**: Each workspace has its own vocab table, streak data, and statistics. Never mix data between workspaces.

## Spaced Repetition Algorithm

Each vocab item stores:
```ts
{
  id: string,
  weight: number,         // 0.0 = easy/mastered, 1.0 = hard/new
  lastSeen: ISO8601,
  correctStreak: number,
  totalAttempts: number,
  totalCorrect: number,
}
```

**Weight update on answer:**
- Correct: `weight = max(0, weight - 0.15 * (1 + correctStreak * 0.1))`
- Incorrect: `weight = min(1, weight + 0.25)`
- New vocab starts at `weight = 0.7`

**Daily 10 selection:** Weighted random sample — probability of selection proportional to `weight`. Never pure random. Always include at least 1 item with `weight < 0.2` if the pool allows (reinforcement of mastered items).

## Streak Logic

- **Daily streak**: Increments when user completes 10/10 daily challenge. Resets to 0 if missed for 1 day. **Grace rule**: If streak ≥ 7 and user misses 1 day, streak is preserved but flagged with `gracePending: true`. Missing a second consecutive day resets to 0.
- Streak data is per-workspace.
- Streak check runs on app foreground via `AppState` listener.

## Notification Rules

- Daily reminder fires at user-configured time (default 09:00 local).
- Do not re-schedule if already done for the day.
- Use `expo-notifications` with local triggers only — no push server.

## CSV Format

```csv
word,translation,workspace,notes
Hund,dog,german-english,
Laufen,to run,german-english,irregular verb
```

Duplicate detection: exact match on (`word` + `workspace`). Case-insensitive comparison.

## Visual Recognition Flow

1. User opens camera in "scan" mode.
2. ML Kit text recognition runs on frame (not video — triggered by tap or auto every 1.5s).
3. User taps a detected word bounding box.
4. App calls translation API with source/target language from active workspace.
5. Result shown in bottom sheet with options: **Add to List**, **Dismiss**, **Edit before adding**.

## Design Language

Refer to the design prompt in `STYLE_GUIDE.md` and mirror the design tokens from the reference website exactly. The app must feel like the same product family.

## File Conventions

- Components: `PascalCase.tsx`
- Screens: `kebab-case.tsx` (Expo Router)
- Hooks: `useFeatureName.ts`
- Utils: `camelCase.ts`
- All business logic in `/lib` — never in components
- DB queries in `/lib/db/queries/`

## What NOT to Do

- Do not use `AsyncStorage` for vocab data — use SQLite only
- Do not use `expo-av` for anything unless explicitly requested
- Do not use class components
- Do not hardcode language pairs — always derive from workspace config
- Do not use inline styles for anything design-related — use the StyleSheet or design tokens
- Do not import from `react-native` directly when an Expo equivalent exists

## Testing Requirements

- Every util function in `/lib` needs a unit test
- Every DB query function needs an integration test with an in-memory SQLite instance
- Snapshot tests are not acceptable — use behavior-driven assertions

## Common Commands

```bash
npx expo start               # Start dev server
npx expo start --android     # Start with Android emulator
npx jest                     # Run tests
npx tsc --noEmit             # Type check
npx expo doctor              # Check environment health
```

## Current Sprint Focus

See `task.md` for detailed task breakdown and `PROJECT_REQUIREMENTS.md` for complete specifications.

### Quick Reference (2026-04-12 - 2026-04-26)
1. Workspace CRUD + SQLite schema
2. Daily 10 challenge screen with weighted selection
3. Streak logic + notification scheduling
4. CSV import/export
5. Camera/OCR scan screen (basic version — no translation yet)

## Agent Workflow

### Task Management
1. **Always check `task.md` first** before starting any work
2. Update task status in `task.md` as you progress
3. Follow the priority order specified in `PROJECT_REQUIREMENTS.md`
4. Mark tasks as "In Progress" when starting, "Completed" when finished

### Implementation Guidelines
1. **Read requirements first**: Consult `PROJECT_REQUIREMENTS.md` for specifications
2. **Follow architecture**: Adhere to file locations in `PROJECT_STRUCTURE.md`
3. **Update documentation**: Keep `task.md` current with your progress
4. **Test-driven**: Write tests concurrently with implementation
5. **Incremental commits**: Small, focused changes with clear commit messages

### Quality Checklist (Run Before Marking Tasks Complete)
- [ ] All business logic in `/lib` (not in components)
- [ ] TypeScript strict mode compliance
- [ ] Unit tests for utility functions
- [ ] Integration tests for DB queries
- [ ] Offline-first implementation
- [ ] Workspace isolation maintained
- [ ] Weight updates on every answer
- [ ] No vendor lock-in for translation
- [ ] Proper error handling
- [ ] Follows design tokens from `DESIGN_PROMPT.md`