import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { X, ChevronDown } from "lucide-react";
import { ADMIN_NAV_SECTIONS } from "../../config/adminNav";
import { useAuth } from "../../context/AuthContext";

const AdminSidebar = ({ variant = "desktop", onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = variant === "mobile";

  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    ADMIN_NAV_SECTIONS.forEach((section) => {
      const active = section.items.some((i) =>
        location.pathname.startsWith(i.path)
      );
      if (active) {
        setOpenSections((prev) => ({ ...prev, [section.title]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSection = (title: string) =>
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside
      className={
        variant === "desktop"
          ? "hidden md:flex min-h-screen w-72 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100"
          : "flex md:hidden min-h-screen w-72 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100"
      }
    >
      {/* BRAND HEADER */}
      <div className="relative border-b border-slate-800/80 px-5 py-6">
        <div className="flex flex-col items-center justify-center gap-4">

          <div
            className="
            flex h-22 w-60 items-center justify-center rounded-3xl
            bg-gradient-to-br from-cyan-50 via-blue-100 to-indigo-50
            shadow-[0_18px_42px_rgba(125,211,252,0.45)]
          "
          >
            <img
              src="/minal_gems_logo.svg"
              className="h-auto w-40 drop-shadow-xl"
              alt="Minal Gems"
              loading="lazy"
            />
          </div>

          <p className="font-['Playfair_Display'] text-[22px] font-semibold text-sky-100 tracking-wide drop-shadow-md">
            Admin Dashboard
          </p>

          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* USER BOX */}
        {user && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 shadow-inner text-[14px] font-['Inter']">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-[14px] font-semibold">
                {(user.full_name || user.email)
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-[15px] font-semibold text-sky-100">
                  {user.full_name || "Admin"}
                </p>
                <p className="text-[12px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">

        {ADMIN_NAV_SECTIONS.map((section) => {
          const isOpen = openSections[section.title];

          return (
            <div key={section.title}>
              <button
                className="w-full flex items-center justify-between px-2 pb-1 
                           text-[16px] font-['Playfair_Display'] font-semibold 
                           text-slate-400 hover:text-sky-200 transition-all"
                onClick={() => toggleSection(section.title)}
              >
                {section.title}
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
                    isOpen ? "rotate-180 text-sky-300" : "text-slate-600"
                  }`}
                />
              </button>

              {/* FIXED COLLAPSIBLE */}
              <div className={`transition-all duration-300 ${isOpen ? "block" : "hidden"}`}>
                <div className="mt-2 space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `
                          flex items-center gap-3 
                          rounded-xl px-3 py-3 
                          font-['Inter'] text-[15px] font-medium
                          transition-all
                          ${
                            isActive
                              ? "bg-sky-900/40 text-sky-100 border border-sky-500/50 shadow-[0_0_18px_rgba(56,189,248,0.4)]"
                              : "text-slate-300 hover:bg-slate-800/70 hover:text-sky-200"
                          }
                          `
                        }
                      >
                        <span
                          className="
                            flex h-9 w-9 items-center justify-center rounded-lg
                            bg-slate-900/80 ring-1 ring-slate-800
                          "
                        >
                          <Icon className="h-5 w-5 text-sky-200 drop-shadow" />
                        </span>

                        <span className="flex-1 truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="border-t border-slate-800 px-5 py-4">
        <p className="flex items-center justify-between text-[13px] font-['Inter'] text-slate-400">
          <span>Role:</span>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-[12px] text-slate-100">
            Admin
          </span>
        </p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
