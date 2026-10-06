import React, { useState } from 'react';
import { Armchair, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { LibrarySeat, UserProfile } from '../../types/models';
import { assignSeat, unassignSeat } from '../../services/seatService';
import { useAuth } from '../../context/AuthContext';

interface SeatAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserProfile | null;
  seats: LibrarySeat[];
  onSuccess: () => void;
}

export const SeatAssignModal: React.FC<SeatAssignModalProps> = ({
  isOpen,
  onClose,
  student,
  seats,
  onSuccess
}) => {
  const { adminProfile, role } = useAuth();
  const [selectedSeatId, setSelectedSeatId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!student) return null;

  const handleAssign = async () => {
    if (!selectedSeatId) {
      setError('Please select an available seat.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // If student previously had another seat, unassign it first
      if (student.assignedSeatId && student.assignedSeatId !== selectedSeatId) {
        await unassignSeat(student.assignedSeatId);
      }

      await assignSeat(selectedSeatId, {
        uid: student.uid,
        name: student.name,
        userId: student.userId
      }, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'SUPER_ADMIN'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign seat.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignCurrent = async () => {
    if (!student.assignedSeatId) return;
    setLoading(true);
    setError('');
    try {
      await unassignSeat(student.assignedSeatId, student.uid, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'SUPER_ADMIN'
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to unassign seat.');
    } finally {
      setLoading(false);
    }
  };

  const availableSeats = seats.filter(s => s.status === 'AVAILABLE');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Study Hall Seat"
      subtitle={`Allocate a designated seat for ${student.name} (${student.userId})`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {student.assignedSeatNumber && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-lg flex items-center justify-between">
            <div className="text-xs text-amber-200">
              Currently assigned: <strong className="font-mono text-amber-400">{student.assignedSeatNumber}</strong>
            </div>
            <button
              onClick={handleUnassignCurrent}
              disabled={loading}
              className="text-xs text-rose-300 hover:text-rose-200 underline font-semibold cursor-pointer"
            >
              Release Current Seat
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Select Available Desk / Seat
          </label>
          <select
            value={selectedSeatId}
            onChange={(e) => setSelectedSeatId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
          >
            <option value="">-- Choose a seat ({availableSeats.length} available) --</option>
            {availableSeats.map(seat => (
              <option key={seat.seatId} value={seat.seatId}>
                Seat {seat.seatNumber} — {seat.floor} ({seat.section})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            Realtime guard: Seats occupied by other active students cannot be selected.
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
            type="button"
            onClick={handleAssign}
            disabled={loading || !selectedSeatId}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <Armchair size={15} />
            <span>{loading ? 'Assigning...' : 'Confirm Assignment'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
