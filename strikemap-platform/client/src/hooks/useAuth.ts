import { useEffect, useState } from "react";
import { api } from "../lib/api";

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  level: number;
  totalXp: number;
};

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const refresh = async () => {
    const data = await api<{ user: User | null }>("/api/auth/me");
    setUser(data.user);
  };
  useEffect(() => {
    void refresh();
  }, []);
  return { user, refresh, loading: user === undefined };
}
