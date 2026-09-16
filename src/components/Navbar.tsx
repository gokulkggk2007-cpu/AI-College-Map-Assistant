import React, { useState } from 'react';
import {
  Compass,
  Search,
  QrCode,
  Accessibility,
  User,
  ShieldCheck,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Sparkles,
  Layers,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCampus } from '../context/CampusContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenQRScanner: () => void;
  onOpenReport: () => void;
  onOpenAIChat: () => void;
  onOpenAuth: () => void;
  isAdminView: boolean;
  setIsAdminView: (v: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenQRScanner,
  onOpenReport,
  onOpenAIChat,
  onOpenAuth,
  isAdminView,
  setIsAdminView,
}) => {
  const { user, logout, switchDemoRole } = useAuth();
  const {
    nodes,
    currentLocationNodeId,
    locationMethod,
    accessibleMode,
    setAccessibleMode,
    currentFloor,
    setCurrentFloor,
  } = useCampus();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const currentNode = nodes.find(n => n.id === currentLocationNodeId);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand & Mode */}
        <div className="flex items-center gap-3">
          <div
            id="brand-logo"
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 cursor-pointer"
            onClick={() => setIsAdminView(false)}
          >
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-bold tracking-tight text-base sm:text-lg cursor-pointer hover:text-sky-400 transition"
                onClick={() => setIsAdminView(false)}
              >
                CampusNav AI
              </span>
              <span className="hidden sm:inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/80">
                Live College Map
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multi-floor Navigation & Grounded AI Assistant
            </p>
          </div>
        </div>

        {/* Current Location Badge & Floor Selector */}
        <div className="hidden lg:flex items-center gap-3">
          <div
            onClick={onOpenQRScanner}
            title="Click to change location or scan QR tag"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 cursor-pointer transition text-xs text-slate-300"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[170px] truncate">
              {currentNode ? currentNode.name : 'Main Campus Gate'}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-slate-900 text-[10px] uppercase font-bold text-emerald-400">
              {locationMethod}
            </span>
          </div>

          {/* Floor quick switch */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-xs">
            <span className="px-2 text-slate-400 flex items-center gap-1 font-medium">
              <Layers className="w-3.5 h-3.5 text-sky-400" /> Floor:
            </span>
            <button
              id="nav-floor-0-btn"
              onClick={() => setCurrentFloor(0)}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                currentFloor === 0
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Ground (0)
            </button>
            <button
              id="nav-floor-1-btn"
              onClick={() => setCurrentFloor(1)}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                currentFloor === 1
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1st Floor
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Accessible Mode Toggle */}
          <button
            id="toggle-accessible-mode-btn"
            onClick={() => setAccessibleMode(!accessibleMode)}
            title={
              accessibleMode
                ? 'Accessible Route Active (No stairs, prefers lifts & ramps)'
                : 'Enable Accessible Route (Avoid stairs)'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              accessibleMode
                ? 'bg-teal-500/20 text-teal-300 border-teal-500 shadow-sm shadow-teal-500/10'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700/60'
            }`}
          >
            <Accessibility className={`w-4 h-4 ${accessibleMode ? 'text-teal-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Accessible</span>
          </button>

          {/* Search Trigger */}
          <button
            id="open-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Search Campus...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* QR Scanner */}
          <button
            id="open-qr-btn"
            onClick={onOpenQRScanner}
            title="Scan Campus Location QR Code"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
          </button>

          {/* AI Assistant button */}
          <button
            id="open-ai-chat-btn"
            onClick={onOpenAIChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Guide</span>
          </button>

          {/* Role / Admin Portal View Switcher */}
          {user?.role === 'admin' && (
            <button
              id="toggle-admin-view-btn"
              onClick={() => setIsAdminView(!isAdminView)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isAdminView
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAdminView ? 'Exit Portal' : 'Admin Portal'}</span>
            </button>
          )}

          {/* Profile & Roles Dropdown */}
          <div className="relative">
            <button
              id="user-profile-menu-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs transition"
            >
              <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-sky-400">
                {user?.name ? user.name[0].toUpperCase() : <User className="w-3 h-3" />}
              </div>
              <span className="hidden sm:inline font-medium max-w-[100px] truncate">
                {user?.name || 'Account'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 text-xs">
                {user ? (
                  <div className="px-3 py-2 border-b border-slate-700">
                    <p className="font-semibold text-slate-100">{user.name}</p>
                    <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 text-[10px] uppercase font-bold">
                        {user.role}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">{user.department}</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 border-b border-slate-700">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenAuth();
                      }}
                      className="w-full py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-center"
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}

                {/* Quick Role Switch for testing */}
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Quick Role Test
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      id="switch-student-btn"
                      onClick={() => {
                        switchDemoRole('student');
                        setShowProfileMenu(false);
                      }}
                      className={`px-2 py-1 rounded text-center font-medium transition ${
                        user?.role === 'student' ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      id="switch-staff-btn"
                      onClick={() => {
                        switchDemoRole('staff');
                        setShowProfileMenu(false);
                      }}
                      className={`px-2 py-1 rounded text-center font-medium transition ${
                        user?.role === 'staff' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Staff
                    </button>
                    <button
                      id="switch-admin-btn"
                      onClick={() => {
                        switchDemoRole('admin');
                        setShowProfileMenu(false);
                      }}
                      className={`px-2 py-1 rounded text-center font-medium transition ${
                        user?.role === 'admin' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                {/* Report inaccurate information */}
                <button
                  id="report-issue-btn"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenReport();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-slate-300 hover:bg-slate-700/60 hover:text-white text-left transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Report Incorrect Information</span>
                </button>

                {user && (
                  <button
                    id="logout-btn"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-red-400 hover:bg-red-950/30 hover:text-red-300 text-left transition border-t border-slate-700/50 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
