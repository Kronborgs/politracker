"use client";

const TOKEN_KEY = "politracker_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `pt_admin_token=${token}; path=/; max-age=2592000; samesite=lax`;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = "pt_admin_token=; path=/; max-age=0; samesite=lax";
}
