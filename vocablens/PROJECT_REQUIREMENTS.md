# Vocl — Project Requirements

## Core Features

### 1. Workspace Management
- **CRUD Operations**: Create, Read, Update, Delete workspaces
- **Isolation**: Each workspace has its own vocab table, streak data, and statistics
- **Language Pairs**: Configurable source/target languages per workspace
- **Active Workspace**: Global state for currently selected workspace

### 2. Vocabulary Management
- **CRUD Operations**: Add, edit, delete vocabulary items
- **Fields**: word, translation, notes, weight, last_seen, correct_streak, total_attempts, total_correct
- **Duplicate Detection**: Case-insensitive unique constraint on (workspace_id + word)
- **CSV Import/Export**: Support for bulk operations via CSV format

### 3. Spaced Repetition Learning
- **Weighted Selection**: Daily 10 challenge with probability proportional to weight
- **Weight Algorithm**: 
  - Correct: `weight = max(0, weight - 0.15 * (1 + correctStreak * 0.1))`
  - Incorrect: `weight = min(1, weight + 0.25)`
  - New vocab: `weight = 0.7`
- **Reinforcement**: Always include at least 1 item with weight < 0.2 if available

### 4. Streak System
- **Daily Streak**: Increments on completing 10/10 daily challenge
- **Grace Rule**: If streak ≥ 7 and user misses 1 day, streak preserved with grace_pending flag
- **Reset**: Missing second consecutive day resets streak to 0
- **Per-Workspace**: Streak data isolated by workspace

### 5. Visual Recognition (OCR)
- **Camera Integration**: Fullscreen camera with text recognition
- **ML Kit**: Text recognition on frame (triggered by tap or auto every 1.5s)
- **Word Selection**: Tap detected word bounding boxes
- **Translation Flow**: OCR result → translation API → add to vocab list

### 6. Notifications
- **Daily Reminders**: Local notification at user-configured time (default 09:00)
- **No Push Server**: Use expo-notifications with local triggers only
- **Single Daily Notification**: Don't re-schedule if already completed

### 7. Statistics & Analytics
- **Accuracy Tracking**: 7-day accuracy chart
- **Calendar Heatmap**: Visual representation of learning activity
- **Session History**: Completed sessions with scores
- **Streak Visualization**: Current vs longest streak display

## Technical Requirements

### Database (SQLite)
- **Schema**: Workspaces, Vocab, Sessions, Streaks tables
- **Migrations**: Versioned migration system
- **Queries**: Type-safe query functions in `/lib/db/queries/`
- **Offline-First**: All core functions work without internet

### Translation
- **Pluggable Providers**: LibreTranslate (primary), MyMemory (fallback)
- **Self-Hostable**: Support for local LibreTranslate instances
- **Graceful Degradation**: Fallback to cached translations when offline

### UI/UX
- **Design System**: Follow tokens from DESIGN_PROMPT.md
- **Responsive**: Work on mobile devices (Android-first)
- **Accessibility**: Proper contrast, screen reader support
- **Animations**: Flip animations for flashcards, Lottie for celebrations

### Testing
- **Unit Tests**: Every util function in `/lib` must have unit tests
- **Integration Tests**: DB query functions with in-memory SQLite
- **Behavior-Driven**: No snapshot tests, use behavior assertions
- **Test Coverage**: Focus on business logic, not UI components

## Non-Functional Requirements

### Performance
- **Fast Load Times**: Daily 10 selection should complete in < 200ms
- **Efficient Queries**: Optimize SQLite queries for large vocab sets (>1000 items)
- **Memory Management**: Handle camera frames efficiently

### Security
- **No Vendor Lock-in**: Translation providers must be interchangeable
- **Data Privacy**: All data stored locally, no cloud sync without explicit consent
- **Input Validation**: Sanitize CSV imports, prevent SQL injection

### Compatibility
- **Expo SDK**: 52+ 
- **React Native**: Latest stable version
- **Platforms**: Android (primary), iOS (secondary)
- **TypeScript**: Strict mode enabled

## Priority Features (Current Sprint)

1. **Workspace CRUD + SQLite Schema**
   - Implement workspace creation, editing, deletion
   - SQLite schema with proper foreign keys
   - Workspace isolation for all data

2. **Daily 10 Challenge Screen**
   - Weighted vocab selection algorithm
   - Flashcard UI with flip animation
   - Answer input and scoring
   - Weight updates on correct/incorrect answers

3. **Streak Logic + Notifications**
   - Streak tracking with grace period
   - Daily notification scheduling
   - AppState listener for streak checks
   - Streak milestone celebrations

4. **CSV Import/Export**
   - CSV parser with validation
   - Duplicate detection
   - Export functionality
   - Error handling and user feedback

5. **Camera/OCR Scan Screen**
   - Camera integration with permissions
   - ML Kit text recognition
   - Word bounding box selection
   - Basic translation flow (UI only, no actual translation yet)

## Future Enhancements (Out of Scope)

- Advanced analytics and insights
- Multi-device sync
- Audio pronunciation
- Gamification elements
- Social sharing features
- Custom study plans
- Dark mode support