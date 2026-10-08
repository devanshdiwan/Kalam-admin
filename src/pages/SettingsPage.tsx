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
  ExternalLink,
  Activity,
  AlertTriangle,
  FileCheck2,
  Trash2
} from 'lucide-react';
import { firebaseConfig, testConnection, runFirestoreDiagnostics, DiagnosticsReport } from '../services/firebase';
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

  // Developer Diagnostic Suite State (Section 3 of Specification)
  const [runningDiagnostics, setRunningDiagnostics] = useState<boolean>(false);
  const [diagReport, setDiagReport] = useState<DiagnosticsReport | null>(null);
  const [serverDiagReport, setServerDiagReport] = useState<any | null>(null);
  const [diagError, setDiagError] = useState<string>('');

  // FCM Cloud Messaging Settings State
  const [fcmKey, setFcmKey] = useState<string>('');
  const [serviceAccountInput, setServiceAccountInput] = useState<string>('');
  const [hasServiceAccount, setHasServiceAccount] = useState<boolean>(false);
  const [serviceAccountEmail, setServiceAccountEmail] = useState<string>('');
  const [savingFcm, setSavingFcm] = useState<boolean>(false);
  const [fcmMessage, setFcmMessage] = useState<string>('');
  const [testingFcm, setTestingFcm] = useState<boolean>(false);
  const [fcmTestResult, setFcmTestResult] = useState<string>('');

  React.useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.fcmServerKey) setFcmKey(d.fcmServerKey);
        if (d.hasServiceAccount) {
          setHasServiceAccount(true);
          setServiceAccountEmail(d.serviceAccountClientEmail || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveFcmKey = async () => {
    setSavingFcm(true);
    setFcmMessage('');
    try {
      const payload: any = { fcmServerKey: fcmKey.trim() };
      if (serviceAccountInput.trim()) {
        payload.serviceAccountJson = serviceAccountInput.trim();
      }
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setFcmMessage(data.message || 'FCM Gateway Settings saved successfully.');
        if (data.hasServiceAccount) {
          setHasServiceAccount(true);
          setServiceAccountEmail(data.serviceAccountClientEmail || '');
          setServiceAccountInput('');
        }
      } else {
        setFcmMessage(data.error || 'Failed to save FCM settings.');
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

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true);
    setDiagError('');
    setDiagReport(null);
    setServerDiagReport(null);
    try {
      const [clientRes, srvRes] = await Promise.allSettled([
        runFirestoreDiagnostics(),
        fetch('/api/admin/diagnostics').then(r => r.json())
      ]);
      if (clientRes.status === 'fulfilled') {
        setDiagReport(clientRes.value);
      }
      if (srvRes.status === 'fulfilled') {
        setServerDiagReport(srvRes.value);
      }
    } catch (err: any) {
      setDiagError(err.message || 'Diagnostic execution failed.');
    } finally {
      setRunningDiagnostics(false);
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

      {/* Developer Diagnostics Suite (Section 3: Firestore CRUD Test) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Developer Diagnostics: Firestore CRUD Pipeline</h3>
              <p className="text-xs text-slate-400">
                End-to-end verification of Project ID, Auth, and atomic Write &rarr; Read &rarr; Update &rarr; Delete on <code className="text-amber-300">_adminDiagnostics</code>
              </p>
            </div>
          </div>

          <button
            onClick={handleRunDiagnostics}
            disabled={runningDiagnostics}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={14} className={runningDiagnostics ? 'animate-spin' : ''} />
            <span>{runningDiagnostics ? 'Executing Test Suite...' : 'Run Developer Diagnostics'}</span>
          </button>
        </div>

        {diagError && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{diagError}</span>
          </div>
        )}

        {diagReport && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-850 rounded-lg border border-slate-750 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${diagReport.overallSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="font-bold text-slate-200">
                  Client Diagnostic Status: {diagReport.overallSuccess ? 'All Checks Passed (100%)' : 'Checks Encountered Diagnostics Note'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                Project: <strong className="text-amber-400">{diagReport.projectId}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              {diagReport.steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border ${
                    step.success 
                      ? 'bg-slate-850/80 border-slate-750 text-slate-200' 
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold flex items-center gap-1.5">
                      {step.success ? (
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                      )}
                      <span>{step.label}</span>
                    </span>
                    {step.durationMs > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">{step.durationMs}ms</span>
                    )}
                  </div>
                  {step.details && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.details}</p>
                  )}
                  {step.error && (
                    <p className="text-[11px] text-rose-300 font-mono mt-1 break-all">{step.error}</p>
                  )}
                </div>
              ))}
            </div>

            {serverDiagReport && (
              <div className="p-3 bg-slate-850/60 rounded-lg border border-slate-750 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <FileCheck2 size={14} className="text-sky-400" />
                    <span>Server-Side REST CRUD Pipeline</span>
                  </span>
                  <Badge variant={serverDiagReport.overallSuccess ? 'success' : 'warning'}>
                    {serverDiagReport.overallSuccess ? 'REST Verified' : 'Check Log'}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {serverDiagReport.steps?.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-slate-400">
                      <span>{s.label}</span>
                      <span className={s.success ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                        {s.success ? `${s.durationMs || 0}ms OK` : s.error || 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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

        <div className="space-y-4 pt-2 text-xs">
          {/* Status Indicator */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-750 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${hasServiceAccount ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-bold text-slate-200">FCM Gateway Status:</span>
              <span className={hasServiceAccount ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
                {hasServiceAccount ? 'FCM HTTP v1 Active (Service Account)' : 'Real-time Firestore Queue Mode Active'}
              </span>
            </div>
            {serviceAccountEmail && (
              <span className="text-[11px] text-slate-400 font-mono">
                {serviceAccountEmail}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-300">
                Firebase Service Account JSON (Recommended for Google FCM v1)
              </label>
              <a
                href="https://console.firebase.google.com/project/kalam-liberary/settings/serviceaccounts/adminsdk"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Generate Key in Firebase Console</span>
                <ExternalLink size={11} />
              </a>
            </div>
            <textarea
              rows={3}
              value={serviceAccountInput}
              onChange={(e) => setServiceAccountInput(e.target.value)}
              placeholder='Paste service account JSON: {"type": "service_account", "project_id": "kalam-liberary", "private_key": "-----BEGIN PRIVATE KEY...}'
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-[11px] outline-none focus:border-amber-400"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Firebase Console &rarr; Project Settings &rarr; Service accounts &rarr; Generate new private key &rarr; Paste JSON contents here.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-300">
                FCM Server Key (Legacy Fallback)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={fcmKey}
                onChange={(e) => setFcmKey(e.target.value)}
                placeholder="AAAA... or Legacy FCM Server Key"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleSaveFcmKey}
                disabled={savingFcm}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
              >
                {savingFcm ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dual-delivery pipeline: Every notification is automatically written into Firestore <code className="text-amber-300">/notifications</code> and user inboxes <code className="text-amber-300">/users/{'{uid}'}/notifications</code> for immediate live display.
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
