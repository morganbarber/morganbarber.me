/**
 * sessionStorage key recording that the intro overlay has played this tab.
 *
 * Lives in a plain module rather than in loader.tsx: that file is
 * "use client", and a server component importing a value from a client module
 * receives a client-reference proxy instead of the value. The app layout reads
 * this from the server to build its pre-paint script.
 */
export const INTRO_STORAGE_KEY = "portfolio_loaded";
