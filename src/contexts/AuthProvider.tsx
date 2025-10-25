// src/contexts/AuthProvider.tsx

import { useState, useEffect, useLayoutEffect } from "react";
import { api } from "../api/api";
import { AccountService } from "../api/accounts";
import { type User } from "../models/User";
import { AuthContext, type AuthContextType } from "./AuthContextInstance";

type Props = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [refreshToken, setRefreshToken] = useState<string | undefined>(
    undefined
  );
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useLayoutEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const res = await AccountService.refresh();
        setAccessToken(res.data!.accessToken);
        setRefreshToken(res.data!.refreshToken);

        const userData: User = {
          id: res.data!.id,
          username: res.data!.username,
          email: res.data!.email,
          selectedAvatar: res.data!.selectedAvatar,
          role: res.data!.role,
        };

        setUser(userData);
      } catch (err) {
        console.error("Restore session failed:", err);
        setAccessToken(undefined);
        setRefreshToken(undefined);
        setUser(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    const refreshInterceptor = api.interceptors.response.use(
      (config) => config,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            const originalRequest = error.config;
            const res = await AccountService.refresh();

            setAccessToken(res.data!.accessToken);
            setRefreshToken(res.data!.refreshToken);

            const userData: User = {
              id: res.data!.id,
              username: res.data!.username,
              email: res.data.email,
              selectedAvatar: res.data.selectedAvatar,
              role: res.data.role,
            };
            setUser(userData);

            originalRequest.headers.Authorization = `Bearer ${
              res.data!.accessToken
            }`;
            return api(originalRequest);
          } catch (err) {
            console.error("Refresh failed:", err);
            setAccessToken(undefined);
            setRefreshToken(undefined);
            setUser(undefined);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(refreshInterceptor);
    };
  }, []);

  useEffect(() => {
    const accessTokenInterceptor = api.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(accessTokenInterceptor);
    };
  }, [accessToken]);

  const login = async (email: string, password: string): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await AccountService.login(email, password);

      setAccessToken(response.data!.accessToken);
      setRefreshToken(response.data!.refreshToken);

      const userData: User = {
        id: response.data!.id,
        username: response.data!.username,
        email: response.data!.email,
        selectedAvatar: response.data!.selectedAvatar,
        role: response.data!.role,
      };
      setUser(userData);

      return response.data!.role;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAccessToken(undefined);
    setRefreshToken(undefined);
    setUser(undefined);
  };

  const value: AuthContextType = {
    accessToken,
    refreshToken,
    user,
    login,
    logout,
    isLoading,
    isAuthenticated,
    getUserRole: () => user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
