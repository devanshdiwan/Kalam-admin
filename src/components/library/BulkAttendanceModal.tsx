import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Search, Users, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { UserProfile } from '../../types/models';
import { bulkMarkAttendance } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';

interface BulkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: UserProfile[];
  onSuccess: () => void;
}

export const BulkAttendanceModal: React.FC<BulkAttendanceModalProps> = ({
  isOpen,
  onClose,
  students,
  onSuccess
}) => {
  const { adminProfile, role } = useAuth();
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState<string>('Full-Day Study (8 AM - 8 PM)');
  const [search, setSearch] = useState<string>('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const activeStudents = students.filter(s => s.active);

  useEffect(() => {
    if (isOpen) {
      // Default all to PRESENT for quick recording
      const initial: Record<string, 'PRESENT' | 'ABSENT'> = {};
      activeStudents.forEach(s => {
        initial[s.uid] = 'PRESENT';
      });
      setAttendanceMap(initial);
    }
  }, [isOpen, students]);

  const handleToggle = (uid: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [uid]: prev[uid] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const updated: Record<string, 'PRESENT' | 'ABSENT'> = {};
    activeStudents.forEach(s => {
      updated[s.uid] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const records = activeStudents.map(s => ({
        student: { uid: s.uid, userId: s.userId, name: s.name },
        status: attendanceMap[s.uid] || 'PRESENT'
      }));

      await bulkMarkAttendance(records, date, shift, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'LIBRARIAN'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = (activeStudents || []).filter(s => {
    if (!s) return false;
    const q = (search || '').toLowerCase().trim();
    const name = (s.name || '').toLowerCase();
    const userId = (s.userId || '').toLowerCase();
    return !q || name.includes(q) || userId.includes(q);
  });

  const presentCount = Object.values(attendanceMap).filter(v => v === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'ABSENT').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Attendance Marking"
      subtitle="Record student check-ins for Kalam Library study hall shifts"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Date, Shift, and Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/80 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Attendance Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Shift / Slot</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-100 text-xs outline-none"
            >
              <option value="Full-Day Study (8 AM - 8 PM)">Full-Day Study (8 AM - 8 PM)</option>
              <option value="Morning Shift (8 AM - 2 PM)">Morning Shift (8 AM - 2 PM)</option>
              <option value="Evening Shift (2 PM - 8 PM)">Evening Shift (2 PM - 8 PM)</option>
              <option value="Night / Extended Study">Night / Extended Study</option>
            </select>
          </div>

          <div className="flex items-center justify-around bg-slate-900/80 rounded-lg p-2 border border-slate-800">
            <div className="text-center">
              <span className="text-[10px] text-emerald-400 block font-bold">PRESENT</span>
              <span className="font-extrabold text-emerald-300 text-sm">{presentCount}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[10px] text-rose-400 block font-bold">ABSENT</span>
              <span className="font-extrabold text-rose-300 text-sm">{absentCount}</span>
            </div>
          </div>
        </div>

        {/* Quick Batch Actions & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member name or KL-..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('PRESENT')}
              className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-lg font-semibold cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('ABSENT')}
              className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 rounded-lg font-semibold cursor-pointer"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Students Checklist List */}
        <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No students found matching your search.
            </div>
          ) : (
            filteredStudents.map(student => {
              const status = attendanceMap[student.uid] || 'PRESENT';
              const isPres = status === 'PRESENT';
              return (
                <div
                  key={student.uid}
                  onClick={() => handleToggle(student.uid)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors cursor-pointer select-none ${
                    isPres 
                      ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15' 
                      : 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isPres ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {(student.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{student.name || 'Student'}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="font-mono text-amber-400">{student.userId}</span>
                        <span>•</span>
                        <span>Desk: {student.assignedSeatNumber || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                    isPres ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-slate-950'
                  }`}>
                    {isPres ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    <span>{status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || activeStudents.length === 0}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CalendarCheck size={15} />
            <span>{loading ? 'Submitting Batch...' : `Save Attendance (${presentCount} Present)`}</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};
