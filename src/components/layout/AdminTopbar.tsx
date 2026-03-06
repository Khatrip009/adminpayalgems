// src/components/layout/AdminTopbar.tsx
import React, { useEffect, useState, useRef } from "react";
import { Search, ChevronDown, LogOut, User2, Menu, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../ui/ThemeToggle";
import NotificationBell from "../admin/NotificationBell";

import { getMyProfile, type Profile } from "../../api/core/profile.api";
import { useNavigate } from "react-router-dom";

interface AdminTopbarProps {
  onToggleSidebar?: () => void;
}

const AdminTopbar: React.FC<AdminTopbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [muted, setMuted] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await getMyProfile();
        if (mounted) setProfile(p);
      } catch {
        if (mounted) setProfile(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  const avatarUrl = profile?.avatar_url ?? null;
  const displayName = profile?.public_name || user?.full_name || user?.email || "Admin";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center justify-between px-4 py-2.5 md:px-6">
        {/* Left */}
        <div className="flex items-center gap-2 md:gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <button
            className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.20em] text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            onClick={() => navigate("/")}
            aria-label="Go to dashboard"
          >
            <img src="/minal_gems_logo.svg" alt="Minal Gems" className="h-14 w-auto" />
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-[11px] tracking-[0.26em] text-slate-500 dark:text-slate-400">Admin</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">Minal Gems Dashboard</span>
            </div>
          </button>
        </div>

        {/* Center */}
        <div className="hidden flex-1 px-4 md:block md:max-w-xl">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                placeholder="Search orders, customers, products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-700/40"
                aria-label="Search"
              />
            </div>
          </form>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />

          {/* Notification bell (no floating sound control inside) */}
          <NotificationBell muted={muted} />

          {/* Sound toggle placed in topbar so it stays inline and positioned properly */}
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label={muted ? "Unmute notifications" : "Mute notifications"}
            title={muted ? "Muted" : "Sound On"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm transition hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-500"
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-slate-50 dark:bg-slate-50 dark:text-slate-900">
                  {initials || "A"}
                </div>
              )}
              <div className="hidden text-left text-[11px] leading-tight sm:block">
                <div className="font-semibold text-slate-800 dark:text-slate-100">{displayName}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{user?.email}</div>
              </div>
              <ChevronDown className="hidden h-3 w-3 text-slate-500 sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white/95 p-1 text-xs shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95">
                <div className="px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">{displayName}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{user?.email}</div>
                </div>

                <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px] text-slate-700 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <User2 className="h-3.5 w-3.5" />
                  <span>Profile & Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="px-4 pb-2 md:hidden">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              placeholder="Search orders, customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-700/40"
              aria-label="Mobile search"
            />
          </div>
        </form>
      </div>
    </header>
  );
};

export default AdminTopbar;
