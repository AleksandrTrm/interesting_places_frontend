import { createBrowserRouter } from "react-router-dom";
import { Authentication } from "../pages/authentication/Authentication.tsx";
import { Main } from "../pages/Main.tsx";
import { Home } from "../pages/Home.tsx";
import { Attractions } from "../pages/Attractions.tsx";
import { Logout } from "../pages/Logout.tsx";
import { ProtectedRoute } from "../components/ProtectedRoute.tsx";
import { FamousPeople } from "../pages/FamousPeople.tsx";
import { Places } from "../pages/Places.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Main />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/people",
        element: <FamousPeople />,
      },
      {
        path: "attractions",
        element: <Attractions />,
      },
      {
        path: "places",
        element: <Places />,
      },
    ],
  },
  {
    path: "/authentication",
    element: <Authentication />,
  },
  {
    path: "/logout",
    element: <Logout />,
  },
]);
