# Vocl — Project Structure

```
vocablens/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout, theme provider, auth guard
│   ├── index.tsx                 # Redirect to /workspaces
│   ├── workspaces/
│   │   ├── _layout.tsx           # Workspace stack navigator
│   │   ├── index.tsx             # Workspace list / create
│   │   └── [id]/
│   │       ├── _layout.tsx       # Tabs: Learn | Stats | Vocab | Settings
│   │       ├── learn.tsx         # Daily 10 challenge screen
│   │       ├── freeplay.tsx      # Endless freeplay mode
│   │       ├── stats.tsx         # Streak, calendar chart, accuracy
│   │       ├── vocab/
│   │       │   ├── index.tsx     # Vocab list (search, filter, sort)
│   │       │   └── [vocabId].tsx # Edit single vocab item
│   │       └── settings.tsx      # Workspace settings, CSV import/export
│   ├── scan.tsx                  # Camera OCR screen (fullscreen modal)
│   └── onboarding.tsx            # First-run workspace setup
│
├── components/                   # Reusable UI components
│   ├── cards/
│   │   ├── VocabCard.tsx         # Flashcard with flip animation
│   │   ├── StatsCard.tsx         # Summary stat tile
│   │   └── WorkspaceCard.tsx     # Workspace list item
│   ├── charts/
│   │   ├── CalendarHeatmap.tsx   # Green/gray calendar dots
│   │   └── AccuracyChart.tsx     # 7-day accuracy bar chart
│   ├── input/
│   │   ├── TranslationInput.tsx  # Answer input with keyboard
│   │   └── CSVDropZone.tsx       # File picker for CSV upload
│   ├── overlays/
│   │   ├── ScanResultSheet.tsx   # Bottom sheet for OCR result
│   │   ├── AddVocabSheet.tsx     # Quick-add bottom sheet
│   │   └── StreakModal.tsx       # Streak milestone celebration
│   ├── navigation/
│   │   ├── TabBar.tsx            # Custom tab bar
│   │   └── Header.tsx            # Screen header with actions
│   └── ui/
│       ├── Button.tsx
│       ├── TextInput.tsx
│       ├── Badge.tsx
│       ├── ProgressBar.tsx
│       └── Skeleton.tsx          # Loading placeholders
│
├── lib/                          # All business logic (no UI imports)
│   ├── db/
│   │   ├── schema.ts             # SQLite table definitions
│   │   ├── migrations/           # Versioned migration files
│   │   │   └── 001_initial.ts
│   │   └── queries/
│   │       ├── vocab.ts          # CRUD for vocab items
│   │       ├── workspaces.ts     # CRUD for workspaces
│   │       ├── sessions.ts       # Daily challenge session records
│   │       └── streaks.ts        # Streak read/write logic
│   ├── scheduler/
│   │   ├── weightedSelector.ts   # Weighted random vocab selection
│   │   └── spacedRepetition.ts   # Weight update algorithm
│   ├── translation/
│   │   ├── index.ts              # Provider-agnostic translate() fn
│   │   ├── libreTranslate.ts     # LibreTranslate adapter
│   │   └── myMemory.ts           # MyMemory fallback adapter
│   ├── ocr/
│   │   └── recognizeText.ts      # ML Kit wrapper + bounding box util
│   ├── csv/
│   │   ├── parser.ts             # CSV parse + validate + dedup
│   │   └── exporter.ts           # Vocab → CSV string
│   ├── notifications/
│   │   └── scheduler.ts          # Schedule/cancel daily reminder
│   └── utils/
│       ├── dateUtils.ts          # Local date helpers (no moment.js)
│       ├── langUtils.ts          # Language code/name mapping
│       └── weightUtils.ts        # Weight math helpers
│
├── hooks/                        # Custom React hooks
│   ├── useWorkspace.ts           # Active workspace context
│   ├── useDailyChallenge.ts      # Load today's 10 vocabs
│   ├── useStreak.ts              # Current streak + grace state
│   ├── useVocabList.ts           # Filtered/sorted vocab query
│   └── useNotifications.ts       # Permission + schedule logic
│
├── store/                        # Zustand global state
│   ├── workspaceStore.ts         # Active workspace ID
│   ├── sessionStore.ts           # In-progress challenge state
│   └── settingsStore.ts          # App-wide settings (lang, theme)
│
├── constants/
│   ├── design.ts                 # Colors, typography, spacing tokens
│   ├── languages.ts              # Supported language pairs
│   └── config.ts                 # API URLs, feature flags
│
├── assets/
│   ├── fonts/                    # Custom fonts if needed
│   ├── images/                   # Static images
│   └── animations/               # Lottie JSON files (celebrations)
│
├── __tests__/                    # Test files mirror /lib structure
│   ├── scheduler/
│   │   ├── weightedSelector.test.ts
│   │   └── spacedRepetition.test.ts
│   ├── csv/
│   │   └── parser.test.ts
│   └── db/
│       └── vocab.test.ts
│
├── app.json                      # Expo config
├── babel.config.js
├── tsconfig.json
├── package.json
├── CLAUDE.md                     # Agent instructions (this file's sibling)
├── PROJECT_STRUCTURE.md          # This file
└── DESIGN_PROMPT.md              # Design language extraction prompt
```

## Key Data Flow

```
SQLite (expo-sqlite)
  └── queries/ (lib/db/queries/)
        └── hooks/ (hooks/)
              └── screens (app/)
                    └── components/
```

Business logic never lives in components or screens. Components only call hooks; hooks call lib functions; lib functions talk to SQLite or external APIs.

## SQLite Schema (simplified)

```sql
-- Workspaces
CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_lang TEXT NOT NULL,   -- e.g. "de"
  target_lang TEXT NOT NULL,   -- e.g. "en"
  created_at TEXT NOT NULL
);

-- Vocab items
CREATE TABLE vocab (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id),
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  notes TEXT,
  weight REAL NOT NULL DEFAULT 0.7,
  last_seen TEXT,
  correct_streak INTEGER NOT NULL DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(workspace_id, word COLLATE NOCASE)
);

-- Daily sessions
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  completed INTEGER NOT NULL DEFAULT 0,  -- 0 or 1
  score INTEGER NOT NULL DEFAULT 0,      -- 0-10
  created_at TEXT NOT NULL
);

-- Streaks
CREATE TABLE streaks (
  workspace_id TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  grace_pending INTEGER NOT NULL DEFAULT 0,  -- boolean
  last_completed TEXT   -- YYYY-MM-DD
);
```