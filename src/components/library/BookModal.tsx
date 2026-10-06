import React, { useState } from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { LibraryBook } from '../../types/models';
import { addBook } from '../../services/bookService';
import { useAuth } from '../../context/AuthContext';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (book: LibraryBook) => void;
}

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { adminProfile, role } = useAuth();
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [isbn, setIsbn] = useState<string>('');
  const [category, setCategory] = useState<string>('Competitive / Civil Services');
  const [totalCopies, setTotalCopies] = useState<number>(3);
  const [description, setDescription] = useState<string>('');
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const categories = [
    'Competitive / Civil Services',
    'General Studies & History',
    'Mathematics & Reasoning',
    'Science & Technology',
    'Hindi & English Literature',
    'Self-Help & Biographies',
    'Reference & Encyclopedias',
    'Magazines & Current Affairs'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setError('Title and Author are required.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const book = await addBook({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category,
        totalCopies: Number(totalCopies) || 1,
        description: description.trim(),
        coverImageUrl: coverImageUrl.trim()
      }, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'SUPER_ADMIN'
      });

      onSuccess(book);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Book to Catalogue"
      subtitle="Register new book volume with inventory tracking"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Book Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Indian Polity by M. Laxmikanth"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Author(s) <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. M. Laxmikanth"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ISBN / Book Code
            </label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 978-9352604883"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Category / Shelf
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Total Copies in Stock <span className="text-amber-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={totalCopies}
              onChange={(e) => setTotalCopies(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://... cover image url"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details regarding edition, edition year, or syllabus notes..."
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            />
          </div>
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
            <BookOpen size={15} />
            <span>{loading ? 'Adding...' : 'Save Book'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
