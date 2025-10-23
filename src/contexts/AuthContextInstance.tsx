import { createContext } from "react";
import { type User } from "../models/User";

export type AuthContextType = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  user: User | undefined;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };
