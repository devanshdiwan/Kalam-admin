import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Armchair, 
  QrCode, 
  ReceiptIndianRupee, 
  KeyRound, 
  MoreVertical, 
  Eye, 
  Edit,
  UserX, 
  UserCheck,
  Download,
  AlertCircle
} from 'lucide-react';
import { UserProfile, LibrarySeat } from '../types/models';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { toggleStudentActive } from '../services/studentService';
import { useAuth } from '../context/AuthContext';

interface StudentsPageProps {
  students: UserProfile[];
  seats: LibrarySeat[];
  onOpenCreateStudent: () => void;
  onSelectStudent: (student: UserProfile) => void;
  onOpenEditStudent: (student: UserProfile) => void;
  onOpenAssignSeat: (student: UserProfile) => void;
  onOpenCreateGatePass: (student: UserProfile) => void;
  onOpenRecordFee: (student: UserProfile) => void;
  onRefresh: () => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({
  students,
  seats,
  onOpenCreateStudent,
  onSelectStudent,
  onOpenEditStudent,
  onOpenAssignSeat,
  onOpenCreateGatePass,
  onOpenRecordFee,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [membershipFilter, setMembershipFilter] = useState<string>('ALL');
  const [seatFilter, setSeatFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search match
      const query = search.toLowerCase();
      const matchesSearch = 
        student.name.toLowerCase().includes(query) ||
        student.userId.toLowerCase().includes(query) ||
        student.phone.includes(query) ||
        student.email.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && !student.active) return false;
      if (statusFilter === 'INACTIVE' && student.active) return false;

      // Membership status filter
      if (membershipFilter !== 'ALL' && student.membershipStatus !== membershipFilter) return false;

      // Seat filter
      if (seatFilter === 'SEATED' && !student.assignedSeatNumber) return false;
      if (seatFilter === 'UNSEATED' && student.assignedSeatNumber) return false;

      return true;
    });
  }, [students, search, statusFilter, membershipFilter, seatFilter]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const handleToggleActive = async (student: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleStudentActive(student.uid, !student.active, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'SUPER_ADMIN'
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const exportStudentsCsv = () => {
    const headers = ['User ID', 'Name', 'Phone', 'Email', 'Class', 'Membership', 'Seat', 'Status', 'Created Date'];
    const rows = filteredStudents.map(s => [
      s.userId,
      `"${s.name.replace(/"/g, '""')}"`,
      s.phone,
      s.email,
      s.className || '',
      s.membershipType || '',
      s.assignedSeatNumber || 'Unassigned',
      s.active ? 'ACTIVE' : 'INACTIVE',
      new Date(s.createdAt).toLocaleDateString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kalam_library_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Users className="text-amber-400" />
            <span>Student Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Directory of enrolled students, library memberships, study hall seats, and account status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportStudentsCsv}
            disabled={filteredStudents.length === 0}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCreateStudent}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <UserPlus size={15} />
            <span>New Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, KL-ID, phone..."
              className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
            >
              <option value="ALL">All Account Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated Accounts</option>
            </select>
          </div>

          <div>
            <select
              value={membershipFilter}
              onChange={(e) => {
                setMembershipFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
            >
              <option value="ALL">All Memberships</option>
              <option value="ACTIVE">Membership: Active</option>
              <option value="EXPIRING_SOON">Membership: Expiring Soon</option>
              <option value="EXPIRED">Membership: Expired</option>
              <option value="INACTIVE">Membership: Inactive</option>
            </select>
          </div>

          <div>
            <select
              value={seatFilter}
              onChange={(e) => {
                setSeatFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
            >
              <option value="ALL">All Desks</option>
              <option value="SEATED">Assigned to Study Desk</option>
              <option value="UNSEATED">No Seat Allocated</option>
            </select>
          </div>

        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description={students.length === 0 
              ? "No students have been registered yet. Click below to create your first student profile." 
              : "No students matched your search and filter criteria."}
            actionText={students.length === 0 ? "Create First Student" : undefined}
            onAction={students.length === 0 ? onOpenCreateStudent : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Phone / Contact</th>
                    <th className="py-3 px-4">Target Class</th>
                    <th className="py-3 px-4">Membership</th>
                    <th className="py-3 px-4">Desk Seat</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedStudents.map(student => (
                    <tr 
                      key={student.uid}
                      onClick={() => onSelectStudent(student)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Photo & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center font-bold text-amber-400 shrink-0">
                            {student.profileImageUrl ? (
                              <img src={student.profileImageUrl} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              student.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-200 block group-hover:text-amber-300 transition-colors">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {student.userId}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {student.phone || '—'}
                      </td>

                      {/* Target Class */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {student.className || 'General'}
                      </td>

                      {/* Membership */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Badge variant={student.membershipStatus === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                            {student.membershipStatus || 'ACTIVE'}
                          </Badge>
                          <span className="block text-[10px] text-slate-400 truncate max-w-[120px]">
                            {student.membershipType || 'Standard'}
                          </span>
                        </div>
                      </td>

                      {/* Seat */}
                      <td className="py-3.5 px-4">
                        {student.assignedSeatNumber ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                            <Armchair size={11} />
                            <span>{student.assignedSeatNumber}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={student.active ? 'success' : 'danger'} size="sm">
                          {student.active ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEditStudent(student)}
                            title="Edit Student Profile & Password"
                            className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => onSelectStudent(student)}
                            title="View Full Student Dossier"
                            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => onOpenAssignSeat(student)}
                            title="Assign / Change Study Desk"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Armchair size={15} />
                          </button>

                          <button
                            onClick={() => onOpenCreateGatePass(student)}
                            title="Issue QR Gate Pass"
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <QrCode size={15} />
                          </button>

                          <button
                            onClick={() => onOpenRecordFee(student)}
                            title="Record Tuition / Seat Fee"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <ReceiptIndianRupee size={15} />
                          </button>

                          <button
                            onClick={(e) => handleToggleActive(student, e)}
                            title={student.active ? 'Deactivate Student Account' : 'Activate Student Account'}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              student.active ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-emerald-400 hover:bg-slate-800'
                            }`}
                          >
                            {student.active ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-850 text-xs text-slate-400">
              <div>
                Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredStudents.length)}</strong> of <strong>{filteredStudents.length}</strong> students
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 cursor-pointer"
                >
                  &larr; Prev
                </button>
                <span className="px-2 font-semibold text-slate-200">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 cursor-pointer"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
