# MAU APP Mobile

React Native + Expo mobile frontend for MAU APP.

This project uses:

- React Native
- Expo
- JavaScript only
- React Navigation
- AsyncStorage for token persistence
- Environment-based API configuration

No backend code belongs in this project.

## Project Structure

```text
src/
 ├── components/
 │   └── layout/
 ├── config/
 ├── contexts/
 ├── navigation/
 ├── screens/
 ├── services/
 ├── styles/
 └── utils/
```

## Screen Layout Pattern

Use shared layout components for new screens:

- `src/components/layout/ScreenLayout.js` handles safe area, keyboard-aware wrapping, scroll behavior, and responsive web width.
- `src/components/layout/ScreenHeader.js` handles basic stack headers with back/close actions.
- Screens should focus on content and behavior. Avoid repeating safe area, scroll, keyboard, and footer boilerplate in every screen.
- Keep NativeWind wired through `metro.config.js` and `global.css`. Do not add `nativewind/babel` for the current installed NativeWind version because it tries to import `nativewind/jsx-runtime`, which is not exported by this package.

## Install

```bash
npm install
```

## Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Example:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_AUTH_LOGIN_PATH=/auth/login
EXPO_PUBLIC_AUTH_PROFILE_PATH=/auth/me
EXPO_PUBLIC_USE_MOCK_AUTH=false
```

For testing from a physical phone, use the computer LAN IP:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.12:8000
```

## Run

```bash
npm start
```

Then open the app with Expo Go or run:

```bash
npm run android
```

Open the same mobile UI in a browser for quick responsive checks:

```bash
npm run web
```

Expo will open the app through React Native Web. Keep using the same `.env` values, and use a LAN API URL when the browser or physical device cannot reach `127.0.0.1`.

## Auth

Mock login is available for isolated UI development:

```env
EXPO_PUBLIC_USE_MOCK_AUTH=true
```

Demo account:

```text
Email: admin@admin.com
Password: password123
```

For backend auth, set:

```env
EXPO_PUBLIC_USE_MOCK_AUTH=false
```

The mobile app sends:

```text
POST /auth/login
```

Then loads the profile from:

```text
GET /auth/me
```

## Build

Preview APK:

```bash
npm run build:android:preview
```

Production Android App Bundle:

```bash
npm run build:android:production
```

## Code Rules

See:

```text
../AGENTS.md
mobile_agent.md
```

Agar login dari HP fisik Expo Go bisa masuk backend, jalankan FastAPI seperti ini dari materialize-fastapi:

```
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Lalu restart Expo:

```
npx expo start --clear --host lan
```
