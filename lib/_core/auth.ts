import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

export async function getSessionToken() {
  if (Platform.OS === "web") return null;
  try { return await SecureStore.getItemAsync(SESSION_TOKEN_KEY); } catch { return null; }
}

export async function setSessionToken(token: string) {
  if (Platform.OS !== "web") await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function removeSessionToken() {
  if (Platform.OS !== "web") await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

export async function getUserInfo(): Promise<User | null> {
  try {
    const value = Platform.OS === "web" ? window.localStorage.getItem(USER_INFO_KEY) : await SecureStore.getItemAsync(USER_INFO_KEY);
    return value ? JSON.parse(value) as User : null;
  } catch { return null; }
}

export async function setUserInfo(user: User) {
  const value = JSON.stringify(user);
  if (Platform.OS === "web") window.localStorage.setItem(USER_INFO_KEY, value);
  else await SecureStore.setItemAsync(USER_INFO_KEY, value);
}

export async function clearUserInfo() {
  if (Platform.OS === "web") window.localStorage.removeItem(USER_INFO_KEY);
  else await SecureStore.deleteItemAsync(USER_INFO_KEY);
}
