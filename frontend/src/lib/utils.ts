import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Whether Google Sign-In should be offered in the UI. Enabled by default so
 * staging/production (which never set VITE_GOOGLE_AUTH_ENABLED) keep their
 * existing behavior; set VITE_GOOGLE_AUTH_ENABLED=false in a local
 * development .env to hide/disable the Google buttons.
 */
export function isGoogleAuthEnabled(): boolean {
  return import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== 'false';
}