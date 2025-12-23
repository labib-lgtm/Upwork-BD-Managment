/**
 * Returns the base URL for the application.
 * Uses VITE_APP_URL environment variable if set, otherwise falls back to window.location.origin.
 * 
 * Set VITE_APP_URL in your .env file to your production domain when deploying.
 */
export const getAppUrl = (): string => {
  return import.meta.env.VITE_APP_URL || window.location.origin;
};
