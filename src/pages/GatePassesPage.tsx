import React, { useState } from 'react';
import { QrCode, Search, ShieldCheck, UserX, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import { GatePass, UserProfile } from '../types/models';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { revokeGatePass, createGatePass } from '../services/gatePassService';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

interface GatePassesPageProps {
  gatePasses: GatePass[];
  students: UserProfile[];
  onOpenValidatorModal: () => void;
  onRefresh: () => void;
}

export const GatePassesPage: React.FC<GatePassesPageProps> = ({
  gatePasses,
  students,
  onOpenValidatorModal,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Issue modal state
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [isIssuing, setIsIssuing] = useState<boolean>(false);

  const todayIso = new Date().toISOString().split('T')[0];

  const handleRevoke = async (passId: string) => {
    try {
      await revokeGatePass(passId, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'SUPER_ADMIN'
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleIssuePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentUid) return;
    const student = students.find(s => s.uid === selectedStudentUid);
    if (!student) return;

    setIsIssuing(true);
    try {
      await createGatePass(
        {
          uid: student.uid,
          userId: student.userId,
          name: student.name,
          assignedSeatNumber: student.assignedSeatNumber
        },
        new Date().toISOString().split('T')[0],
        validUntil,
        {
          uid: adminProfile?.uid || 'adm',
          name: adminProfile?.name || 'Administrator',
          role: role || 'SUPER_ADMIN'
        }
      );
      setShowIssueModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsIssuing(false);
    }
  };

  const filteredPasses = gatePasses.filter(gp => {
    const q = search.toLowerCase();
    const matches = 
      gp.studentName.toLowerCase().includes(q) ||
      gp.studentId.toLowerCase().includes(q) ||
      gp.passId.toLowerCase().includes(q);

    if (!matches) return false;
    if (statusFilter !== 'ALL' && gp.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <QrCode className="text-amber-400" />
            <span>Gate Pass Management & Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic token-based passes verifying active membership, assigned study desk, and valid dates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenValidatorModal}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck size={15} />
            <span>Verify / Scan Pass</span>
          </button>

          <button
            onClick={() => setShowIssueModal(true)}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Generate Pass</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, KL-ID, or Pass ID (GP-...)"
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          >
            <option value="ALL">All Passes</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="REVOKED">REVOKED</option>
          </select>
        </div>
      </div>

      {/* Passes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredPasses.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title="No gate passes found"
            description="Gate passes issued to students will be tracked here. Passes automatically display in the Kalam Library mobile app."
            actionText="Generate Gate Pass"
            onAction={() => setShowIssueModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assigned Desk</th>
                  <th className="py-3 px-4">Valid From</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Pass Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredPasses.map(pass => {
                  const isExpired = pass.validUntil && pass.validUntil < todayIso;
                  const isActive = pass.status === 'ACTIVE' && !isExpired;

                  return (
                    <tr key={pass.passId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {pass.passId}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200 block">{pass.studentName}</span>
                        <span className="font-mono text-slate-400 text-[10px] block">{pass.studentId}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-300">
                        {pass.seatNumber || 'Unassigned'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {pass.validFrom}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className={isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {pass.validUntil}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <Badge variant="danger" size="sm">EXPIRED</Badge>
                        ) : (
                          <Badge variant={pass.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                            {pass.status}
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(pass.passId)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md font-semibold transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Gate Pass Modal */}
      {showIssueModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowIssueModal(false)}
          title="Generate Digital Gate Pass"
          subtitle="Issues an authoritative access pass that verifies against database status"
          maxWidth="sm"
        >
          <form onSubmit={handleIssuePass} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Select Active Student Member *
              </label>
              <select
                value={selectedStudentUid}
                onChange={(e) => setSelectedStudentUid(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              >
                <option value="">-- Choose Member --</option>
                {students.filter(s => s.active).map(s => (
                  <option key={s.uid} value={s.uid}>
                    {s.name} ({s.userId}) — Seat: {s.assignedSeatNumber || 'None'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Valid Until Expiry Date *
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isIssuing}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                {isIssuing ? 'Generating...' : 'Issue Pass'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
