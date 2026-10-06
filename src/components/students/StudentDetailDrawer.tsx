import React, { useState } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Armchair, 
  Clock, 
  ReceiptIndianRupee, 
  BookOpen, 
  QrCode, 
  KeyRound, 
  UserX, 
  UserCheck, 
  Edit, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, LibrarySeat } from '../../types/models';
import { Badge } from '../common/Badge';
import { toggleStudentActive } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';

interface StudentDetailDrawerProps {
  student: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onOpenEditStudent?: (student: UserProfile) => void;
  onOpenAssignSeat?: (student: UserProfile) => void;
  onOpenCreateGatePass?: (student: UserProfile) => void;
  onOpenRecordFee?: (student: UserProfile) => void;
}

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  student,
  isOpen,
  onClose,
  onRefresh,
  onOpenEditStudent,
  onOpenAssignSeat,
  onOpenCreateGatePass,
  onOpenRecordFee
}) => {
  const { adminProfile, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'guardian' | 'library' | 'academic'>('overview');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');

  if (!isOpen || !student) return null;

  const handleToggleActive = async () => {
    setIsUpdating(true);
    setActionMessage('');
    try {
      await toggleStudentActive(student.uid, !student.active, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'SUPER_ADMIN'
      });
      setActionMessage(`Student status successfully changed to ${!student.active ? 'ACTIVE' : 'DEACTIVATED'}`);
      onRefresh();
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendResetPassword = async () => {
    setIsUpdating(true);
    setActionMessage('');
    try {
      const resp = await fetch('/api/admin/reset-student-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.email })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      setActionMessage(`Password reset link dispatched to ${student.email}`);
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to send password reset');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-xs transition-opacity duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Student Photo & Core Info */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-lg">
              {student.profileImageUrl ? (
                <img src={student.profileImageUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-xl font-bold text-amber-400">
                  {student.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-100 truncate">
                    {student.name}
                  </h3>
                  <Badge variant={student.active ? 'success' : 'danger'} size="sm">
                    {student.active ? 'ACTIVE' : 'DEACTIVATED'}
                  </Badge>
                </div>

                {onOpenEditStudent && (
                  <button
                    onClick={() => onOpenEditStudent(student)}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs shrink-0 shadow-xs active:scale-95"
                  >
                    <Edit size={14} />
                    <span>Edit Student</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {student.userId}
                </span>
                <span>•</span>
                <span>Enrolled {new Date(student.createdAt).toLocaleDateString()}</span>
              </div>

              {student.assignedSeatNumber && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  <Armchair size={13} />
                  <span>Study Hall Seat: <strong>{student.assignedSeatNumber}</strong></span>
                </div>
              )}
            </div>
          </div>

          {actionMessage && (
            <div className="mt-4 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <Sparkles size={14} />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        {/* Tab Headers */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-850 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'border-amber-400 text-amber-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'library' ? 'border-amber-400 text-amber-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            Membership & Seat
          </button>
          <button
            onClick={() => setActiveTab('guardian')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'guardian' ? 'border-amber-400 text-amber-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            Parents / Guardian
          </button>
          <button
            onClick={() => setActiveTab('academic')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'academic' ? 'border-amber-400 text-amber-400' : 'border-transparent hover:text-slate-200'
            }`}
          >
            Academic
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs custom-scrollbar">
          
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* App Login Credentials Card */}
              <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <KeyRound size={15} />
                    <span>Student Mobile App Login Credentials</span>
                  </div>
                  {onOpenEditStudent && (
                    <button
                      onClick={() => onOpenEditStudent(student)}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Edit size={12} />
                      <span>Edit Password & Details</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">App Login User ID</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">{student.userId}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">App Password</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm tracking-wider">{student.password || '123456'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Student logs in using this User ID & Password.</span>
                  <span className={`font-semibold ${student.active ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {student.active ? '● Login Allowed' : '● Account Deactivated'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Phone Number</span>
                  <span className="font-semibold text-slate-200">{student.phone || '—'}</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-semibold text-slate-200 truncate block">{student.email}</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Date of Birth</span>
                  <span className="font-semibold text-slate-200">{student.dateOfBirth || '—'}</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                  <span className="text-slate-400 block mb-0.5">Gender</span>
                  <span className="font-semibold text-slate-200">{student.gender || 'Male'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Residential Address</span>
                <span className="font-semibold text-slate-200">{student.address || 'Gursarai, Jhansi (U.P.)'}</span>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Identity Verification (Aadhaar)</span>
                <span className="font-mono font-bold text-amber-300">
                  {student.aadhaarMasked || 'XXXX XXXX 1024'}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Masked in accordance with Aadhaar protection norms.</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                <button
                  onClick={handleSendResetPassword}
                  disabled={isUpdating}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound size={14} className="text-amber-400" />
                  <span>Send Password Reset</span>
                </button>

                <button
                  onClick={handleToggleActive}
                  disabled={isUpdating}
                  className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    student.active 
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {student.active ? <UserX size={14} /> : <UserCheck size={14} />}
                  <span>{student.active ? 'Deactivate Student' : 'Activate Student'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Membership Status</span>
                  <Badge variant={student.membershipStatus === 'ACTIVE' ? 'success' : 'warning'}>
                    {student.membershipStatus || 'ACTIVE'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Shift / Plan</span>
                  <span className="font-semibold text-slate-200">{student.membershipType || 'Full-Day (12 Hours)'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Start Date</span>
                  <span className="font-mono text-slate-200">{student.membershipStartDate || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Expiry Date</span>
                  <span className="font-mono text-slate-200">{student.membershipEndDate || '—'}</span>
                </div>
              </div>

              {/* Study Hall Seat Management */}
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/70">
                <h4 className="font-bold text-slate-200 mb-2 flex items-center justify-between">
                  <span>Assigned Seat</span>
                  {student.assignedSeatNumber ? (
                    <span className="text-amber-400 font-mono font-bold">{student.assignedSeatNumber}</span>
                  ) : (
                    <span className="text-slate-500 text-xs">Unassigned</span>
                  )}
                </h4>
                <p className="text-slate-400 text-xs mb-3">
                  {student.assignedSeatNumber 
                    ? `Currently occupying study hall seat ${student.assignedSeatNumber}. Automatically synced with student app.`
                    : 'Assign a designated study seat to reserve desk space for this member.'}
                </p>
                {onOpenAssignSeat && (
                  <button
                    onClick={() => onOpenAssignSeat(student)}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Armchair size={15} />
                    <span>{student.assignedSeatNumber ? 'Change / Reassign Seat' : 'Assign Seat Now'}</span>
                  </button>
                )}
              </div>

              {/* Quick Gate Pass */}
              {onOpenCreateGatePass && (
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/70 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-200">Gate Pass Card</h5>
                    <p className="text-slate-400 text-xs">Generate digital QR gate pass for biometric / gate check.</p>
                  </div>
                  <button
                    onClick={() => onOpenCreateGatePass(student)}
                    className="px-3 py-1.5 bg-slate-750 hover:bg-slate-700 border border-slate-600 rounded-lg text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode size={14} />
                    <span>Issue Pass</span>
                  </button>
                </div>
              )}

              {/* Quick Fee Invoice */}
              {onOpenRecordFee && (
                <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/70 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-200">Fee Invoicing</h5>
                    <p className="text-slate-400 text-xs">Record monthly tuition / library desk fee invoice.</p>
                  </div>
                  <button
                    onClick={() => onOpenRecordFee(student)}
                    className="px-3 py-1.5 bg-slate-750 hover:bg-slate-700 border border-slate-600 rounded-lg text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ReceiptIndianRupee size={14} />
                    <span>Record Fee</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guardian' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Father's Name</span>
                <span className="font-semibold text-slate-200">{student.fatherName || '—'}</span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Mother's Name</span>
                <span className="font-semibold text-slate-200">{student.motherName || '—'}</span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Guardian Name</span>
                <span className="font-semibold text-slate-200">{student.guardianName || '—'}</span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Guardian Contact Phone</span>
                <span className="font-semibold text-slate-200">{student.guardianPhone || '—'}</span>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Target Exam / Stream</span>
                <span className="font-semibold text-slate-200">{student.className || 'General Competitive Exams'}</span>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60">
                <span className="text-slate-400 block mb-0.5">Batch</span>
                <span className="font-semibold text-slate-200">{student.batchId || 'Self-Study Shift'}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
