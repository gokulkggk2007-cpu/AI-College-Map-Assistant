import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CampusProvider } from './context/CampusContext';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './screens/HomeScreen';
import { AdminDashboard } from './screens/AdminDashboard';
import { SearchModal } from './components/SearchModal';
import { QRScannerModal } from './components/QRScannerModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { ReportIssueModal } from './components/ReportIssueModal';
import { AuthModal } from './components/AuthModal';

const AppContent: React.FC = () => {
  const [isAdminView, setIsAdminView] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Global keyboard shortcut: Ctrl+K / Cmd+K opens Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenQRScanner={() => setIsQROpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAIChat={() => setIsAIChatOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        isAdminView={isAdminView}
        setIsAdminView={setIsAdminView}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {isAdminView ? (
          <AdminDashboard />
        ) : (
          <HomeScreen
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenAIChat={() => setIsAIChatOpen(true)}
            onOpenQRScanner={() => setIsQROpen(true)}
            onOpenReport={() => setIsReportOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} CampusNav AI • Indoor & Outdoor College Navigation System
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Graph Navigation Engine Online
            </span>
            <span>•</span>
            <button
              onClick={() => setIsReportOpen(true)}
              className="hover:text-slate-200 underline transition"
            >
              Feedback / Report Issue
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <QRScannerModal isOpen={isQROpen} onClose={() => setIsQROpen(false)} />
      <AIChatDrawer isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      <ReportIssueModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CampusProvider>
        <AppContent />
      </CampusProvider>
    </AuthProvider>
  );
}
