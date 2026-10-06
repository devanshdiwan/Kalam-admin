import React, { useState } from 'react';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Armchair, 
  Calendar, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { verifyGatePassTokenOrId, GatePassVerificationResult } from '../../services/gatePassService';

interface GatePassValidatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GatePassValidatorModal: React.FC<GatePassValidatorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<GatePassVerificationResult | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsVerifying(true);
    setResult(null);
    try {
      const res = await verifyGatePassTokenOrId(tokenInput.trim());
      setResult(res);
    } catch (err: any) {
      setResult({
        valid: false,
        code: 'INVALID_TOKEN',
        message: 'Could not connect to database for pass verification.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setTokenInput('');
    setResult(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Gate Pass & Access"
      subtitle="Live verification against real-time database state (No trust in static QR tokens)"
      maxWidth="lg"
    >
      <div className="space-y-5">
        
        {/* Input verification form */}
        <form onSubmit={handleVerify} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">
            Enter Gate Pass ID, Security Token, or Student User ID (KL-...)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. GP-102948, KL-1024, or raw token"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono tracking-wider focus:border-amber-400 outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || !tokenInput.trim()}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isVerifying ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              <span>Verify</span>
            </button>
          </div>
        </form>

        {/* Verification Result Card */}
        {result && (
          <div className={`p-5 rounded-xl border text-xs animate-in zoom-in-95 duration-150 ${
            result.valid 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {result.valid ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle size={24} />
                </div>
              )}
              <div>
                <div className="font-extrabold text-sm uppercase tracking-wide">
                  {result.valid ? 'GATE PASS VALID — ENTRY ALLOWED' : `ENTRY DENIED: ${result.code}`}
                </div>
                <div className="text-slate-300 text-xs mt-0.5">
                  {result.message}
                </div>
              </div>
            </div>

            {/* Student & Pass Meta */}
            {result.student && (
              <div className="mt-4 p-3 bg-slate-900/80 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Student Name</span>
                  <span className="font-bold text-slate-100">{result.student.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">User ID</span>
                  <span className="font-mono font-bold text-amber-400">{result.student.userId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Seat</span>
                  <span className="font-mono text-slate-100">{result.student.assignedSeatNumber || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Membership Status</span>
                  <span className="font-bold text-slate-100">{result.student.membershipStatus || 'ACTIVE'}</span>
                </div>
                {result.pass?.validUntil && (
                  <div className="col-span-2 pt-1 border-t border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Pass Validity Period</span>
                    <span className="font-mono text-slate-300">
                      {result.pass.validFrom} to {result.pass.validUntil}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Clear Search
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </Modal>
  );
};
