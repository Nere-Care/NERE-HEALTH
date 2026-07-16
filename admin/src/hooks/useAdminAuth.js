import { useState, useEffect, useCallback } from "react";
import {
  isAdminAuthenticated,
  getAdminUser,
  logoutAdmin,
  loginAdmin,
} from "../services/AuthService";

export function useAdminAuth() {
  const [user,          setUser]          = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      setUser(getAdminUser());
      setAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await loginAdmin(email, password);
    setUser(result.user);
    setAuthenticated(true);
    return result;
  }, []);

  const logout = useCallback(() => {
    logoutAdmin();
    setUser(null);
    setAuthenticated(false);
  }, []);

  return { user, authenticated, loading, login, logout };
}