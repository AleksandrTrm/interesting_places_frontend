import { Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="flex flex-col h-screen">
      {/* <Header /> */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
      {/* <Footer /> */}
    </div>
  );
}
