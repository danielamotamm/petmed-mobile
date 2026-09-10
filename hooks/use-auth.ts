import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { useCallback, useEffect, useState } from "react";

type UseAuthOptions = { autoFetch?: boolean };

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<Auth.User | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUser = await Api.getMe();
      if (!apiUser) {
        await Auth.clearUserInfo();
        setUser(null);
        return;
      }
      const nextUser: Auth.User = { ...apiUser, lastSignedIn: new Date(apiUser.lastSignedIn) };
      await Auth.setUserInfo(nextUser);
      // Local MVP records have no owner and must never leak into an authenticated account.
      await AsyncStorage.multiRemove(["petmed:medications", "petmed:doses"]);
      setUser(nextUser);
    } catch (cause) {
      setUser(null);
      setError(cause instanceof Error ? cause : new Error("Failed to load the session"));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Api.logout();
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      await AsyncStorage.multiRemove(["petmed:medications", "petmed:doses"]);
      setUser(null);
      setError(null);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) void refresh();
    else setLoading(false);
  }, [autoFetch, refresh]);

  return { user, loading, error, isAuthenticated: Boolean(user), refresh, logout };
}
