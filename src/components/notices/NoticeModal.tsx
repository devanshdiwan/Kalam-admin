import React, { useState } from 'react';
import { FileText, AlertCircle, Bell } from 'lucide-react';
import { Modal } from '../common/Modal';
import { NoticeCategory, NoticeTarget } from '../../types/models';
import { createNotice } from '../../services/noticeService';
import { useAuth } from '../../context/AuthContext';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { adminProfile, role } = useAuth();
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [category, setCategory] = useState<NoticeCategory>('IMPORTANT');
  const [targetType, setTargetType] = useState<NoticeTarget>('ALL');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [sendPush, setSendPush] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const categories: NoticeCategory[] = [
    'GENERAL',
    'IMPORTANT',
    'LIBRARY',
    'MEMBERSHIP',
    'ATTENDANCE',
    'FEE',
    'HOLIDAY',
    'EVENT',
    'SYSTEM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and Body are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createNotice({
        title: title.trim(),
        body: body.trim(),
        category,
        targetType,
        imageUrl: imageUrl.trim(),
        expiresAt: expiresAt || undefined,
        sendPush
      }, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'ADMIN'
      });

      // Reset form
      setTitle('');
      setBody('');
      setImageUrl('');
      setExpiresAt('');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish notice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Institutional Notice"
      subtitle="Broadcast announcements instantly to student mobile applications"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Notice Headline <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Special Holiday Notice / Extended Study Hall Hours"
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NoticeCategory)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Target Audience
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as NoticeTarget)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            >
              <option value="ALL">All Enrolled Students</option>
              <option value="ACTIVE_MEMBERS">Active Members Only</option>
              <option value="LIBRARY_MEMBERS">Library Desk Members</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Notice Description / Message <span className="text-amber-400">*</span>
          </label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Detailed notice text..."
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Banner Image URL (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Bell size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">Instant Push Notification Alert</span>
              <p className="text-[11px] text-slate-400">Broadcast FCM push alert to all connected student Android devices upon publishing</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={sendPush}
              onChange={(e) => setSendPush(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <FileText size={15} />
            <span>{loading ? 'Publishing...' : 'Publish Notice'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
