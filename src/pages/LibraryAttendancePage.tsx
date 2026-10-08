import React, { useState } from 'react';
import { CalendarCheck, Search, Users, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';
import { LibraryAttendance, UserProfile } from '../types/models';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { markSingleAttendance } from '../services/attendanceService';
import { useAuth } from '../context/AuthContext';

interface LibraryAttendancePageProps {
  attendanceRecords: LibraryAttendance[];
  students: UserProfile[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenBulkModal: () => void;
  onRefresh: () => void;
}

export const LibraryAttendancePage: React.FC<LibraryAttendancePageProps> = ({
  attendanceRecords,
  students,
  selectedDate,
  onDateChange,
  onOpenBulkModal,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');

  const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
  const absentCount = attendanceRecords.filter(a => a.status === 'ABSENT').length;

  const filteredRecords = (attendanceRecords || []).filter(r => {
    if (!r) return false;
    const q = (search || '').toLowerCase().trim();
    const studentName = (r.studentName || '').toLowerCase();
    const studentId = (r.studentId || '').toLowerCase();

    const matches = 
      !q ||
      studentName.includes(q) ||
      studentId.includes(q);

    if (!matches) return false;
    if (shiftFilter !== 'ALL' && r.shift !== shiftFilter) return false;
    return true;
  });

  const handleToggleStatus = async (record: LibraryAttendance) => {
    const newStatus = record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    const student = students.find(s => s.uid === record.uid);
    if (!student) return;

    try {
      await markSingleAttendance(
        { uid: student.uid, userId: student.userId, name: student.name },
        selectedDate,
        newStatus,
        record.shift || 'Full-Day Study',
        {
          uid: adminProfile?.uid || 'adm',
          name: adminProfile?.name || 'Administrator',
          role: role || 'LIBRARIAN'
        }
      );
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <CalendarCheck className="text-amber-400" />
            <span>Library Daily Attendance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log student study hall check-ins and check-outs across shifts. Student app has read-only access.
          </p>
        </div>

        <button
          onClick={onOpenBulkModal}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <CalendarCheck size={15} />
          <span>Batch / Bulk Attendance</span>
        </button>
      </div>

      {/* Date Filter Bar & Live Daily Tally */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Shift</label>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          >
            <option value="ALL">All Shifts</option>
            <option value="Full-Day Study (8 AM - 8 PM)">Full-Day Study (8 AM - 8 PM)</option>
            <option value="Morning Shift (8 AM - 2 PM)">Morning Shift (8 AM - 2 PM)</option>
            <option value="Evening Shift (2 PM - 8 PM)">Evening Shift (2 PM - 8 PM)</option>
          </select>
        </div>

        <div className="flex items-center justify-around bg-slate-850 p-2.5 rounded-lg border border-slate-800">
          <div className="text-center">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase">Present Today</span>
            <span className="text-lg font-extrabold text-emerald-300 font-mono">{presentCount}</span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center">
            <span className="text-[10px] text-rose-400 font-bold block uppercase">Absent Logged</span>
            <span className="text-lg font-extrabold text-rose-300 font-mono">{absentCount}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredRecords.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title={`No attendance marked for ${selectedDate}`}
            description="Use the Bulk Attendance button to quickly mark all active members present for today's study shift."
            actionText="Mark Bulk Attendance"
            onAction={onOpenBulkModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Study Shift</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4 text-right">Quick Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRecords.map(rec => {
                  const isPres = rec.status === 'PRESENT';
                  return (
                    <tr key={rec.attendanceId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100">
                        {rec.studentName}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {rec.studentId}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {rec.checkIn || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {rec.shift || 'Standard'}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={isPres ? 'success' : 'danger'} size="sm">
                          {rec.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {rec.markedBy || 'Staff'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(rec)}
                          className={`px-3 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                            isPres 
                              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30' 
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          Mark {isPres ? 'Absent' : 'Present'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
