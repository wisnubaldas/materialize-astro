import React from 'react';
import { Redirect } from 'expo-router';

import './global.css';

/**
 * Legacy compatibility entry for environments that import App directly.
 * @returns {React.ReactElement} Redirect to the Expo Router root route.
 */
export default function App() {
  return <Redirect href="/" />;
}
