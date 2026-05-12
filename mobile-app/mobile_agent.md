# AGENTS.md

## Project identity

This project is a **React Native + Expo mobile app** using **JavaScript only**.

The project must stay focused on the mobile frontend. Do not generate backend code, database migrations, server routes, API controllers, or server deployment scripts inside this repository.

## Hard rules

1. Use JavaScript only.
   - Allowed: `.js`, `.jsx`, `.json`, `.md`.
   - Not allowed: `.ts`, `.tsx`.
   - Do not introduce TypeScript configuration files.

2. Keep the code easy to maintain.
   - Screens belong in `src/screens`.
   - Reusable UI belongs in `src/components`.
   - API calls belong in `src/services`.
   - Global state belongs in `src/contexts`.
   - Navigation belongs in `src/navigation`.
   - Shared colors, spacing, and typography belong in `src/styles`.
   - Validation/helper functions belong in `src/utils`.

3. Comment every important function and component.
   - Every exported function must have a JSDoc comment.
   - Every screen component must explain its role.
   - Every service function must explain its input and output.
   - Do not add excessive comments for obvious single-line variables.

4. Do not call APIs directly from screens.
   - Screens may call context methods or service methods.
   - Screens must not contain repeated `fetch()` logic.
   - Keep API URL configuration in `.env` and `src/config/env.js`.

5. Do not hardcode sensitive values.
   - Do not hardcode tokens.
   - Do not hardcode production API URLs inside screens.
   - Do not commit `.env`.

6. Keep authentication predictable.
   - Auth state is managed in `src/contexts/AuthContext.js`.
   - Token storage is handled by `src/services/storageService.js`.
   - Login request behavior is handled by `src/services/authService.js`.

7. Start simple.
   - Do not add Redux, Zustand, SQLite, Firebase, or push notification libraries unless explicitly needed.
   - For standard CRUD apps, prefer Context + service functions first.

8. Use Expo-compatible libraries.
   - Prefer `npx expo install <package>` when installing React Native native packages.
   - Do not add native packages that require manual native configuration unless the app already moved to a development build.

## Coding style

- Use functional React components.
- Use clear component names, for example `LoginScreen`, `DashboardScreen`, `AppButton`.
- Keep each file focused on one responsibility.
- Avoid large screens. Extract repeated UI into components.
- Keep form validation in utility files when possible.
- Use `async/await` for asynchronous logic.
- Handle API errors with readable messages.

## Current starter scope

The current starter includes:

- Login screen
- Dashboard screen
- Authentication context
- Mock login mode
- Persistent token storage
- API request wrapper
- Environment-based API configuration
- EAS build profile for Android APK preview and Android App Bundle production

## Demo account

```txt
Email: admin@admin.com
Password: password123
```

Mock login is controlled by:

```txt
EXPO_PUBLIC_USE_MOCK_AUTH=true
```

Set it to `false` when the real API is ready.
