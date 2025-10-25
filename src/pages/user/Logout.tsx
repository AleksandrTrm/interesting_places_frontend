import { useAuth } from "../../contexts/useAuth";
import { useNavigate } from "react-router-dom";

export function Logout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/authentication");
  };

  return (
    <div>
      <h1>Добро пожаловать, {user?.userName || user?.email}!</h1>
      <button onClick={handleLogout}>Выйти</button>
    </div>
  );
}
