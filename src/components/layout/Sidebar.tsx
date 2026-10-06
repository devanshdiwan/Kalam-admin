import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Library, 
  Armchair, 
  BookOpen, 
  ArrowLeftRight, 
  CalendarCheck, 
  QrCode, 
  GraduationCap, 
  ReceiptIndianRupee, 
  Bell, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { KalamLogo } from '../common/KalamLogo';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export type NavTab = 
  | 'dashboard'
  | 'students'
  | 'join-requests'
  | 'library-seats'
  | 'library-books'
  | 'library-issues'
  | 'library-attendance'
  | 'gate-passes'
  | 'coaching-classes'
  | 'coaching-batches'
  | 'coaching-attendance'
  | 'study-material'
  | 'homework-assignments'
  | 'tests-results'
  | 'fees-billing'
  | 'notices'
  | 'notifications'
  | 'reports'
  | 'admin-users'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingJoinRequestsCount?: number;
  overdueBooksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  pendingJoinRequestsCount = 0,
  overdueBooksCount = 0,
}) => {
  const { adminProfile, role, logout } = useAuth();

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navItemClass = (tab: NavTab) => {
    const isActive = currentTab === tab;
    return `group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
      isActive 
        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs' 
        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
    }`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-45 h-screen w-72 bg-slate-900 border-r border-slate-800 
        flex flex-col transition-transform duration-200 ease-in-out shrink-0
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
          <KalamLogo size={42} showText subtitle="Admin Panel • Gursarai" />
          <button 
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 custom-scrollbar text-xs">
          
          {/* Main Group */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overview
            </div>
            <button 
              onClick={() => handleNavClick('dashboard')}
              className={navItemClass('dashboard')}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={16} className={currentTab === 'dashboard' ? 'text-amber-400' : 'text-slate-400'} />
                <span>Dashboard</span>
              </div>
            </button>
          </div>

          {/* Student Admissions Group */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Students & Admissions
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => handleNavClick('students')}
                className={navItemClass('students')}
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className={currentTab === 'students' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>All Students</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('join-requests')}
                className={navItemClass('join-requests')}
              >
                <div className="flex items-center gap-3">
                  <UserPlus size={16} className={currentTab === 'join-requests' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Join Requests</span>
                </div>
                {pendingJoinRequestsCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950 animate-pulse">
                    {pendingJoinRequestsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Library Management Group */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Library Management</span>
              <Library size={12} className="text-amber-400" />
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => handleNavClick('library-seats')}
                className={navItemClass('library-seats')}
              >
                <div className="flex items-center gap-3">
                  <Armchair size={16} className={currentTab === 'library-seats' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Seats & Study Hall</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('library-books')}
                className={navItemClass('library-books')}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className={currentTab === 'library-books' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Book Catalogue</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('library-issues')}
                className={navItemClass('library-issues')}
              >
                <div className="flex items-center gap-3">
                  <ArrowLeftRight size={16} className={currentTab === 'library-issues' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Issues & Returns</span>
                </div>
                {overdueBooksCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {overdueBooksCount} Due
                  </span>
                )}
              </button>

              <button 
                onClick={() => handleNavClick('library-attendance')}
                className={navItemClass('library-attendance')}
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck size={16} className={currentTab === 'library-attendance' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Daily Attendance</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('gate-passes')}
                className={navItemClass('gate-passes')}
              >
                <div className="flex items-center gap-3">
                  <QrCode size={16} className={currentTab === 'gate-passes' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Gate Passes & Scan</span>
                </div>
              </button>
            </div>
          </div>

          {/* Coaching & Academics Group */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Coaching & Classes</span>
              <GraduationCap size={12} className="text-amber-400" />
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => handleNavClick('coaching-classes')}
                className={navItemClass('coaching-classes')}
              >
                <div className="flex items-center gap-3">
                  <ChevronRight size={14} className={currentTab === 'coaching-classes' ? 'text-amber-400' : 'text-slate-500'} />
                  <span>Classes & Batches</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('study-material')}
                className={navItemClass('study-material')}
              >
                <div className="flex items-center gap-3">
                  <ChevronRight size={14} className={currentTab === 'study-material' ? 'text-amber-400' : 'text-slate-500'} />
                  <span>Study Material</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('homework-assignments')}
                className={navItemClass('homework-assignments')}
              >
                <div className="flex items-center gap-3">
                  <ChevronRight size={14} className={currentTab === 'homework-assignments' ? 'text-amber-400' : 'text-slate-500'} />
                  <span>Homework & Tests</span>
                </div>
              </button>
            </div>
          </div>

          {/* Operations & Communications Group */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations & Notice
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => handleNavClick('fees-billing')}
                className={navItemClass('fees-billing')}
              >
                <div className="flex items-center gap-3">
                  <ReceiptIndianRupee size={16} className={currentTab === 'fees-billing' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Fees & Billing</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('notices')}
                className={navItemClass('notices')}
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className={currentTab === 'notices' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Notices & Bulletins</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('notifications')}
                className={navItemClass('notifications')}
              >
                <div className="flex items-center gap-3">
                  <Bell size={16} className={currentTab === 'notifications' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Push Notifications</span>
                </div>
              </button>
            </div>
          </div>

          {/* System & Settings Group */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              System Administration
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => handleNavClick('reports')}
                className={navItemClass('reports')}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={16} className={currentTab === 'reports' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Reports & Export</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('admin-users')}
                className={navItemClass('admin-users')}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className={currentTab === 'admin-users' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Staff & Roles</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('settings')}
                className={navItemClass('settings')}
              >
                <div className="flex items-center gap-3">
                  <Settings size={16} className={currentTab === 'settings' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Project & Sync</span>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Admin User Footer Card */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                {adminProfile?.name?.charAt(0) || 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {adminProfile?.name || 'Administrator'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="purple" size="sm" className="text-[9px] py-0">
                    {role || 'STAFF'}
                  </Badge>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
