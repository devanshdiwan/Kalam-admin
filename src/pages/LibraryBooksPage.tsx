import React, { useState } from 'react';
import { BookOpen, Plus, Search, Filter, ArrowLeftRight, Check, AlertTriangle } from 'lucide-react';
import { LibraryBook } from '../types/models';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';

interface LibraryBooksPageProps {
  books: LibraryBook[];
  onOpenAddBook: () => void;
  onOpenIssueModal: (book?: LibraryBook) => void;
}

export const LibraryBooksPage: React.FC<LibraryBooksPageProps> = ({
  books,
  onOpenAddBook,
  onOpenIssueModal
}) => {
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const categories = Array.from(new Set((books || []).map(b => b?.category))).filter(Boolean);

  const filteredBooks = (books || []).filter(b => {
    if (!b) return false;
    const q = (search || '').toLowerCase().trim();
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const isbn = (b.isbn || '').toLowerCase();

    const matches = 
      !q ||
      title.includes(q) ||
      author.includes(q) ||
      isbn.includes(q);

    if (!matches) return false;
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <BookOpen className="text-amber-400" />
            <span>Library Book Catalogue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage reference books, general studies volumes, syllabus guides, and stock copies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenIssueModal()}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeftRight size={14} className="text-amber-400" />
            <span>Issue a Book</span>
          </button>

          <button
            onClick={onOpenAddBook}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search book title, author, ISBN..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books in catalogue"
          description={books.length === 0 
            ? "Your library catalogue is currently empty. Add your first textbook or reference book." 
            : "No books match your search filters."}
          actionText={books.length === 0 ? "Add First Book" : undefined}
          onAction={books.length === 0 ? onOpenAddBook : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBooks.map(book => {
            const hasStock = book.availableCopies > 0;
            return (
              <div 
                key={book.bookId}
                className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate">
                      {book.category}
                    </span>
                    <Badge variant={hasStock ? 'success' : 'danger'} size="sm">
                      {hasStock ? `${book.availableCopies} In Stock` : 'Out of Stock'}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm leading-snug group-hover:text-amber-300 transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    by <span className="text-slate-300 font-semibold">{book.author}</span>
                  </p>

                  {book.isbn && (
                    <p className="text-[11px] font-mono text-slate-500 mt-2">
                      ISBN: {book.isbn}
                    </p>
                  )}

                  {book.description && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400">
                    Total: <strong className="text-slate-200">{book.totalCopies}</strong>
                  </div>

                  <button
                    onClick={() => onOpenIssueModal(book)}
                    disabled={!hasStock}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight size={13} />
                    <span>Issue</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
