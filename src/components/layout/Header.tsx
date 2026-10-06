import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  UserPlus, 
  QrCode, 
  CalendarCheck, 
  Bell, 
  Database, 
  CheckCircle2, 
  Clock, 
  Command,
  BookPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenCreateStudent: () => void;
  onOpenScanGatePass: () => void;
  onOpenAttendance: () => void;
  onOpenGlobalSearch: () => void;
  onOpenAddBook: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenCreateStudent,
  onOpenScanGatePass,
  onOpenAttendance,
  onOpenGlobalSearch,
  onOpenAddBook,
  searchQuery,
  onSearchChange,
}) => {
  const { adminProfile, role } = useAuth();
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search students, User ID (KL-...), books, seats..."
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-850 border border-slate-700/70 focus:border-amber-500/60 rounded-lg text-slate-100 placeholder:text-slate-400 outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded border border-slate-600/40">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center gap-2.5">
        
        {/* Firebase Live Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg text-[11px] text-slate-300">
          <Database size={13} className="text-amber-400" />
          <span className="font-mono text-[10px] text-slate-400">kalam-liberary</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-400 bg-slate-800/30 rounded-lg border border-slate-800">
          <Clock size={12} className="text-slate-400" />
          <span>{timeString}</span>
        </div>

        {/* Quick Action: Gate Pass Scan */}
        <button
          onClick={onOpenScanGatePass}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          title="Scan and verify student gate pass"
        >
          <QrCode size={15} className="text-amber-400" />
          <span className="hidden sm:inline">Gate Pass</span>
        </button>

        {/* Quick Action: Mark Attendance */}
        <button
          onClick={onOpenAttendance}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <CalendarCheck size={15} className="text-emerald-400" />
          <span>Attendance</span>
        </button>

        {/* Quick Action: Add Student */}
        <button
          onClick={onOpenCreateStudent}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <UserPlus size={15} />
          <span>New Student</span>
        </button>
      </div>
    </header>
  );
};
