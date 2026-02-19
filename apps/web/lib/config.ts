export const apiBasePublic = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
export const apiBaseInternal = process.env.API_INTERNAL_BASE_URL || "http://api:8080";

export const appVersion = process.env.APP_VERSION || "dev";
export const gitSha = process.env.GIT_SHA || "local";
export const buildTime = process.env.BUILD_TIME || new Date(0).toISOString();
