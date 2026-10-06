import React, { useState } from 'react';
import { ReceiptIndianRupee, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { UserProfile, FeeRecord } from '../../types/models';
import { createFee, recordPayment } from '../../services/feeService';
import { useAuth } from '../../context/AuthContext';

interface FeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: UserProfile[];
  preselectedStudent?: UserProfile | null;
  onSuccess: () => void;
}

export const FeeModal: React.FC<FeeModalProps> = ({
  isOpen,
  onClose,
  students,
  preselectedStudent,
  onSuccess
}) => {
  const { adminProfile, role } = useAuth();
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>(preselectedStudent?.uid || '');
  const [title, setTitle] = useState<string>('Monthly Library & Desk Fee (1 Month)');
  const [amount, setAmount] = useState<number>(600);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [recordPaidImmediately, setRecordPaidImmediately] = useState<boolean>(true);
  const [paymentMode, setPaymentMode] = useState<string>('UPI / QR Code');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const studentTarget = preselectedStudent || students.find(s => s.uid === selectedStudentUid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentTarget) {
      setError('Please select a student.');
      return;
    }
    if (amount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fee = await createFee(
        {
          uid: studentTarget.uid,
          userId: studentTarget.userId,
          name: studentTarget.name
        },
        title.trim(),
        Number(amount),
        dueDate,
        {
          uid: adminProfile?.uid || 'adm',
          name: adminProfile?.name || 'Administrator',
          role: role || 'ACCOUNTANT'
        }
      );

      if (recordPaidImmediately) {
        await recordPayment(fee.feeId, paymentMode, {
          uid: adminProfile?.uid || 'adm',
          name: adminProfile?.name || 'Administrator',
          role: role || 'ACCOUNTANT'
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record fee transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Fee & Payment Receipt"
      subtitle="Issue fee invoice with instant receipt generation option"
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
            Student Member <span className="text-amber-400">*</span>
          </label>
          {preselectedStudent ? (
            <div className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs font-semibold">
              {preselectedStudent.name} ({preselectedStudent.userId})
            </div>
          ) : (
            <select
              value={selectedStudentUid}
              onChange={(e) => setSelectedStudentUid(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map(s => (
                <option key={s.uid} value={s.uid}>
                  {s.name} ({s.userId})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Fee Item / Purpose <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Amount (₹ INR) <span className="text-amber-400">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
            />
          </div>
        </div>

        {/* Immediate Receipt Option */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recordPaidImmediately}
              onChange={(e) => setRecordPaidImmediately(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
            />
            <span className="text-xs font-bold text-slate-200">
              Payment already received (Generate Receipt Now)
            </span>
          </label>

          {recordPaidImmediately && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Payment Channel / Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-850 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
              >
                <option value="UPI / PhonePe / GPay / Paytm">UPI / PhonePe / GPay / Paytm</option>
                <option value="Cash at Counter">Cash at Counter</option>
                <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                <option value="Debit Card / POS">Debit Card / POS</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
            <ReceiptIndianRupee size={15} />
            <span>{loading ? 'Recording...' : 'Record Fee Record'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
