# Vocl — Implementation Task Tracker

## Current Sprint: Core Features (2026-04-12 - 2026-04-26)

### 📋 Backlog

#### Workspace Management
- [ ] Implement SQLite schema for workspaces table
- [ ] Create workspace CRUD queries in `/lib/db/queries/workspaces.ts`
- [ ] Build workspace list screen (`app/workspaces/index.tsx`)
- [ ] Implement workspace creation flow
- [ ] Add workspace editing and deletion
- [ ] Create workspace context hook (`useWorkspace.ts`)
- [ ] Implement workspace switching

#### Vocabulary Management
- [ ] Implement vocab SQLite schema
- [ ] Create vocab CRUD queries in `/lib/db/queries/vocab.ts`
- [ ] Build vocab list screen (`app/workspaces/[id]/vocab/index.tsx`)
- [ ] Implement vocab item editing (`app/workspaces/[id]/vocab/[vocabId].tsx`)
- [ ] Add quick-add bottom sheet component
- [ ] Implement duplicate detection logic

#### Spaced Repetition Algorithm
- [ ] Implement weighted selector in `/lib/scheduler/weightedSelector.ts`
- [ ] Create spaced repetition weight update logic
- [ ] Write unit tests for scheduler functions
- [ ] Build daily 10 challenge screen (`app/workspaces/[id]/learn.tsx`)
- [ ] Implement vocab card flip animation
- [ ] Add answer input and scoring system
- [ ] Integrate weight updates on answer submission

#### Streak System
- [ ] Implement streak SQLite schema
- [ ] Create streak read/write queries
- [ ] Build streak tracking logic with grace period
- [ ] Add AppState listener for streak checks
- [ ] Implement streak visualization in stats screen
- [ ] Create streak milestone celebration modal

#### CSV Import/Export
- [ ] Implement CSV parser with validation
- [ ] Create CSV exporter function
- [ ] Build import UI with file picker
- [ ] Add export functionality to settings
- [ ] Implement error handling and user feedback

#### Camera/OCR Integration
- [ ] Set up camera permissions
- [ ] Implement camera screen (`app/scan.tsx`)
- [ ] Integrate ML Kit text recognition
- [ ] Add word bounding box selection
- [ ] Create scan result bottom sheet
- [ ] Build basic translation flow UI

#### Notifications
- [ ] Set up expo-notifications
- [ ] Implement notification permission request
- [ ] Create daily reminder scheduler
- [ ] Add notification time configuration
- [ ] Implement notification cancellation logic

### 🚀 In Progress

*(Currently no tasks in progress - sprint just started)*

### ✅ Completed

*(No tasks completed yet)*

### 🔍 Testing Requirements

- [ ] Unit tests for all `/lib` utility functions
- [ ] Integration tests for all DB queries
- [ ] Behavior-driven assertions (no snapshots)
- [ ] Test coverage for scheduler algorithms
- [ ] CSV parser validation tests
- [ ] Streak logic edge case tests

### 📝 Documentation Needs

- [ ] Update CLAUDE.md with task tracking references
- [ ] Create design token documentation
- [ ] Add API documentation for translation providers
- [ ] Write contributor guidelines
- [ ] Create testing strategy document

## Implementation Notes

### Priority Order
1. Database schema and basic CRUD
2. Workspace management UI
3. Spaced repetition algorithm
4. Daily challenge screen
5. Streak system
6. CSV import/export
7. Camera/OCR (basic version)
8. Notifications

### Dependencies
- Workspace management must be complete before vocab management
- Spaced repetition algorithm needed for daily challenge
- Streak system depends on completed sessions
- Camera/OCR can be developed in parallel with other features

### Testing Strategy
- Write tests concurrently with implementation
- Focus on business logic first, UI tests second
- Use in-memory SQLite for integration tests
- Mock external APIs (translation) for unit tests

## Checklist for Claude Agent

When working on tasks, the Claude agent should:

1. **Before starting any task**:
   - [ ] Read relevant sections of CLAUDE.md
   - [ ] Check PROJECT_REQUIREMENTS.md for specifications
   - [ ] Review PROJECT_STRUCTURE.md for file locations
   - [ ] Update task.md with current task status

2. **During implementation**:
   - [ ] Follow TypeScript strict mode requirements
   - [ ] Adhere to file naming conventions
   - [ ] Keep business logic in `/lib`, not components
   - [ ] Write tests for all new utility functions
   - [ ] Update task.md progress regularly

3. **After completing tasks**:
   - [ ] Verify all requirements are met
   - [ ] Update task.md with completion status
   - [ ] Run tests to ensure nothing broke
   - [ ] Check for any related tasks that can now be started

4. **Code quality checks**:
   - [ ] No vendor lock-in (pluggable translation)
   - [ ] Offline-first implementation
   - [ ] Proper workspace isolation
   - [ ] Weight updates on every answer
   - [ ] No direct react-native imports when Expo equivalent exists
