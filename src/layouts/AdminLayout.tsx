import React, { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import AdminTopbar from "../components/layout/AdminTopbar";
import AdminSidebar from "../components/layout/AdminSidebar";
import { WarehouseProvider } from "@/context/WarehouseContext";

const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* =====================================================
     HANDLERS
  ===================================================== */

  const openMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileSidebarOpen((open) => !open);
  }, []);

  /* =====================================================
     LOCK BODY SCROLL (MOBILE SIDEBAR)
  ===================================================== */

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

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <WarehouseProvider>
      <div className="flex min-h-[100dvh] bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {/* =================================================
            DESKTOP SIDEBAR
        ================================================= */}
        <AdminSidebar variant="desktop" />

        {/* =================================================
            MOBILE SIDEBAR OVERLAY
        ================================================= */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/40"
              aria-hidden="true"
              onClick={closeMobileSidebar}
            />

            {/* Sidebar */}
            <div className="relative z-50 h-full w-[280px]">
              <AdminSidebar
                variant="mobile"
                onCloseMobile={closeMobileSidebar}
              />
            </div>
          </div>
        )}

        {/* =================================================
            MAIN CONTENT
        ================================================= */}
        <div className="flex min-h-[100dvh] flex-1 flex-col">
          {/* TOPBAR */}
          <header className="sticky top-0 z-30 w-full bg-slate-100/80 backdrop-blur dark:bg-slate-950/80">
            <AdminTopbar onToggleSidebar={toggleMobileSidebar} />
          </header>

          {/* PAGE CONTENT */}
          <main className="relative z-0 flex-1 px-4 py-4 md:px-6 md:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </WarehouseProvider>
  );
};

export default AdminLayout;
