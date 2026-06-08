import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { X, ChevronDown } from "lucide-react";
import { ADMIN_NAV_SECTIONS } from "../../config/adminNav";
import { useAuth } from "../../context/AuthContext";

const AdminSidebar: React.FC<{
  variant?: "desktop" | "mobile";
  onCloseMobile?: () => void;
}> = ({ variant = "desktop", onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = variant === "mobile";

  // Which accordion sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Auto‑open the section containing the current route
  useEffect(() => {
    ADMIN_NAV_SECTIONS.forEach((section) => {
      const isActive = section.items.some((item) =>
        location.pathname.startsWith(item.path)
      );
      if (isActive) {
        setOpenSections((prev) => ({ ...prev, [section.title]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSection = (title: string) =>
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside
      className={`
        flex h-full flex-col
        border-r border-slate-200/10
        bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950
        text-slate-100
        ${isMobile ? "w-[280px] max-w-[85vw]" : "hidden md:flex md:w-72"}
      `}
      aria-label="Admin navigation"
    >
      {/* ── Brand & user ── */}
      <div className="relative shrink-0 border-b border-slate-800/80 px-5 py-6">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="flex h-20 w-56 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-50 via-blue-100 to-indigo-50 shadow-[0_16px_40px_rgba(125,211,252,0.4)]">
            <img
              src="/minal_gems_logo.svg"
              alt="Minal Gems"
              className="h-auto w-40 drop-shadow-lg"
              loading="lazy"
            />
          </div>
          <p className="font-['Playfair_Display'] text-xl font-semibold text-sky-100 tracking-wide drop-shadow">
            Admin Dashboard
          </p>

          {/* Close button (mobile only) */}
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User card */}
        {user && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-inner text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold">
                {((user.full_name || user.email)?.split(" ").map((p: string) => p[0]).slice(0, 2).join("") || "A").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sky-100">
                  {user.full_name || "Admin"}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-5 overscroll-contain">
        {ADMIN_NAV_SECTIONS.map((section) => {
          const isOpen = openSections[section.title];
          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-2 py-1 text-sm font-semibold text-slate-400 hover:text-sky-200 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-['Playfair_Display'] text-base">{section.title}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-sky-300" : "text-slate-600"
                  }`}
                />
              </button>

              {/* Collapsible items with smooth height animation */}
              <div
                className={`mt-2 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-sky-900/40 text-sky-100 border border-sky-500/50 shadow-[0_0_18px_rgba(56,189,248,0.4)]"
                            : "text-slate-300 hover:bg-slate-800/70 hover:text-sky-200"
                        }`
                      }
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900/80 ring-1 ring-slate-800">
                        <Icon className="h-5 w-5 text-sky-200 drop-shadow" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-slate-800 px-5 py-4">
        <p className="flex items-center justify-between text-xs text-slate-400">
          <span>Role:</span>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-100">
            Admin
          </span>
        </p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
