import React, { useState } from 'react';
import { 
  ReceiptIndianRupee, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Printer, 
  FileText,
  DollarSign
} from 'lucide-react';
import { FeeRecord, UserProfile } from '../types/models';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { recordPayment } from '../services/feeService';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

interface FeesBillingPageProps {
  fees: FeeRecord[];
  students: UserProfile[];
  onOpenCreateFee: () => void;
  onViewReceipt: (fee: FeeRecord) => void;
  onRefresh: () => void;
}

export const FeesBillingPage: React.FC<FeesBillingPageProps> = ({
  fees,
  students,
  onOpenCreateFee,
  onViewReceipt,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pay modal state
  const [payingFee, setPayingFee] = useState<FeeRecord | null>(null);
  const [paymentMode, setPaymentMode] = useState<string>('UPI / PhonePe / GPay');
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);

  // Compute live metrics
  const totalCollected = fees
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const totalPending = fees
    .filter(f => f.status === 'PENDING')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const totalOverdue = fees
    .filter(f => f.status === 'OVERDUE')
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayCollection = fees
    .filter(f => f.status === 'PAID' && f.paidDate && f.paidDate.startsWith(todayIso))
    .reduce((sum, f) => sum + (f.amount || 0), 0);

  const filteredFees = (fees || []).filter(f => {
    if (!f) return false;
    const q = (search || '').toLowerCase().trim();
    const studentName = (f.studentName || '').toLowerCase();
    const studentId = (f.studentId || '').toLowerCase();
    const receiptNumber = (f.receiptNumber || '').toLowerCase();
    const title = (f.title || '').toLowerCase();

    const matches = 
      !q ||
      studentName.includes(q) ||
      studentId.includes(q) ||
      receiptNumber.includes(q) ||
      title.includes(q);

    if (!matches) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    return true;
  });

  const handleConfirmPayment = async () => {
    if (!payingFee) return;
    setIsProcessingPay(true);
    try {
      await recordPayment(payingFee.feeId, paymentMode, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'ACCOUNTANT'
      });
      onRefresh();
      setPayingFee(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingPay(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <ReceiptIndianRupee className="text-amber-400" />
            <span>Fees, Invoicing & Billing</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor library monthly fees, tuition dues, generate receipts, and track collection.
          </p>
        </div>

        <button
          onClick={onOpenCreateFee}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>Record New Fee</span>
        </button>
      </div>

      {/* KPI Stats Row (Section 32 of prompt) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-emerald-400 block mb-1">Total Collected</span>
          <div className="text-xl font-extrabold text-emerald-300 font-mono">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Cumulative verified fees</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-amber-400 block mb-1">Pending Invoices</span>
          <div className="text-xl font-extrabold text-amber-300 font-mono">
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting member payment</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-rose-400 block mb-1">Overdue Amount</span>
          <div className="text-xl font-extrabold text-rose-300 font-mono">
            ₹{totalOverdue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Past due date</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-cyan-400 block mb-1">Today's Collection</span>
          <div className="text-xl font-extrabold text-cyan-300 font-mono">
            ₹{todayCollection.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Receipted today</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, KL-ID, Receipt #, or purpose..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Payment Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredFees.length === 0 ? (
          <EmptyState
            icon={ReceiptIndianRupee}
            title="No fee records found"
            description="Record student monthly subscriptions or exam fees to track revenue and generate receipts."
            actionText="Record First Fee"
            onAction={onOpenCreateFee}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Fee Head</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredFees.map(fee => {
                  const isPaid = fee.status === 'PAID';
                  return (
                    <tr key={fee.feeId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {fee.receiptNumber || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200 block">{fee.studentName}</span>
                        <span className="font-mono text-slate-400 text-[10px] block">{fee.studentId}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {fee.title}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        ₹{fee.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {fee.dueDate}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={getStatusBadgeVariant(fee.status)} size="sm">
                          {fee.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPaid ? (
                            <button
                              onClick={() => onViewReceipt(fee)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Printer size={13} />
                              <span>Receipt</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setPayingFee(fee)}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                            >
                              Receive Payment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      {payingFee && (
        <Modal
          isOpen={true}
          onClose={() => setPayingFee(null)}
          title="Collect Fee Payment"
          subtitle={`Student: ${payingFee.studentName} (${payingFee.studentId})`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Purpose:</span>
                <span className="font-semibold text-slate-100">{payingFee.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount to Collect:</span>
                <span className="font-mono font-extrabold text-amber-400 text-sm">
                  ₹{payingFee.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Select Payment Channel / Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              >
                <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                <option value="Cash at Front Desk">Cash at Front Desk</option>
                <option value="Bank Transfer (IMPS/NEFT)">Bank Transfer (IMPS/NEFT)</option>
                <option value="Card / POS">Card / POS</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPayingFee(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessingPay}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                {isProcessingPay ? 'Recording...' : 'Generate Official Receipt'}
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
