import { useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "../lib/api";

export type User = {
  id: string;
  username: string;
  level: number;
  xp: number;
  email?: string;
  displayName?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const refresh = async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const data = await api<{ profile: { id: string; username: string; level: number; xp: number } }>(
        "/api/v1/profile/me",
      );
      setUser({
        id: data.profile.id,
        username: data.profile.username,
        level: data.profile.level,
        xp: data.profile.xp,
      });
    } catch {
      clearToken();
      setUser(null);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return { user, refresh, loading: user === undefined, setToken, clearToken };
}
