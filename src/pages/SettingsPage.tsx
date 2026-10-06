import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  CheckCircle2, 
  RefreshCw, 
  Armchair, 
  ShieldCheck, 
  Smartphone, 
  Key, 
  Lock, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { firebaseConfig, testConnection } from '../services/firebase';
import { initializeDefaultSeats } from '../services/seatService';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

interface SettingsPageProps {
  seatsCount: number;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  seatsCount,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [testingConn, setTestingConn] = useState<boolean>(false);
  const [connSuccess, setConnSuccess] = useState<boolean | null>(null);
  const [seedingSeats, setSeedingSeats] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<string>('');

  // FCM Cloud Messaging Settings State
  const [fcmKey, setFcmKey] = useState<string>('');
  const [savingFcm, setSavingFcm] = useState<boolean>(false);
  const [fcmMessage, setFcmMessage] = useState<string>('');
  const [testingFcm, setTestingFcm] = useState<boolean>(false);
  const [fcmTestResult, setFcmTestResult] = useState<string>('');

  React.useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.fcmServerKey) setFcmKey(d.fcmServerKey);
      })
      .catch(() => {});
  }, []);

  const handleSaveFcmKey = async () => {
    setSavingFcm(true);
    setFcmMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmServerKey: fcmKey.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setFcmMessage('FCM Server Key saved successfully. Push notifications will use this key for Google FCM API.');
      } else {
        setFcmMessage(data.error || 'Failed to save FCM Server Key.');
      }
    } catch (err: any) {
      setFcmMessage(err.message || 'Error saving FCM settings.');
    } finally {
      setSavingFcm(false);
    }
  };

  const handleSendFCMHealthCheck = async () => {
    setTestingFcm(true);
    setFcmTestResult('');
    try {
      const res = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Kalam Library — FCM Gateway Test',
          message: 'Real-time FCM push notification pipeline operational across all connected devices.',
          targetType: 'ALL',
          channelId: 'IMPORTANT',
          targetScreen: 'Home'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFcmTestResult(`Dispatched test push to ${data.dispatchedCount} active Android device(s). Notification ID: ${data.notificationId}`);
      } else {
        setFcmTestResult(data.error || 'FCM dispatch encountered an error.');
      }
    } catch (err: any) {
      setFcmTestResult(err.message || 'Error sending test push.');
    } finally {
      setTestingFcm(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConn(true);
    setConnSuccess(null);
    try {
      const ok = await testConnection();
      setConnSuccess(true);
    } catch {
      setConnSuccess(false);
    } finally {
      setTestingConn(false);
    }
  };

  const handleSeedSeats = async () => {
    setSeedingSeats(true);
    setSeedMessage('');
    try {
      const count = await initializeDefaultSeats();
      setSeedMessage(`Successfully initialized ${count} study hall desks (Ground Floor G-01..30 & 1st Floor F-01..30)`);
      onRefresh();
    } catch (err: any) {
      setSeedMessage(err.message || 'Failed to initialize default seats.');
    } finally {
      setSeedingSeats(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <Settings className="text-amber-400" />
          <span>System Settings & Firebase Architecture</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Firebase configuration, mobile app sync status, database health, and setup utilities.
        </p>
      </div>

      {/* Firebase Project Information */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Active Firebase Project</h3>
              <p className="text-xs text-slate-400">Primary cloud infrastructure backing both Web Admin and Student Android App</p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testingConn}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={testingConn ? 'animate-spin' : ''} />
            <span>Test Live Connection</span>
          </button>
        </div>

        {connSuccess !== null && (
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            connSuccess 
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            <CheckCircle2 size={16} />
            <span>{connSuccess ? 'Firestore connection verified. Server responses operating normally.' : 'Connection check encountered an error.'}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-2">
          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Project ID</span>
            <span className="font-mono font-bold text-amber-400">{firebaseConfig.projectId}</span>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Auth Domain</span>
            <span className="font-mono text-slate-200 truncate block">{firebaseConfig.authDomain}</span>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Storage Bucket</span>
            <span className="font-mono text-slate-200 truncate block">{firebaseConfig.storageBucket}</span>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Sender ID</span>
            <span className="font-mono text-slate-200">{firebaseConfig.messagingSenderId}</span>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Application ID</span>
            <span className="font-mono text-slate-200 truncate block">{firebaseConfig.appId}</span>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Database</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Firestore</span>
            </span>
          </div>
        </div>
      </div>

      {/* Desk Seed Utility */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <Armchair size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Study Hall Desks Initialization</h3>
              <p className="text-xs text-slate-400">Current layout has <strong>{seatsCount}</strong> desks configured in Firestore.</p>
            </div>
          </div>

          <button
            onClick={handleSeedSeats}
            disabled={seedingSeats || seatsCount > 0}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {seatsCount > 0 ? 'Desks Initialized' : 'Generate 60 Desks'}
          </button>
        </div>

        {seedMessage && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-lg">
            {seedMessage}
          </div>
        )}
      </div>

      {/* FCM Cloud Messaging & Push Notification Gateway Configuration */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Key size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Firebase Cloud Messaging (FCM) & Push Dispatcher</h3>
              <p className="text-xs text-slate-400">Configure FCM server gateway key for background and system tray notifications on student phones</p>
            </div>
          </div>

          <button
            onClick={handleSendFCMHealthCheck}
            disabled={testingFcm}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={testingFcm ? 'animate-spin' : ''} />
            <span>Send FCM Health Check</span>
          </button>
        </div>

        {fcmTestResult && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{fcmTestResult}</span>
          </div>
        )}

        {fcmMessage && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{fcmMessage}</span>
          </div>
        )}

        <div className="space-y-3 pt-2 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-300">
                FCM Server Key (Google Cloud Messaging)
              </label>
              <a
                href="https://console.firebase.google.com/project/kalam-liberary/settings/cloudmessaging"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Find in Firebase Console</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={fcmKey}
                onChange={(e) => setFcmKey(e.target.value)}
                placeholder="AAAA... or Service Account Key"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleSaveFcmKey}
                disabled={savingFcm}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
              >
                {savingFcm ? 'Saving...' : 'Save Key'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dual-delivery pipeline: Even before configuring a legacy key, the admin panel automatically synchronizes notifications directly into Firestore <code className="text-amber-300">/notifications</code> and user inboxes <code className="text-amber-300">/users/{'{uid}'}/notifications</code> for immediate Android app consumption.
            </p>
          </div>
        </div>
      </div>

      {/* User App Realtime Sync Verification Checklist (Section 59 & 69 of prompt) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Smartphone size={16} className="text-amber-400" />
          <span>Student Android App Realtime Sync Architecture</span>
        </h3>
        <p className="text-xs text-slate-400">
          All administrative operations write directly to shared collections in <span className="font-mono text-amber-300">kalam-liberary</span>, ensuring instantaneous two-way synchronization without requiring student logout or app restarts:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Profile & Information Sync</span>
              <p className="text-slate-400 text-[11px]">Updates to student name, phone, class, or profile image in <code className="text-amber-400">users/{'{uid}'}</code> render live on the mobile profile screen.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Live Desk Allocation</span>
              <p className="text-slate-400 text-[11px]">Desk assignments in <code className="text-amber-400">librarySeats/{'{seatId}'}</code> lock seats atomically and reflect immediately on the student's pass.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Attendance Log Sync</span>
              <p className="text-slate-400 text-[11px]">Attendance marked in <code className="text-amber-400">libraryAttendance</code> is read-only in the student application.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Gate Pass & QR Validation</span>
              <p className="text-slate-400 text-[11px]">Digital gate passes in <code className="text-amber-400">gatePasses</code> verify dynamically against database active state.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Book Loans & Overdue Tracking</span>
              <p className="text-slate-400 text-[11px]">Issues in <code className="text-amber-400">libraryIssues</code> decrement available stock and alert students of return due dates.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200">Instant Bulletins & Push Notices</span>
              <p className="text-slate-400 text-[11px]">Bulletins in <code className="text-amber-400">notices</code> and FCM dispatches appear instantly in the app notice board.</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
