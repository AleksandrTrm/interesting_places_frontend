// src/router.tsx
import { Home } from "../pages/user/Home.tsx";
import { Main } from "../pages/user/Main.tsx";
import { Places } from "../pages/user/Places.tsx";
import { createBrowserRouter } from "react-router-dom";
import { Attractions } from "../pages/user/Attractions.tsx";
import { FamousPeople } from "../pages/user/FamousPeople.tsx";
import { ProtectedRoute } from "../components/ProtectedRoute.tsx";
import { ModeratorMain } from "../pages/moderator/ModeratorMain.tsx";
import { Authentication } from "../pages/authentication/Authentication.tsx";
import { MyPlaces } from "../pages/user/MyPlaces.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute allowedRoles={["User", "Admin", "Moderator"]}>
        <Main />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "/people", element: <FamousPeople /> },
      { path: "attractions", element: <Attractions /> },
      { path: "places", element: <Places /> },
      { path: "places/my", element: <MyPlaces /> },
      {
        path: "moderator",
        element: (
          <ProtectedRoute allowedRoles={["Admin", "Moderator"]}>
            <ModeratorMain />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/authentication",
    element: <Authentication />,
  },
]);
