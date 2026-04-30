# 🚀 How to Run Vocl App

## Quick Start

### 1. Navigate to the correct directory

```bash
cd /c/Users/vashl/source/repos/vocl
```

### 2. Install dependencies (if not already installed)

```bash
npm install
```

### 3. Start the development server

```bash
node start-app.js
```

OR directly:

```bash
npx expo start
```

## 📱 Testing on Your Phone

### Using Expo Go App

1. **Install Expo Go** on your phone:
   - [Android - Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/us/app/expo-go/id982107779)

2. **Scan the QR code** that appears in your terminal

3. **Make sure your phone and computer are on the same WiFi network**

### Alternative: Use the QR Code Generator

```bash
node generate-qr.js
```

This will display a QR code in your terminal that you can scan with Expo Go.

## 🧪 Testing Core Functionality

Once the app is running, you can test these features:

### ✅ Workspace Management
- Create a new workspace with language pair (e.g., English → Spanish)
- View your workspace list
- Switch between workspaces

### ✅ Vocabulary Management
- Add vocabulary items with words and translations
- View your vocabulary list with stats
- See weight values for spaced repetition

### ✅ Daily Challenge
- Start the daily 10-item challenge
- Answer questions and see your score
- Complete the challenge to save your session

### ✅ Streak Tracking
- Complete daily challenges to build your streak
- See your current and longest streak

## 🔧 Troubleshooting

### If you get "Port already in use" errors:

```bash
npx expo start --port 3000
```

### If the app doesn't start:

```bash
npx expo start --clear
```

### If you see TypeScript errors:

```bash
npx tsc --noEmit
```

## 📊 What's Working

✅ **Database Layer** - SQLite schema with workspaces, vocab, sessions, streaks
✅ **Workspace CRUD** - Create, read, update, delete workspaces
✅ **Vocabulary Management** - Add, view, and manage vocabulary items
✅ **Spaced Repetition Algorithm** - Weighted selection and updates
✅ **Daily Challenge** - 10-item flashcard challenge
✅ **Streak Tracking** - Daily streak with grace period logic
✅ **Navigation** - Screen navigation between features

## 🎯 Next Steps

The app is fully functional! You can:
1. Create workspaces for different language pairs
2. Add vocabulary items to each workspace
3. Take the daily challenge to test your knowledge
4. Track your progress with streaks and statistics

Enjoy learning with Vocl! 📚