import { LibraryBook, LibraryIssue } from '../types/models';
import { logAdminActivity } from './auditService';
import { repoBooks, repoIssues } from './dataRepository';

export function subscribeToBooks(callback: (books: LibraryBook[]) => void, onError?: (err: any) => void) {
  return repoBooks.subscribe(callback);
}

export async function addBook(
  bookData: Omit<LibraryBook, 'bookId' | 'availableCopies' | 'createdAt' | 'updatedAt' | 'isAvailable'>,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<LibraryBook> {
  const bookId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();
  const total = Number(bookData.totalCopies) || 1;

  const newBook: LibraryBook = {
    ...bookData,
    bookId,
    totalCopies: total,
    availableCopies: total,
    isAvailable: total > 0,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await repoBooks.set(newBook);

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Book Added',
    targetType: 'BOOK',
    targetId: bookId,
    details: `Added book "${newBook.title}" by ${newBook.author} (${total} copies)`
  });

  return newBook;
}

export async function updateBook(
  bookId: string, 
  data: Partial<LibraryBook>,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  await repoBooks.update(bookId, data);

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Book Updated',
    targetType: 'BOOK',
    targetId: bookId,
    details: `Updated catalog info for book ID ${bookId}`
  });
}

export async function issueBook(
  bookId: string, 
  student: { uid: string; name: string; userId: string },
  dueDate: string,
  currentAdmin: { uid: string; name: string; role: string }
): Promise<string> {
  const book = repoBooks.getById(bookId);
  if (!book) {
    throw new Error('Book not found in library catalogue.');
  }

  if (book.availableCopies <= 0) {
    throw new Error(`No copies available for "${book.title}". All copies are currently issued.`);
  }

  const issueId = `iss_${Date.now()}`;
  const nowIso = new Date().toISOString();

  // Decrement copies
  const newAvailable = book.availableCopies - 1;
  await repoBooks.update(bookId, {
    availableCopies: newAvailable,
    isAvailable: newAvailable > 0
  });

  const issueData: LibraryIssue = {
    issueId,
    uid: student.uid,
    studentId: student.userId,
    studentName: student.name,
    bookId,
    bookTitle: book.title,
    issuedAt: nowIso,
    dueDate,
    status: 'ISSUED',
    renewalCount: 0,
    issuedBy: currentAdmin.name,
    createdAt: nowIso,
    updatedAt: nowIso
  };

  await repoIssues.set(issueData);

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Book Issued',
    targetType: 'BOOK',
    targetId: bookId,
    details: `Issued book to ${student.name} (${student.userId}) with due date ${dueDate}`
  });

  return issueId;
}

export async function returnBook(
  issueId: string, 
  currentAdmin: { uid: string; name: string; role: string }
): Promise<void> {
  const issue = repoIssues.getById(issueId);
  if (!issue) {
    throw new Error('Issue record not found.');
  }

  if (issue.status === 'RETURNED') {
    throw new Error('This book has already been returned.');
  }

  const nowIso = new Date().toISOString();

  await repoIssues.update(issueId, {
    status: 'RETURNED',
    returnedAt: nowIso,
    returnedBy: currentAdmin.name
  });

  // Restore available copies
  const book = repoBooks.getById(issue.bookId);
  if (book) {
    const newAvailable = Math.min(book.totalCopies, book.availableCopies + 1);
    await repoBooks.update(issue.bookId, {
      availableCopies: newAvailable,
      isAvailable: true
    });
  }

  await logAdminActivity({
    adminUid: currentAdmin.uid,
    adminName: currentAdmin.name,
    adminRole: currentAdmin.role,
    action: 'Book Returned',
    targetType: 'BOOK_ISSUE',
    targetId: issueId,
    details: `Returned book for issue ID ${issueId}`
  });
}

export function subscribeToIssues(callback: (issues: LibraryIssue[]) => void, onError?: (err: any) => void) {
  return repoIssues.subscribe(callback);
}
