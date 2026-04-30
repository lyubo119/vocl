# Vocl - Testing Instructions

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd vocablens
npm install
```

### 2. Start Development Server

```bash
npx expo start
```

This will start the Expo development server and display a QR code in your terminal.

### 3. Test on Physical Device

1. **Install Expo Go** on your Android or iOS device:
   - [Android - Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/us/app/expo-go/id982107779)

2. **Scan the QR code** using the Expo Go app camera

3. **Test the app features:**
   - Create a new workspace with language pair (e.g., English → Spanish)
   - Add vocabulary items to your workspace
   - Try the daily challenge to test the spaced repetition algorithm
   - View your vocabulary list with stats

### 4. Alternative: Android Emulator

If you have Android Studio installed:

```bash
npx expo start --android
```

### 5. iOS Simulator (Mac only)

```bash
npx expo start --ios
```

## 🔧 Troubleshooting

### Port Conflicts

If you get port conflicts (e.g., port 8081 in use):

```bash
npx expo start --port 3000
```

Or clear the cache:

```bash
npx expo start --clear
```

### TypeScript Errors

If you encounter TypeScript errors, run:

```bash
npx tsc --noEmit
```

To fix common issues:
- Make sure all imports are correct
- Check that all types are properly defined
- Run `npm install` to ensure all dependencies are installed

## 📋 Implemented Features

✅ **Workspace Management**
- Create, view, and switch between workspaces
- Language pair configuration (source → target)
- SQLite database storage

✅ **Vocabulary Management**
- Add vocabulary items with word, translation, and notes
- View vocabulary list with stats (weight, streak, accuracy)
- SQLite storage with proper schema

✅ **Spaced Repetition Algorithm**
- Weighted selection for daily challenge (higher weight = more likely to appear)
- Weight updates on correct/incorrect answers
- Reinforcement of mastered items (weight < 0.2)

✅ **Daily Challenge**
- 10-item challenge with flashcard UI
- Answer input and scoring system
- Session tracking and completion

## 🧪 Testing the Core Features

### Workspace Creation
1. Open the app
2. Click "Create Sample Workspace"
3. Verify workspace appears in the list
4. Select the workspace to make it active

### Vocabulary Addition
1. Navigate to the vocabulary list (coming soon in full implementation)
2. Add a few vocabulary items with words and translations
3. Check that they appear in the list with proper stats

### Daily Challenge
1. Make sure you have at least 10 vocabulary items
2. Start the daily challenge
3. Answer questions and see your score
4. Complete the challenge to save your session

## 📱 Mobile Testing Tips

- Use a stable WiFi connection for best QR code scanning
- Make sure your phone and computer are on the same network
- If QR code doesn't work, try the "Connection" menu in Expo Go for alternative options
- For Android, you can also use USB debugging with `adb`

## 🐛 Known Issues & Limitations

This is an early prototype, so you might encounter:
- Navigation between screens not fully implemented
- Some UI elements may not be perfectly styled
- Error handling could be improved
- Not all features from the requirements are complete

## 🎯 Next Steps

The current implementation includes:
- ✅ Core database schema and queries
- ✅ Workspace CRUD functionality
- ✅ Spaced repetition algorithm
- ✅ Basic UI for workspace management
- ⏳ Navigation between screens (partial)
- ⏳ Vocabulary list UI (partial)
- ⏳ Daily challenge UI (partial)

To see the complete feature list, check `task.md` in the project root.