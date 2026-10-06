import React, { useState } from 'react';
import { Bell, Send, AlertCircle, Smartphone } from 'lucide-react';
import { Modal } from '../common/Modal';
import { NoticeTarget } from '../../types/models';
import { sendPushNotification } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

interface NotificationComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NotificationComposerModal: React.FC<NotificationComposerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { adminProfile, role } = useAuth();
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [targetType, setTargetType] = useState<NoticeTarget>('ALL');
  const [channelId, setChannelId] = useState<string>('GENERAL');
  const [targetScreen, setTargetScreen] = useState<string>('Notices');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Notification Title and Message are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPushNotification({
        title: title.trim(),
        message: message.trim(),
        targetType,
        channelId,
        targetScreen,
        imageUrl: imageUrl.trim()
      }, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'ADMIN'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Push Notification"
      subtitle="Dispatch real-time FCM notification to student Android devices"
      maxWidth="md"
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
            Notification Title <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Study Hall Schedule Update / Fee Reminder"
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Notification Body / Message <span className="text-amber-400">*</span>
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Keep message concise for mobile screen readability..."
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Target Audience
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as NoticeTarget)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            >
              <option value="ALL">All Active Users</option>
              <option value="ACTIVE_MEMBERS">Active Members Only</option>
              <option value="LIBRARY_MEMBERS">Library Desk Members</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Notification Channel (Android)
            </label>
            <select
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-amber-300 font-mono font-semibold focus:border-amber-400 outline-none"
            >
              <option value="GENERAL">GENERAL — Notices & Schedule</option>
              <option value="IMPORTANT">IMPORTANT — Urgent Alerts</option>
              <option value="LIBRARY">LIBRARY — Books & Returns</option>
              <option value="MEMBERSHIP">MEMBERSHIP — Desks & Renewals</option>
              <option value="ATTENDANCE">ATTENDANCE — Check-in & Gate Pass</option>
              <option value="FEE">FEE — Fee Dues & Receipts</option>
              <option value="SYSTEM">SYSTEM — Security & Account</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Open App Screen On Tap
            </label>
            <select
              value={targetScreen}
              onChange={(e) => setTargetScreen(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            >
              <option value="Home">Home / Notices Feed</option>
              <option value="Library">Library Catalog</option>
              <option value="Membership">My Membership & Seat</option>
              <option value="Attendance">Attendance Log</option>
              <option value="Fees">Fee Dues & Receipts</option>
              <option value="GatePass">My Gate Pass</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Image URL (Optional BigPicture)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://.../notice.jpg"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        {/* Live Device Preview */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-3">
          <Smartphone size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-slate-200 block">
              {title || 'Kalam Library Notification'}
            </span>
            <span className="text-slate-400 text-[11px] block mt-0.5">
              {message || 'Student alert will pop up in device notification tray...'}
            </span>
          </div>
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
            <Send size={15} />
            <span>{loading ? 'Transmitting...' : 'Dispatch FCM Notification'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
