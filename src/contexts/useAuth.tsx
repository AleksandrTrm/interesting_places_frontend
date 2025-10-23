import { useContext } from "react";
import { AuthContext } from "./AuthContextInstance";

export const useAuth = () => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuth must be used with auth provider");
  }

  return authContext;
};
