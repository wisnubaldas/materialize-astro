import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional class names and resolves Tailwind utility conflicts.
 * @param {...unknown} inputs - Class name values accepted by clsx.
 * @returns {string} Merged class name string.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
