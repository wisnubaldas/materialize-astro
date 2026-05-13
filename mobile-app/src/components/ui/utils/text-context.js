import { createContext, useContext } from 'react';

/**
 * Carries text class names from compound UI components to child text elements.
 * @type {React.Context<string>}
 */
export const TextClassContext = createContext('');

/**
 * Reads inherited text class names from compound UI components.
 * @returns {string} Text class names inherited from context.
 */
export function useTextClass() {
  return useContext(TextClassContext);
}
