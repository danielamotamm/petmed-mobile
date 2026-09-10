import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "./auth";

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (Platform.OS !== "web") {
    const token = await Auth.getSessionToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  const url = baseUrl ? `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}` : endpoint;
  const response = await fetch(url, { ...options, headers, credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function exchangeOAuthCode(code: string, state: string) {
  const params = new URLSearchParams({ code, state });
  const result = await apiCall<{ app_session_id: string; user: unknown }>(`/api/oauth/mobile?${params}`);
  return { sessionToken: result.app_session_id, user: result.user };
}

export async function logout() { await apiCall("/api/auth/logout", { method: "POST" }); }

export async function getMe(): Promise<{ id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; lastSignedIn: string } | null> {
  try { return (await apiCall<{ user: { id: number; openId: string; name: string | null; email: string | null; loginMethod: string | null; lastSignedIn: string } | null }>("/api/auth/me")).user; } catch { return null; }
}
