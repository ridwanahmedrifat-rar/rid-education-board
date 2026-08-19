import React from "react";
import { Sparkles, BookOpen, UserCheck, ShieldAlert } from "lucide-react";

interface HeaderProps {
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
}

export default function Header({
  isAdminMode,
  setIsAdminMode,
  isAdminLoggedIn,
  onLogoutAdmin,
}: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white shadow-xl rounded-b-3xl border-b-4 border-amber-400 mb-6 sticky top-0 z-40 backdrop-blur-md bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Title / Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsAdminMode(false)}>
          <div className="bg-amber-400 text-slate-950 p-2.5 rounded-2xl shadow-lg border-2 border-amber-300 bounce-slow group-hover:scale-105 transition-transform">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display flex items-center gap-2 text-white">
              ridparagraph <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-300">
              Paragraph, Letter & Story Writing Platform • Classes 1 - 8
            </p>
          </div>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-2.5 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80">
          <button
            onClick={() => setIsAdminMode(false)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center gap-2 ${
              !isAdminMode
                ? "bg-amber-400 text-slate-950 shadow-md scale-105"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            <span>🎒</span> Student Zone
          </button>

          <button
            onClick={() => setIsAdminMode(true)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center gap-2 ${
              isAdminMode
                ? "bg-indigo-600 text-white shadow-md scale-105"
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            }`}
          >
            <span>🍎</span> Teacher Dashboard
          </button>

          {isAdminMode && isAdminLoggedIn && (
            <button
              onClick={onLogoutAdmin}
              className="ml-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow"
              title="Logout as Admin"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
