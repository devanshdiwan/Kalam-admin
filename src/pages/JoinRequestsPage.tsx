import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  Clock, 
  ArrowRight, 
  MessageSquare,
  Sparkles,
  Plus
} from 'lucide-react';
import { JoinRequest, JoinRequestStatus } from '../types/models';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { updateJoinRequestStatus, createJoinRequest } from '../services/joinRequestService';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

interface JoinRequestsPageProps {
  joinRequests: JoinRequest[];
  onConvertToStudent: (request: JoinRequest) => void;
  onRefresh: () => void;
}

export const JoinRequestsPage: React.FC<JoinRequestsPageProps> = ({
  joinRequests,
  onConvertToStudent,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeRequest, setActiveRequest] = useState<JoinRequest | null>(null);
  const [newStatus, setNewStatus] = useState<JoinRequestStatus>('CONTACTED');
  const [noteText, setNoteText] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // New Inward Inquiry Modal
  const [showAddInquiryModal, setShowAddInquiryModal] = useState<boolean>(false);
  const [inqName, setInqName] = useState<string>('');
  const [inqPhone, setInqPhone] = useState<string>('');
  const [inqEmail, setInqEmail] = useState<string>('');
  const [inqInterest, setInqInterest] = useState<string>('Full-Day Study Hall');
  const [inqMessage, setInqMessage] = useState<string>('');
  const [isSavingInquiry, setIsSavingInquiry] = useState<boolean>(false);

  const filteredRequests = joinRequests.filter(req => {
    const q = search.toLowerCase();
    const matches = 
      req.fullName.toLowerCase().includes(q) ||
      req.phone.includes(q) ||
      (req.email && req.email.toLowerCase().includes(q));

    if (!matches) return false;
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    return true;
  });

  const handleOpenStatusModal = (req: JoinRequest) => {
    setActiveRequest(req);
    setNewStatus(req.status);
    setNoteText(req.notes || '');
  };

  const handleUpdateStatus = async () => {
    if (!activeRequest) return;
    setIsUpdating(true);
    try {
      await updateJoinRequestStatus(activeRequest.requestId, newStatus, noteText, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'ADMIN'
      });
      onRefresh();
      setActiveRequest(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveInwardInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inqName.trim() || !inqPhone.trim()) return;
    setIsSavingInquiry(true);
    try {
      await createJoinRequest({
        fullName: inqName.trim(),
        phone: inqPhone.trim(),
        email: inqEmail.trim(),
        interest: inqInterest,
        message: inqMessage.trim()
      });
      setShowAddInquiryModal(false);
      setInqName('');
      setInqPhone('');
      setInqEmail('');
      setInqMessage('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingInquiry(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <UserPlus className="text-amber-400" />
            <span>Admission & Join Requests</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Student membership inquiries submitted through mobile app or front desk.
          </p>
        </div>

        <button
          onClick={() => setShowAddInquiryModal(true)}
          className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>New Inquiry</span>
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
            placeholder="Search by student name, phone, email..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {/* Requests Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No join requests found"
            description="All prospective student inquiries and online admission requests will appear here."
            actionText="Record Walk-in Inquiry"
            onAction={() => setShowAddInquiryModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Shift / Interest</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Inquiry Notes</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRequests.map(req => (
                  <tr key={req.requestId} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      {req.fullName}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-200 font-mono">
                          <Phone size={12} className="text-slate-400" />
                          <span>{req.phone}</span>
                        </div>
                        {req.email && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                            <Mail size={11} />
                            <span>{req.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Interest */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-700/60">
                        {req.interest || 'Library Membership'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(req.status)} size="sm">
                        {req.status}
                      </Badge>
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate" title={req.notes || req.message}>
                      {req.notes || req.message || '—'}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenStatusModal(req)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-md font-semibold transition-colors cursor-pointer"
                        >
                          Status
                        </button>

                        <button
                          onClick={() => onConvertToStudent(req)}
                          className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-md shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Convert to Student</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status & Follow-up Note Modal */}
      {activeRequest && (
        <Modal
          isOpen={true}
          onClose={() => setActiveRequest(null)}
          title={`Update Request: ${activeRequest.fullName}`}
          subtitle={`Current Status: ${activeRequest.status}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                New Application Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as JoinRequestStatus)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              >
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED (Telephoned / Messaged)</option>
                <option value="INTERESTED">INTERESTED (Visiting Center)</option>
                <option value="APPROVED">APPROVED (Ready for Onboarding)</option>
                <option value="REJECTED">REJECTED (Declined)</option>
                <option value="COMPLETED">COMPLETED (Account Created)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Administrative Follow-up Notes
              </label>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Call summary, preferred timings, student constraints..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveRequest(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Inward Inquiry Modal */}
      {showAddInquiryModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddInquiryModal(false)}
          title="Record Walk-in Admission Inquiry"
          subtitle="Log prospective student contact for follow-up"
          maxWidth="md"
        >
          <form onSubmit={handleSaveInwardInquiry} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={inqName}
                  onChange={(e) => setInqName(e.target.value)}
                  placeholder="Student name"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={inqPhone}
                  onChange={(e) => setInqPhone(e.target.value)}
                  placeholder="+91 ..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={inqEmail}
                onChange={(e) => setInqEmail(e.target.value)}
                placeholder="optional email"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Membership Interest</label>
              <select
                value={inqInterest}
                onChange={(e) => setInqInterest(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              >
                <option value="Full-Day Study Hall (12 Hours)">Full-Day Study Hall (12 Hours)</option>
                <option value="Morning Shift (8 AM - 2 PM)">Morning Shift (8 AM - 2 PM)</option>
                <option value="Evening Shift (2 PM - 8 PM)">Evening Shift (2 PM - 8 PM)</option>
                <option value="24 Hours All Access">24 Hours All Access</option>
                <option value="Coaching & Guidance Batch">Coaching & Guidance Batch</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Notes / Target Exam</label>
              <textarea
                rows={2}
                value={inqMessage}
                onChange={(e) => setInqMessage(e.target.value)}
                placeholder="Preparing for SSC, UP Police, NEET, UPSC..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddInquiryModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingInquiry}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                {isSavingInquiry ? 'Recording...' : 'Save Inquiry'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
