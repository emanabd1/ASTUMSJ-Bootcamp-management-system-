import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#16110e] font-serif">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-[#16110e] p-4 text-[#f5efe6] sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}