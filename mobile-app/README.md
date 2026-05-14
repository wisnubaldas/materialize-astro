# MAU APP Mobile

React Native + Expo mobile frontend for MAU APP.

This project uses:

- React Native
- Expo
- JavaScript only
- Expo Router
- AsyncStorage for token persistence
- Expo Camera for barcode and QR scanning in supported operational forms
- Environment-based API configuration

No backend code belongs in this project.

## Project Structure

```text
src/
 ├── components/
 │   ├── layout/
 │   └── ui/
 ├── config/
 ├── contexts/
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

## UI Components

Reusable UI primitives live in `src/components/ui/`.

Use these first for new screens:

- `Text`
- `Button`
- `Input`
- `Card`
- `Badge`
- `Separator`
- `Spinner`
- `Drawer`
- `BarcodeScanner`
- `QrScanner`

Do not copy the source template's TypeScript files directly. This app stays JavaScript-only.

### Creating a UI Component

When adding a new reusable UI primitive:

- Create a `.js` file in `src/components/ui/`.
- Use NativeWind `className` as the default styling API.
- Add JSDoc to exported components and important functions.
- Export it from `src/components/ui/index.js`.
- Keep business logic, API calls, and screen-specific state out of UI primitives.
- Prefer existing dependencies before installing new UI libraries.

Example:

```js
import React from 'react';
import { View } from 'react-native';

import { Text } from './text';
import { cn } from './utils/cn';

/**
 * Renders a compact status row.
 * @param {{ label: string, value: string, className?: string }} props - Status row props.
 * @returns {React.ReactElement} Status row.
 */
export function StatusRow({ label, value, className = '' }) {
  return (
    <View className={cn('flex-row items-center justify-between py-2', className)}>
      <Text variant="muted">{label}</Text>
      <Text className="font-semibold text-foreground">{value}</Text>
    </View>
  );
}
```

### Usage Examples

```js
import React from 'react';
import { View } from 'react-native';

import { Button, Card, CardContent, Input, Text } from '../components/ui';

/**
 * Renders a simple form example.
 * @returns {React.ReactElement} Example form.
 */
export default function ExampleForm() {
  return (
    <Card>
      <CardContent className="gap-4">
        <Text variant="title">Form title</Text>
        <Input placeholder="AWB number" autoCapitalize="characters" />
        <Button>
          <Text>Submit</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Delayed Dependencies

These components still need separate product/UI review before implementation:

- `Dialog`
- `Sheet`
- `Select`
- `Checkbox`
- `Switch`
- Gesture-based drawer

Do not install `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-svg`, or extra Expo permission modules unless the target flow is already clear.

## Native Permissions

Build Up Checklist uses `expo-camera` to scan barcodes for AWB/MAWB and ULD input fields.

Camera access is requested only when the user opens the scanner. The scanned barcode payload only fills the local form field; final validation and persistence must still happen through the backend API.

`QrScanner` is kept as a separate reusable component for future QR-code flows, but Build Up currently uses `BarcodeScanner`.

For production builds, `app.json` includes:

- `scheme: "mauapp"` for Expo Router linking.
- `expo-camera` plugin with a camera permission message.

Expo Go can test the scanner, but camera behavior should still be reviewed on a physical Android device before release.

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
