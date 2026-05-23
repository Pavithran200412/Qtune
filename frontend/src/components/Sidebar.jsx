import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  Library, 
  Sparkles, 
  BarChart2, 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  Disc,
  Plus
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isCompact, setIsCompact] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsCompact(true);
      } else {
        setIsCompact(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Discover', path: '/', icon: Home },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'My Library', path: '/library', icon: Library },
    { name: 'AI Generator', path: '/ai-generator', icon: Sparkles },
    { name: 'Listening Insights', path: '/analytics', icon: BarChart2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`hidden md:flex w-64 h-screen fixed top-0 left-0 flex-col p-5 border-r transition-all duration-300 z-10 
      ${isDarkMode 
        ? 'bg-slate-950/80 border-slate-900 text-slate-100' 
        : 'bg-white/90 border-slate-200 text-slate-800'
      } backdrop-blur-xl`}>
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <Disc className="w-8 h-8 text-purple-500 animate-spin-slow" />
        <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Qtune
        </span>
      </div>

      {/* Nav Section */}
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 group
              ${isActive 
                ? 'bg-purple-600/15 text-purple-400 border border-purple-500/20' 
                : 'hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Create Playlist Actions Button */}
      <div className="mt-4 px-1">
        <button 
          onClick={() => navigate('/library?create=true')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.25)] transition-all hover:scale-105 active:scale-95 text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Footer / Auth Control */}
      <div className="pt-4 border-t border-slate-500/15 mt-auto space-y-4">
        {/* Profile Card Summary */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${user && isCompact ? 'max-h-20 opacity-100 py-1' : 'max-h-0 opacity-0 py-0 pointer-events-none'}`}>
          {user && (
            <div className="flex items-center gap-3 px-2">
              <img 
                src={user.profilePic || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`} 
                alt={user.username} 
                className="w-10 h-10 rounded-full border-2 border-purple-500/40 bg-slate-900"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.username}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Theme and Logout Controls */}
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border border-slate-500/10 transition-colors
              ${isDarkMode ? 'hover:bg-slate-900 text-yellow-400' : 'hover:bg-slate-100 text-purple-600'}
            `}
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className={`transition-all duration-500 ease-in-out overflow-hidden flex items-center ${isCompact ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
