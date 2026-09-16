import React from 'react';
import {
  Search,
  Sparkles,
  MapPin,
  Heart,
  History,
  PhoneCall,
  AlertCircle,
  Clock,
  Compass,
  Building2,
  Coffee,
  Shield,
  Layers,
  ChevronRight,
  ArrowRight,
  QrCode,
  Flame,
  Volume2,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { CampusMap } from '../components/CampusMap';
import { NavigationPanel } from '../components/NavigationPanel';

interface HomeScreenProps {
  onOpenSearch: () => void;
  onOpenAIChat: () => void;
  onOpenQRScanner: () => void;
  onOpenReport: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenSearch,
  onOpenAIChat,
  onOpenQRScanner,
  onOpenReport,
}) => {
  const {
    announcements,
    favorites,
    recentSearches,
    startNavigation,
    setCurrentLocation,
    currentLocationNodeId,
    locationMethod,
    nodes,
    buildings,
  } = useCampus();

  const currentNode = nodes.find(n => n.id === currentLocationNodeId);

  // Emergency / Important campus spots
  const EMERGENCY_LOCATIONS = [
    {
      id: 'em-health',
      name: 'Health Center & Clinic',
      subtitle: '24/7 Trauma Care & Ambulance',
      nodeId: 'node-health-room',
      icon: <PhoneCall className="w-4 h-4 text-rose-400" />,
      color: 'border-rose-500/30 bg-rose-950/20 text-rose-300',
    },
    {
      id: 'em-security',
      name: 'Main Campus Security Gate',
      subtitle: 'Campus Entry & Help Desk',
      nodeId: 'node-main-gate',
      icon: <Shield className="w-4 h-4 text-sky-400" />,
      color: 'border-sky-500/30 bg-sky-950/20 text-sky-300',
    },
    {
      id: 'em-principal',
      name: 'Principal Office',
      subtitle: 'Administrative Block - ADM-G01',
      nodeId: 'node-admin-principal',
      icon: <Building2 className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-950/20 text-purple-300',
    },
    {
      id: 'em-canteen',
      name: 'Campus Food Court & Canteen',
      subtitle: 'Meals, Bakery & Refreshments',
      nodeId: 'node-canteen-hall',
      icon: <Coffee className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. Announcements Banner */}
      {announcements.length > 0 && (
        <div
          id="announcements-ticker"
          className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/30 shadow-lg flex items-center justify-between gap-3 text-xs text-slate-200"
        >
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-sky-500 text-white font-bold shrink-0">
              <AlertCircle className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-sky-300 mr-2 uppercase tracking-wider text-[11px]">
                {announcements[0].priority === 'urgent' ? 'Important Notice:' : 'Campus Update:'}
              </span>
              <span className="font-semibold text-slate-100">{announcements[0].title}</span>
              <span className="hidden md:inline text-slate-400 ml-2">
                — {announcements[0].content}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0 hidden sm:block">
            {announcements[0].date}
          </span>
        </div>
      )}

      {/* 2. Top Search & AI Assistant Prompt Action Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search location bar */}
        <div
          onClick={onOpenSearch}
          className="md:col-span-8 flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 cursor-pointer shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Where are you heading today?
              </p>
              <p className="text-xs text-slate-400">
                Search ECE Lab, Principal Office, Seminar Hall, Canteen, Room 204...
              </p>
            </div>
          </div>
          <kbd className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-400 border border-slate-700">
            ⌘K Search
          </kbd>
        </div>

        {/* AI Multilingual Quick Trigger */}
        <div
          onClick={onOpenAIChat}
          className="md:col-span-4 flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-sky-900/30 to-slate-900 border border-indigo-500/40 hover:border-sky-400 cursor-pointer shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
            </div>
            <div>
              <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                Ask AI Assistant
              </p>
              <p className="text-xs text-slate-300 font-medium">
                English • தமிழ் • Tanglish
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* 3. Turn-by-Turn Navigation HUD (appears when route is active) */}
      <NavigationPanel />

      {/* 4. Interactive Campus Map & Location Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Interactive College Blueprint
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenQRScanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 font-medium transition"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scan QR / GPS</span>
            </button>
          </div>
        </div>

        <CampusMap />
      </div>

      {/* 5. Favorites & Recent Locations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Favorites */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <h3 className="font-bold text-sm text-slate-100">Saved Favorites</h3>
            </div>
            <span className="text-xs text-slate-400">
              {favorites.length} saved
            </span>
          </div>

          {favorites.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No favorites saved yet. Tap on any room on the map and click "Add to Favorites".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {favorites.map(fav => (
                <div
                  key={fav.id}
                  onClick={() => startNavigation(fav.nodeId)}
                  className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/40 cursor-pointer transition flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-semibold text-xs text-slate-100 group-hover:text-sky-300 transition">
                      {fav.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{fav.subtitle}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 group-hover:translate-x-1 transition" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Locations */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-sm text-slate-100">Recent Searches & Routes</h3>
            </div>
            <span className="text-xs text-slate-400">
              {recentSearches.length} recent
            </span>
          </div>

          {recentSearches.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No recent searches yet. Search any department or room to quickly re-navigate.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {recentSearches.slice(0, 5).map(rec => (
                <div
                  key={rec.id}
                  onClick={() => startNavigation(rec.nodeId)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/70 cursor-pointer transition text-xs border border-transparent hover:border-slate-700"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="font-semibold text-slate-200">{rec.targetName}</span>
                      <span className="text-[10px] text-slate-500 ml-2">"{rec.query}"</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
                    Navigate <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Emergency & Quick Facilities */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Important Campus Facilities & Emergency Spots
            </h3>
          </div>
          <span className="text-xs text-slate-400">Instant One-Click Routes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {EMERGENCY_LOCATIONS.map(em => (
            <div
              key={em.id}
              onClick={() => startNavigation(em.nodeId)}
              className={`p-3.5 rounded-xl border ${em.color} hover:brightness-110 cursor-pointer transition flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-lg bg-slate-900/80">{em.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Fast Route</span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-100">{em.name}</h4>
                <p className="text-[11px] opacity-80 mt-0.5">{em.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
