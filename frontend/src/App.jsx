import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AudioProvider } from './context/AudioContext';
import { Home, Search as SearchIcon, Library as LibraryIcon, Sparkles, BarChart2 } from 'lucide-react';

// Pages
import Landing from './pages/Landing';
import Search from './pages/Search';
import AIGenerator from './pages/AIGenerator';
import Analytics from './pages/Analytics';
import Library from './pages/Library';
import Login from './pages/Login';

// Components
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';

// Protected Route Component Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#121212]">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Premium responsive bottom navigation bar on mobile viewports
const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Discover', path: '/', icon: Home },
    { name: 'Search', path: '/search', icon: SearchIcon },
    { name: 'Library', path: '/library', icon: LibraryIcon },
    { name: 'AI Generator', path: '/ai-generator', icon: Sparkles },
    { name: 'Insights', path: '/analytics', icon: BarChart2 },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-950/95 border-t border-white/5 py-3.5 px-4 flex items-center justify-around z-45 backdrop-blur-lg select-none">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.name}
            type="button"
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all active:scale-95
              ${isActive ? 'text-purple-600 scale-105' : 'text-slate-400 hover:text-slate-200'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-extrabold tracking-wider">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
};

// Global App Layout Wrapper
const AppLayout = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#121212] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Side Navigation Panel (Hidden on Mobile) */}
      <Sidebar />

      {/* Main viewport area with fully responsive padding */}
      <main className="flex-1 pl-4 md:pl-68 pr-4 md:pr-8 py-4 md:py-8 min-h-screen overflow-x-hidden pb-32 md:pb-24">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/ai-generator" element={<ProtectedRoute><AIGenerator /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        </Routes>
      </main>

      {/* Persistent Sticky bottom playback panel */}
      <MusicPlayer />

      {/* Mobile-only Premium bottom navigation controls */}
      <MobileNav />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AudioProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<AppLayout />} />
            </Routes>
          </AudioProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
