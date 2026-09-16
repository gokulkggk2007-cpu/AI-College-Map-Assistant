import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Navigation,
  MapPin,
  Building2,
  DoorOpen,
  Coffee,
  Heart,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const {
    startNavigation,
    setCurrentLocation,
    recordRecentSearch,
    setCurrentFloor,
    setSelectedBuildingId,
    recentSearches,
  } = useCampus();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/campus/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // handled by parent or opened
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (item: any) => {
    recordRecentSearch(query || item.title, item.id, item.title, item.nodeId);
    if (item.floor !== undefined) {
      setCurrentFloor(item.floor);
    }
    startNavigation(item.nodeId);
    onClose();
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'building':
        return <Building2 className="w-4 h-4 text-sky-400" />;
      case 'facility':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'department':
        return <Briefcase className="w-4 h-4 text-purple-400" />;
      default:
        return <DoorOpen className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="campus-search-modal"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden mt-12 sm:mt-16 text-slate-100 flex flex-col max-h-[80vh]"
      >
        {/* Search Input Box */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            id="campus-search-input"
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search e.g. 'ECE Lab', 'Principal Office', 'Seminar Hall', 'Canteen'..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Tag suggestions */}
        <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-slate-500 font-semibold uppercase shrink-0">Tags:</span>
          {['ECE', 'CSE', 'Principal', 'Exam Cell', 'Library', 'Canteen', 'Hostel', 'Medical', 'Restrooms'].map(tag => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 whitespace-nowrap transition"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results / Recents List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-800/50">
          {query.trim() === '' ? (
            <div>
              {recentSearches.length > 0 && (
                <div className="p-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                    Recent Searches
                  </h4>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map(rec => (
                      <div
                        key={rec.id}
                        onClick={() => {
                          startNavigation(rec.nodeId);
                          onClose();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-semibold text-slate-200">{rec.targetName}</span>
                        </div>
                        <span className="text-[10px] text-sky-400 flex items-center gap-1 font-medium">
                          Navigate <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 text-center text-slate-500 text-xs">
                Type any building name, block, lab, faculty room, or facility to find locations instantly.
              </div>
            </div>
          ) : results.length > 0 ? (
            results.map((res: any) => (
              <div
                key={res.id}
                onClick={() => handleSelect(res)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 cursor-pointer transition text-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-sky-500/50 transition">
                    {getCategoryIcon(res.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{res.title}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {res.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{res.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setCurrentLocation(res.nodeId, 'manual');
                      onClose();
                    }}
                    className="hidden sm:inline-flex px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium"
                  >
                    Set as Start
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1 shadow-sm">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Route</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              {isSearching ? (
                <span>Searching college database...</span>
              ) : (
                <span>No campus locations found matching "{query}". Try checking the spelling or use the AI Guide.</span>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 px-4">
          <span>Search covers 100% real campus rooms, labs & offices</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
