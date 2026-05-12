# AGENTS.md

## Project Scope

This project is a **mobile frontend only** application built with **Ionic React, JavaScript, Vite, and Capacitor**.

The backend/API is maintained outside this repository. Do not generate, modify, scaffold, or document backend implementation code inside this project.

## Main Technology Rules

1. Use **JavaScript only**.
2. Do not create `.ts` or `.tsx` files.
3. Use `.js` for services, utilities, constants, and configuration files.
4. Use `.jsx` for React components, pages, providers, and route components.
5. Do not introduce TypeScript, Angular, or Vue unless the project owner explicitly changes the stack.
6. Use Ionic React components for mobile UI behavior.
7. Use Capacitor only for native mobile features and Android/iOS packaging.
8. Keep the app lightweight. Do not add large libraries unless the feature cannot be handled cleanly with the existing stack.

## Folder Structure Rules

Use this structure for future development:

```text
src/
 ├── auth/          # Authentication context and auth-related state
 ├── components/    # Reusable UI components
 ├── config/        # Environment and app configuration
 ├── guards/        # Route protection components
 ├── pages/         # Screen-level pages
 ├── services/      # API, storage, and business service modules
 ├── styles/        # Global app CSS
 ├── theme/         # Ionic theme variables
 └── utils/         # Validation, formatting, helper functions
```

Rules:

1. Pages must stay thin. A page may handle screen state, UI events, and presentation logic, but API calls must be placed in service modules.
2. Shared UI must be extracted into `src/components`.
3. Reusable business logic must be extracted into `src/services` or `src/utils`.
4. Route-level protection must be handled inside `src/guards`.
5. Environment values must be read through `src/config/env.js`.
6. Do not hardcode API URLs, tokens, user IDs, credentials, or secret keys in pages or components.

## Commenting Rules

Every new file must be easy to track and understand.

Required comments:

1. Every React component must have a JSDoc block above the component function.
2. Every service function must have a JSDoc block explaining its purpose, parameters, and return value.
3. Every utility function must have a JSDoc block explaining the input and output.
4. Every context provider and custom hook must have a JSDoc block.
5. Every non-obvious conditional branch must have a short inline comment.
6. Every exported constant group must include a short comment explaining its purpose.

Example:

```js
/**
 * Validates whether the login form has the minimum required fields.
 * @param {{ username: string, password: string }} formData - Login form values.
 * @returns {{ isValid: boolean, message: string }} Validation result.
 */
export function validateLoginForm(formData) {
  // Keep this validation simple because API-level validation is handled outside this app.
  if (!formData.username || !formData.password) {
    return { isValid: false, message: 'Username and password are required.' };
  }

  return { isValid: true, message: '' };
}
```

## API Integration Rules

1. API calls must go through `src/services/apiService.js`.
2. Authentication calls must go through `src/services/authService.js`.
3. Token persistence must go through `src/services/storageService.js`.
4. Pages must not call `fetch()` directly.
5. Components must not call `fetch()` directly.
6. Use `VITE_API_BASE_URL` from environment variables for the external API base URL.
7. Use `VITE_AUTH_LOGIN_PATH` from environment variables for the login endpoint path.
8. Do not mention or implement backend framework details inside this repository.

## Authentication Rules

1. Use `AuthProvider` from `src/auth/AuthContext.jsx` to manage login state.
2. Use `useAuth()` when pages or components need authentication state.
3. Use `ProtectedRoute` for pages that require login.
4. Store only the minimum required session data.
5. Do not store passwords.
6. Do not store sensitive secrets in the frontend.
7. For production, use HTTPS-only external API URLs.

## UI Development Rules

1. Prefer Ionic components such as `IonPage`, `IonHeader`, `IonContent`, `IonButton`, `IonInput`, `IonCard`, `IonList`, and `IonToast`.
2. Keep UI simple and mobile-first.
3. Use reusable components for repeated card, input, header, empty state, and loading state patterns.
4. Avoid heavy UI libraries until there is a clear need.
5. Keep CSS organized in `src/styles/global.css` and `src/theme/variables.css`.
6. Class names should describe layout or purpose clearly.

## State Management Rules

1. Use React local state for page-specific state.
2. Use React Context only for app-wide state such as authentication.
3. Do not add Redux, Zustand, MobX, or other state libraries unless the app grows beyond simple state needs.
4. Keep state shape simple and readable.

## Error Handling Rules

1. Catch API errors inside service functions or page submit handlers.
2. Show user-facing errors through Ionic Toast or inline message blocks.
3. Do not expose raw server stack traces to users.
4. Console logging is allowed during development, but remove noisy logs before production build.

## Build and Release Rules

1. Always run `npm run build` before syncing native platforms.
2. Always run `npx cap sync android` after changing web code and before opening Android Studio for release testing.
3. Use Android Studio for final APK or AAB signing.
4. Never commit private keystore files or keystore passwords.
5. Keep `.env` files out of Git.

## Development Quality Checklist

Before considering a feature complete, verify:

- The code uses JavaScript only.
- No `.ts` or `.tsx` files were added.
- Every function and component has a useful comment.
- Pages do not call `fetch()` directly.
- API paths are not hardcoded inside pages.
- The screen works in `npm run dev`.
- The app builds with `npm run build`.
- Android sync works with `npx cap sync android`.
