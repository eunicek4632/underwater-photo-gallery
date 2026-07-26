import React from 'react';
import { Waves, Fish, ShieldCheck, Plus, Sparkles, LayoutGrid, BarChart2 } from 'lucide-react';
import { ActiveViewMode } from '../types';

interface HeaderProps {
  activeView: ActiveViewMode;
  setActiveView: (view: ActiveViewMode) => void;
  totalCreatures: number;
  favoritesCount: number;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  totalCreatures,
  favoritesCount,
  showFavoritesOnly,
  setShowFavoritesOnly,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-cyan-900/50 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('visitor')}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-blue-500 p-0.5 shadow-lg shadow-cyan-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-200 via-teal-300 to-blue-200 bg-clip-text text-transparent">
                Subsea Gallery
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 rounded-full uppercase">
                Marine Life
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Underwater creature photography & biological database
            </p>
          </div>
        </div>

        {/* Center / Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Visitor Mode Extras */}
          {activeView === 'visitor' && (
            <button
              id="header-favorites-btn"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showFavoritesOnly
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950/50'
                  : 'bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <span className="text-rose-400 font-bold">♥</span>
              <span>Saved</span>
              {favoritesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/30 text-rose-200">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* Mode Switcher Buttons */}
          <div className="p-1 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center gap-1 shadow-inner">
            <button
              id="mode-visitor-tab"
              onClick={() => {
                setActiveView('visitor');
                setShowFavoritesOnly(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeView === 'visitor'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Fish className="w-4 h-4" />
              <span>Visitor View</span>
            </button>

            <button
              id="mode-admin-tab"
              onClick={() => setActiveView('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeView === 'admin'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-950/50 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Portal</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
