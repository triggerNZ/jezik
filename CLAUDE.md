# jezik

A Duolingo-style language-learning app: bite-sized lessons, streaks, and gamified practice.

## Platforms

Ships as a mobile app (iOS + Android) and a website from a single codebase.

## Stack

- **TypeScript** throughout
- **Expo** (React Native) for iOS, Android, and web
- **Expo Router** for file-based routing across all three platforms
- **React Native Web** (provided by Expo) for the web build

## Conventions

- Shared UI and business logic live in one codebase; platform-specific code uses `.ios.tsx` / `.android.tsx` / `.web.tsx` suffixes only when necessary.
- Prefer Expo-maintained modules over bare React Native libraries when both exist.
