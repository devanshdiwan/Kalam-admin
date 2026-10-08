import React, { useState } from 'react';
import { ArrowLeftRight, Search, Check, AlertCircle, RotateCcw, Clock } from 'lucide-react';
import { LibraryIssue, LibraryBook, UserProfile } from '../types/models';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { returnBook } from '../../src/services/bookService';
import { useAuth } from '../context/AuthContext';

interface LibraryIssuesPageProps {
  issues: LibraryIssue[];
  books: LibraryBook[];
  students: UserProfile[];
  onOpenIssueModal: () => void;
  onRefresh: () => void;
}

export const LibraryIssuesPage: React.FC<LibraryIssuesPageProps> = ({
  issues,
  books,
  students,
  onOpenIssueModal,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [processingId, setProcessingId] = useState<string>('');

  const todayIso = new Date().toISOString().split('T')[0];

  const handleReturn = async (issueId: string) => {
    setProcessingId(issueId);
    try {
      await returnBook(issueId, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'LIBRARIAN'
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId('');
    }
  };

  const filteredIssues = (issues || []).filter(iss => {
    if (!iss) return false;
    const q = (search || '').toLowerCase().trim();
    const bookTitle = (iss.bookTitle || '').toLowerCase();
    const studentName = (iss.studentName || '').toLowerCase();
    const studentId = (iss.studentId || '').toLowerCase();

    const matches = 
      !q ||
      bookTitle.includes(q) ||
      studentName.includes(q) ||
      studentId.includes(q);

    if (!matches) return false;

    const isOverdue = iss.status === 'ISSUED' && iss.dueDate && iss.dueDate < todayIso;

    if (statusFilter === 'ISSUED' && iss.status !== 'ISSUED') return false;
    if (statusFilter === 'RETURNED' && iss.status !== 'RETURNED') return false;
    if (statusFilter === 'OVERDUE' && !isOverdue) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <ArrowLeftRight className="text-amber-400" />
            <span>Book Issues & Returns</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active book loans, due dates, return check-in, and overdue tracking.
          </p>
        </div>

        <button
          onClick={onOpenIssueModal}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeftRight size={15} />
          <span>Issue Book</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search book title, student name, KL-ID..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          >
            <option value="ALL">All Issues</option>
            <option value="ISSUED">Currently Issued (Active)</option>
            <option value="OVERDUE">Overdue Loans</option>
            <option value="RETURNED">Returned & Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredIssues.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No issue records found"
            description="All issued books and return histories will be tracked here in realtime."
            actionText="Issue a Book Now"
            onAction={onOpenIssueModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Student Borrower</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Issued By</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredIssues.map(iss => {
                  const isReturned = iss.status === 'RETURNED';
                  const isOverdue = !isReturned && iss.dueDate && iss.dueDate < todayIso;

                  return (
                    <tr key={iss.issueId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-100 max-w-[220px] truncate" title={iss.bookTitle}>
                        {iss.bookTitle}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200 block">{iss.studentName}</span>
                        <span className="font-mono text-amber-400 text-[10px] block">{iss.studentId}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                        {new Date(iss.issuedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {iss.dueDate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <Badge variant="danger" size="sm">OVERDUE</Badge>
                        ) : (
                          <Badge variant={isReturned ? 'success' : 'info'} size="sm">
                            {iss.status}
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {iss.issuedBy || 'Librarian'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isReturned ? (
                          <button
                            onClick={() => handleReturn(iss.issueId)}
                            disabled={processingId === iss.issueId}
                            className="px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg font-bold flex items-center gap-1 transition-colors ml-auto cursor-pointer"
                          >
                            <RotateCcw size={12} className={processingId === iss.issueId ? 'animate-spin' : ''} />
                            <span>Return</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">
                            Returned on {iss.returnedAt ? new Date(iss.returnedAt).toLocaleDateString() : 'Done'}
                          </span>
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

    </div>
  );
};
