import React, { useState } from 'react';
import { FileText, Plus, Trash2, Search, Filter, Calendar, Users, Eye } from 'lucide-react';
import { NoticeItem, NoticeCategory } from '../types/models';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { deleteNotice } from '../services/noticeService';
import { useAuth } from '../context/AuthContext';

interface NoticesPageProps {
  notices: NoticeItem[];
  onOpenCreateNotice: () => void;
  onRefresh: () => void;
}

export const NoticesPage: React.FC<NoticesPageProps> = ({
  notices,
  onOpenCreateNotice,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (noticeId: string) => {
    try {
      await deleteNotice(noticeId, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'ADMIN'
      });
      setConfirmDeleteId(null);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotices = (notices || []).filter(n => {
    if (!n) return false;
    const q = (search || '').toLowerCase().trim();
    const title = (n.title || '').toLowerCase();
    const body = (n.body || '').toLowerCase();
    const matches = !q || title.includes(q) || body.includes(q);
    if (!matches) return false;
    if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <FileText className="text-amber-400" />
            <span>Notices & Announcements</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Broadcast institutional news, exam schedules, and holiday schedules to student devices.
          </p>
        </div>

        <button
          onClick={onOpenCreateNotice}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>Publish Notice</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices by keyword..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          >
            <option value="ALL">All Categories</option>
            <option value="IMPORTANT">IMPORTANT</option>
            <option value="GENERAL">GENERAL</option>
            <option value="LIBRARY">LIBRARY</option>
            <option value="FEE">FEE</option>
            <option value="HOLIDAY">HOLIDAY</option>
            <option value="EVENT">EVENT</option>
          </select>
        </div>
      </div>

      {/* Notices Grid */}
      {filteredNotices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notices published"
          description="Bulletins and announcements published here appear immediately in the student app."
          actionText="Create First Notice"
          onAction={onOpenCreateNotice}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotices.map(notice => (
            <div 
              key={notice.noticeId}
              className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-750 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={getStatusBadgeVariant(notice.category)} size="sm">
                    {notice.category}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Target: {notice.targetType}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-sm mb-2">
                  {notice.title}
                </h3>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {notice.body}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-mono">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>

                {confirmDeleteId === notice.noticeId ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-rose-400 font-semibold">Delete?</span>
                    <button
                      onClick={() => handleDelete(notice.noticeId)}
                      className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(notice.noticeId)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    title="Delete Notice"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
