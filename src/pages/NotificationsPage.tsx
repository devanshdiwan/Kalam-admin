import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Search, 
  Smartphone, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  RefreshCw,
  Zap,
  Check,
  Copy
} from 'lucide-react';
import { NotificationItem } from '../types/models';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { testPushSingleDevice } from '../services/notificationService';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onOpenComposeModal: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onOpenComposeModal
}) => {
  const [search, setSearch] = useState<string>('');
  const [activeDeviceCount, setActiveDeviceCount] = useState<number>(0);
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);

  // Single Device Test Push Modal State (Section 26)
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [testToken, setTestToken] = useState<string>('');
  const [testTitle, setTestTitle] = useState<string>('Kalam Library — Test Push Alert');
  const [testMessage, setTestMessage] = useState<string>('FCM push notification pipeline verified and working properly on your device.');
  const [testChannel, setTestChannel] = useState<string>('IMPORTANT');
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string>('');

  const fetchDeviceStats = async () => {
    setLoadingDevices(true);
    try {
      const resp = await fetch('/api/admin/devices');
      if (resp.ok) {
        const data = await resp.json();
        setActiveDeviceCount(data.activeCount || data.total || 0);
        setDevicesList(data.devices || []);
        if (data.devices && data.devices.length > 0 && !testToken) {
          setTestToken(data.devices[0].fcmToken || '');
        }
      }
    } catch {} finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchDeviceStats();
  }, []);

  const handleSendTestPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testToken.trim()) {
      setTestError('Please paste a target FCM device registration token.');
      return;
    }

    setTestLoading(true);
    setTestError('');
    setTestResult(null);

    try {
      const res = await testPushSingleDevice({
        fcmToken: testToken.trim(),
        title: testTitle.trim(),
        message: testMessage.trim(),
        channelId: testChannel
      });

      if (res.success) {
        setTestResult(res);
      } else {
        setTestError(res.error || 'Failed to dispatch test notification.');
      }
    } catch (err: any) {
      setTestError(err.message || 'Error communicating with push server.');
    } finally {
      setTestLoading(false);
    }
  };

  const filtered = notifications.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Bell className="text-amber-400" />
            <span>Push Notifications &amp; FCM Dispatcher</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deliver real-time Firebase Cloud Messaging (FCM) notifications to Kalam Library Android devices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTestModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap size={14} className="text-amber-400" />
            <span>Test Single Device</span>
          </button>

          <button
            onClick={onOpenComposeModal}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Send size={15} />
            <span>Compose Push Alert</span>
          </button>
        </div>
      </div>

      {/* FCM Status & Pipeline Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Registered Devices</span>
            <button 
              onClick={fetchDeviceStats} 
              className="text-slate-400 hover:text-amber-400 cursor-pointer"
              title="Refresh device counts"
            >
              <RefreshCw size={13} className={loadingDevices ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">{activeDeviceCount}</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online / Active Devices
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Tokens stored at <code className="text-amber-300">users/{'{uid}'}/devices</code></p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">FCM Project Target</span>
          <div className="font-mono font-bold text-amber-300 text-sm">kalam-liberary</div>
          <p className="text-[11px] text-slate-400">Project Sender ID: <strong className="text-slate-300">234194842691</strong></p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Channels (7)</span>
          <div className="flex flex-wrap gap-1 text-[10px] font-mono text-slate-300">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">GENERAL</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">IMPORTANT</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">LIBRARY</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">MEMBERSHIP</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">ATTENDANCE</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">FEE</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">SYSTEM</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search push notification history..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Notification History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No push dispatches found"
            description="Broadcast alerts sent to the Android app will be archived here with delivery counts."
            actionText="Compose First Alert"
            onAction={onOpenComposeModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Notification Title</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Target Audience</th>
                  <th className="py-3 px-4">On-Tap Screen</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4 text-right">Sent By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map(notif => (
                  <tr key={notif.notificationId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100 max-w-[200px] truncate">
                      {notif.title}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-[320px] truncate" title={notif.message}>
                      {notif.message}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 border border-slate-700">
                        {notif.targetType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {notif.targetScreen || 'Home'}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="success" size="sm">
                        {notif.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(notif.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {notif.sentBy || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Device Test Push Modal (Section 26 of FCM Prompt) */}
      <Modal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setTestResult(null);
          setTestError('');
        }}
        title="Direct Single Device Test Push"
        subtitle="Validate individual Android handset delivery and channel behavior"
        maxWidth="md"
      >
        <form onSubmit={handleSendTestPush} className="space-y-4 text-xs">
          {testError && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{testError}</span>
            </div>
          )}

          {testResult && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
                <CheckCircle2 size={16} />
                <span>Test Push Dispatched Successfully!</span>
              </div>
              <p className="text-[11px] text-emerald-300/90">
                Notification dispatched to device token on channel <strong>{testResult.channelId}</strong>. Check your Android device tray.
              </p>
              <div className="p-2 bg-slate-900/60 rounded border border-emerald-500/20 font-mono text-[10px] break-all">
                ID: {testResult.notificationId}
              </div>
            </div>
          )}

          {devicesList.length > 0 && (
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Registered Android Devices ({devicesList.length}):</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Active in Firestore</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {devicesList.map((dev, idx) => (
                  <button
                    key={dev.deviceId || idx}
                    type="button"
                    onClick={() => setTestToken(dev.fcmToken)}
                    className={`w-full p-2 rounded-lg text-left transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                      testToken === dev.fcmToken
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                        : 'bg-slate-900/60 border-slate-700/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[11px] truncate flex items-center gap-1.5">
                        <Smartphone size={12} className="text-amber-400 shrink-0" />
                        <span>Device: {dev.deviceId.slice(0, 16)}...</span>
                        {dev.userId && <span className="text-amber-300 font-mono text-[10px]">({dev.userId})</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{dev.fcmToken.slice(0, 32)}...</div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 shrink-0">Select</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Target FCM Device Token <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={2}
              value={testToken}
              onChange={(e) => setTestToken(e.target.value)}
              placeholder="e.g. ftW4qa9VTwGqGGYXLgrW7O:APA91bFggaYU31PG..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-[11px] outline-none focus:border-amber-400 break-all"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Notification Channel ID (Android)
            </label>
            <select
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
            >
              <option value="IMPORTANT">IMPORTANT — High Importance / Alert sound</option>
              <option value="GENERAL">GENERAL — Normal Importance</option>
              <option value="LIBRARY">LIBRARY — Book Returns & Circulation</option>
              <option value="MEMBERSHIP">MEMBERSHIP — Desk & Plan Reminders</option>
              <option value="ATTENDANCE">ATTENDANCE — Check-in & Gate Pass</option>
              <option value="FEE">FEE — Payment Receipts & Dues</option>
              <option value="SYSTEM">SYSTEM — Security Notices</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Test Alert Title
            </label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">
              Test Message Body
            </label>
            <textarea
              rows={2}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowTestModal(false)}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={testLoading}
              className="px-5 py-2 font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap size={14} />
              <span>{testLoading ? 'Dispatching...' : 'Send Test Push'}</span>
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
