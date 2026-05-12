# Ionic JavaScript Mobile App Starter

This starter is built for a simple mobile application using:

- Ionic React
- JavaScript only
- Vite
- Capacitor
- External API integration through environment variables

No backend code is included in this project.

## 1. Project Structure

```text
src/
 ├── auth/
 │   └── AuthContext.jsx
 ├── components/
 │   ├── AppHeader.jsx
 │   └── DashboardCard.jsx
 ├── config/
 │   └── env.js
 ├── guards/
 │   └── ProtectedRoute.jsx
 ├── pages/
 │   ├── DashboardPage.jsx
 │   └── LoginPage.jsx
 ├── services/
 │   ├── apiService.js
 │   ├── authService.js
 │   └── storageService.js
 ├── styles/
 │   └── global.css
 ├── theme/
 │   └── variables.css
 └── utils/
     └── validators.js
```

## 2. Requirements

Install these tools first:

- Node.js LTS
- npm
- Ionic CLI
- Android Studio
- Android SDK
- Java JDK supported by Android Studio

Install Ionic CLI globally:

```bash
npm install -g @ionic/cli
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Environment Configuration

Copy `.env.example` into `.env`:

```bash
cp .env.example .env
```

Example `.env`:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_USE_MOCK_AUTH=true
VITE_AUTH_LOGIN_PATH=/auth/login
VITE_APP_NAME=Simple Mobile App
```

### Early Development Login

By default, mock login is enabled:

```env
VITE_USE_MOCK_AUTH=true
```

Use this account:

```text
Username: admin
Password: admin123
```

### Connect to External API

When your API is ready, change:

```env
VITE_USE_MOCK_AUTH=false
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_AUTH_LOGIN_PATH=/auth/login
```

The login response should return a token in one of these common fields:

```json
{
  "token": "your-token"
}
```

or:

```json
{
  "access_token": "your-token"
}
```

You can adjust the response mapping in:

```text
src/services/authService.js
```

## 5. Run in Browser

```bash
npm run dev
```

Open:

```text
http://localhost:8100
```

Use browser DevTools to inspect:

- Console errors
- Network requests
- Local UI state
- Layout issues

## 6. Add Android Platform

Run this once after dependencies are installed:

```bash
npm run build
npx cap add android
```

If Android already exists, do not run `npx cap add android` again. Use sync instead.

## 7. Run on Android Emulator or Device

Build and sync the web app into Android:

```bash
npm run build
npx cap sync android
npx cap open android
```

Then run the app from Android Studio.

## 8. Live Reload on Android Device

Make sure your computer and Android device are on the same network.

```bash
ionic cap run android -l --external
```

This is useful for development because changes reload without manually rebuilding the APK each time.

## 9. Debug Android WebView

Enable USB Debugging on Android device:

```text
Settings → About Phone → tap Build Number 7 times
Settings → Developer Options → USB Debugging ON
```

Then open Chrome on your computer:

```text
chrome://inspect/#devices
```

Use this to debug:

- Console logs
- Network requests
- DOM structure
- Runtime errors inside the Android WebView

## 10. Build for Production Web Assets

```bash
npm run build
```

The production web build will be placed in:

```text
dist/
```

## 11. Sync Production Build to Android

```bash
npx cap sync android
```

This copies the production web assets into the native Android project.

## 12. Build Debug APK

```bash
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:

```text
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

Debug APK location is usually:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Use debug APK only for testing.

## 13. Build Release APK

```bash
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:

```text
Build → Generate Signed Bundle / APK → APK
```

Create or select a keystore, then follow the signing steps.

Important:

- Do not commit keystore files.
- Do not commit keystore passwords.
- Keep release credentials outside the repository.

## 14. Build Android App Bundle for Play Store

For Google Play distribution, choose:

```text
Build → Generate Signed Bundle / APK → Android App Bundle
```

The output format is usually `.aab`.

## 15. Daily Development Workflow

For normal UI development:

```bash
npm run dev
```

For Android testing:

```bash
npm run build
npx cap sync android
npx cap open android
```

For release preparation:

```bash
npm run build
npx cap sync android
```

Then create the signed APK or AAB from Android Studio.

## 16. Code Rules

See both project-level and mobile-specific agent rules:

```text
../AGENTS.md
mobile_agent.md
```

Main rules:

- JavaScript only
- No `.ts` or `.tsx`
- Comments required on every component and function
- Pages must not call `fetch()` directly
- API requests must go through services
- Auth state must go through `AuthContext`
- Protected pages must use `ProtectedRoute`
