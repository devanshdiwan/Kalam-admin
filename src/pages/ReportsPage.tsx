import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  Users, 
  Armchair, 
  BookOpen, 
  ReceiptIndianRupee,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, LibrarySeat, LibraryBook, LibraryIssue, FeeRecord, LibraryAttendance } from '../types/models';

interface ReportsPageProps {
  students: UserProfile[];
  seats: LibrarySeat[];
  books: LibraryBook[];
  issues: LibraryIssue[];
  fees: FeeRecord[];
  attendance: LibraryAttendance[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  students = [],
  seats = [],
  books = [],
  issues = [],
  fees = [],
  attendance = []
}) => {
  const [dateRangeStart, setDateRangeStart] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudentsReport = () => {
    const headers = ['User ID', 'Name', 'Phone', 'Email', 'Class', 'Membership', 'Seat', 'Status', 'Enrollment Date'];
    const rows = students.map(s => [
      s.userId,
      s.name,
      s.phone,
      s.email,
      s.className || '',
      s.membershipType || '',
      s.assignedSeatNumber || 'Unassigned',
      s.active ? 'ACTIVE' : 'INACTIVE',
      new Date(s.createdAt).toLocaleDateString()
    ]);
    downloadCsv('kalam_library_students_report', headers, rows);
  };

  const exportAttendanceReport = () => {
    const filtered = attendance.filter(a => a.date >= dateRangeStart && a.date <= dateRangeEnd);
    const headers = ['Date', 'Student Name', 'User ID', 'Status', 'Check-In', 'Shift', 'Marked By'];
    const rows = filtered.map(a => [
      a.date,
      a.studentName,
      a.studentId,
      a.status,
      a.checkIn || '',
      a.shift || '',
      a.markedBy || ''
    ]);
    downloadCsv('kalam_library_attendance_report', headers, rows);
  };

  const exportFeesReport = () => {
    const headers = ['Receipt #', 'Student Name', 'User ID', 'Fee Head', 'Amount', 'Status', 'Due Date', 'Paid Date', 'Payment Mode'];
    const rows = fees.map(f => [
      f.receiptNumber || 'PENDING',
      f.studentName,
      f.studentId,
      f.title,
      f.amount,
      f.status,
      f.dueDate,
      f.paidDate ? new Date(f.paidDate).toLocaleDateString() : '',
      f.paymentMode || ''
    ]);
    downloadCsv('kalam_library_fee_collections_report', headers, rows);
  };

  const exportBooksReport = () => {
    const headers = ['Book ID', 'Title', 'Author', 'Category', 'ISBN', 'Total Copies', 'Available Copies'];
    const rows = books.map(b => [
      b.bookId,
      b.title,
      b.author,
      b.category,
      b.isbn || '',
      b.totalCopies,
      b.availableCopies
    ]);
    downloadCsv('kalam_library_inventory_report', headers, rows);
  };

  const exportSeatsReport = () => {
    const headers = ['Seat Number', 'Floor', 'Section', 'Status', 'Assigned Student', 'Student User ID'];
    const rows = seats.map(s => [
      s.seatNumber,
      s.floor,
      s.section,
      s.status,
      s.assignedStudentName || '',
      s.assignedStudentUserId || ''
    ]);
    downloadCsv('kalam_library_seat_occupancy_report', headers, rows);
  };

  const reports = [
    {
      title: 'Student Master Directory Report',
      description: 'Comprehensive roster of all students with assigned study desks, memberships, and contact details.',
      icon: Users,
      count: `${students.length} records`,
      onExport: exportStudentsReport
    },
    {
      title: 'Study Hall Seat Occupancy Report',
      description: 'Current utilization breakdown of all Ground Floor and 1st Floor study hall desks and occupant details.',
      icon: Armchair,
      count: `${seats.filter(s => s.status === 'OCCUPIED').length} / ${seats.length} occupied`,
      onExport: exportSeatsReport
    },
    {
      title: 'Fee Collection & Dues Report',
      description: 'Financial ledger of all monthly desk fees, tuition invoices, paid receipts, and pending dues.',
      icon: ReceiptIndianRupee,
      count: `₹${fees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString('en-IN')} collected`,
      onExport: exportFeesReport
    },
    {
      title: 'Attendance Ledger Report',
      description: 'Export student attendance logs filtered by specified date range and shift categories.',
      icon: Calendar,
      count: `${attendance.length} logs recorded`,
      onExport: exportAttendanceReport,
      hasDateFilter: true
    },
    {
      title: 'Book Catalogue & Loan History Report',
      description: 'Complete book volume inventory, copies in stock, and active borrower records.',
      icon: BookOpen,
      count: `${books.length} volumes in catalog`,
      onExport: exportBooksReport
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="text-amber-400" />
            <span>Administrative Reports & Data Export</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Export structured CSV data spreadsheets for administration, auditors, and management.
          </p>
        </div>
      </div>

      {/* Date Range Selector for Date-Dependent Reports */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-4 text-xs">
        <span className="font-bold text-slate-300 flex items-center gap-1.5">
          <Calendar size={14} className="text-amber-400" />
          <span>Report Date Range:</span>
        </span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRangeStart}
            onChange={(e) => setDateRangeStart(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs outline-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateRangeEnd}
            onChange={(e) => setDateRangeEnd(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs outline-none"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep, idx) => {
          const Icon = rep.icon;
          return (
            <div 
              key={idx}
              className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-750 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Icon size={16} />
                    </div>
                    <h3 className="font-bold text-slate-100 text-sm">{rep.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    {rep.count}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {rep.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={rep.onExport}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} className="text-amber-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
