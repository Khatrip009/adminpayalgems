import React, { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import AdminTopbar from "../components/layout/AdminTopbar";
import AdminSidebar from "../components/layout/AdminSidebar";
import { WarehouseProvider } from "@/context/WarehouseContext";

const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Handlers ───────────────────────────────────────
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), []);
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const toggleMobileSidebar = useCallback(
    () => setMobileSidebarOpen((prev) => !prev),
    []
  );

  // ── Lock body scroll when sidebar is open ─────────
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <WarehouseProvider>
      <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {/* ====================================================
            DESKTOP SIDEBAR (always visible on lg+)
        ==================================================== */}
        <AdminSidebar variant="desktop" />

        {/* ====================================================
            MOBILE SIDEBAR OVERLAY (slides in from left)
        ==================================================== */}
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${
            mobileSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          } md:hidden`}
        >
          {/* Scrim / backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <div
            className={`absolute left-0 top-0 z-50 h-full w-[280px] max-w-[85vw] transform transition-transform duration-300 ease-in-out ${
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <AdminSidebar
              variant="mobile"
              onCloseMobile={closeMobileSidebar}
            />
          </div>
        </div>

        {/* ====================================================
            MAIN CONTENT AREA
        ==================================================== */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Topbar (sticky) */}
          <header className="sticky top-0 z-10 w-full bg-slate-100/80 backdrop-blur dark:bg-slate-950/80">
            <AdminTopbar onToggleSidebar={toggleMobileSidebar} />
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </WarehouseProvider>
  );
};

export default AdminLayout;