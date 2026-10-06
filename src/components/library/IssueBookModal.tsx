import React, { useState } from 'react';
import { ArrowLeftRight, AlertCircle, BookOpen, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { LibraryBook, UserProfile } from '../../types/models';
import { issueBook } from '../../services/bookService';
import { useAuth } from '../../context/AuthContext';

interface IssueBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: LibraryBook[];
  students: UserProfile[];
  onSuccess: () => void;
}

export const IssueBookModal: React.FC<IssueBookModalProps> = ({
  isOpen,
  onClose,
  books,
  students,
  onSuccess
}) => {
  const { adminProfile, role } = useAuth();
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 days loan period default
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const availableBooks = books.filter(b => b.availableCopies > 0);
  const activeStudents = students.filter(s => s.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedStudentUid) {
      setError('Please select both a book and an active student.');
      return;
    }
    const student = students.find(s => s.uid === selectedStudentUid);
    if (!student) return;

    setLoading(true);
    setError('');

    try {
      await issueBook(
        selectedBookId, 
        {
          uid: student.uid,
          name: student.name,
          userId: student.userId
        }, 
        dueDate, 
        {
          uid: adminProfile?.uid || 'adm',
          name: adminProfile?.name || 'Administrator',
          role: role || 'LIBRARIAN'
        }
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to issue book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Book to Student"
      subtitle="Create official loan record with inventory decrementation"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Select Book (Copies Available) <span className="text-amber-400">*</span>
          </label>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            required
          >
            <option value="">-- Choose Book ({availableBooks.length} titles available) --</option>
            {availableBooks.map(b => (
              <option key={b.bookId} value={b.bookId}>
                {b.title} — by {b.author} ({b.availableCopies} available)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Issue To Student Member <span className="text-amber-400">*</span>
          </label>
          <select
            value={selectedStudentUid}
            onChange={(e) => setSelectedStudentUid(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            required
          >
            <option value="">-- Choose Active Student Member --</option>
            {activeStudents.map(s => (
              <option key={s.uid} value={s.uid}>
                {s.name} ({s.userId}) — {s.membershipType || 'Active'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Return Due Date <span className="text-amber-400">*</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Standard library issue duration: 14 days.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeftRight size={15} />
            <span>{loading ? 'Processing...' : 'Confirm Book Issue'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
