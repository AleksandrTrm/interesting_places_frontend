import { Header } from "../../components/Header";
import { Outlet } from "react-router-dom";

export function Main() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
