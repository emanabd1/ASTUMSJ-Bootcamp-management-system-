import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#16110e] font-serif">
      {sidebarOpen && <Sidebar />}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 overflow-y-auto bg-[#16110e] p-8 text-[#f5efe6]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}