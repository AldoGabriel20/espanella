/**
 * Application-level config resolved from environment variables.
 * NEXT_PUBLIC_APP_NAME is available in both server and client components.
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Hachi & Lota";
