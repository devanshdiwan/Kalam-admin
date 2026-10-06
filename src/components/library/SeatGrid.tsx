import React, { useState } from 'react';
import { 
  Armchair, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Bookmark, 
  User, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { LibrarySeat, SeatStatus } from '../../types/models';
import { updateSeatStatus, unassignSeat } from '../../services/seatService';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';

interface SeatGridProps {
  seats: LibrarySeat[];
  onSelectSeat?: (seat: LibrarySeat) => void;
  onRefresh: () => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({
  seats,
  onSelectSeat,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [activeSeatModal, setActiveSeatModal] = useState<LibrarySeat | null>(null);
  const [statusNote, setStatusNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Compute live occupancy metrics
  const total = seats.length;
  const occupied = seats.filter(s => s.status === 'OCCUPIED').length;
  const available = seats.filter(s => s.status === 'AVAILABLE').length;
  const reserved = seats.filter(s => s.status === 'RESERVED').length;
  const maintenance = seats.filter(s => s.status === 'MAINTENANCE').length;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const floors = ['All', 'Ground Floor', '1st Floor'];

  const filteredSeats = selectedFloor === 'All' 
    ? seats 
    : seats.filter(s => s.floor === selectedFloor);

  const getSeatColor = (status: SeatStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25';
      case 'OCCUPIED':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30';
      case 'RESERVED':
        return 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25';
      case 'MAINTENANCE':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const handleUpdateStatus = async (newStatus: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE') => {
    if (!activeSeatModal) return;
    setIsUpdating(true);
    try {
      if (newStatus === 'AVAILABLE' && activeSeatModal.assignedUid) {
        await unassignSeat(activeSeatModal.seatId, activeSeatModal.assignedUid, {
          uid: adminProfile?.uid || 'adm',
          name: adminProfile?.name || 'Administrator',
          role: role || 'SUPER_ADMIN'
        });
      } else {
        await updateSeatStatus(activeSeatModal.seatId, newStatus, statusNote);
      }
      onRefresh();
      setActiveSeatModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Live Study Hall KPI Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Total Desks</span>
          <div className="text-xl font-extrabold text-slate-100">{total}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-amber-400 block mb-1">Occupied</span>
          <div className="text-xl font-extrabold text-amber-400">{occupied}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-emerald-400 block mb-1">Available</span>
          <div className="text-xl font-extrabold text-emerald-400">{available}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-cyan-400 block mb-1">Reserved</span>
          <div className="text-xl font-extrabold text-cyan-400">{reserved}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-rose-400 block mb-1">Maintenance</span>
          <div className="text-xl font-extrabold text-rose-400">{maintenance}</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Live Occupancy</span>
          <div className="text-xl font-extrabold text-amber-300 font-mono">{occupancyRate}%</div>
        </div>
      </div>

      {/* Floor Filter & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Floor Level:</span>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            {floors.map(fl => (
              <button
                key={fl}
                onClick={() => setSelectedFloor(fl)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectedFloor === fl 
                    ? 'bg-amber-400 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-slate-100'
                }`}
              >
                {fl}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500" />
            <span>Available ({available})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500" />
            <span>Occupied ({occupied})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-500" />
            <span>Reserved ({reserved})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500" />
            <span>Maintenance ({maintenance})</span>
          </div>
        </div>
      </div>

      {/* Visual Desk Grid */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-3">
          {filteredSeats.map(seat => {
            const isOcc = seat.status === 'OCCUPIED';
            return (
              <div
                key={seat.seatId}
                onClick={() => setActiveSeatModal(seat)}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-xs ${getSeatColor(seat.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-extrabold tracking-wider">
                    {seat.seatNumber}
                  </span>
                  <Armchair size={15} />
                </div>

                <div className="min-h-[34px] flex flex-col justify-end">
                  {isOcc && seat.assignedStudentName ? (
                    <div className="text-[10px] font-bold truncate" title={seat.assignedStudentName}>
                      {seat.assignedStudentName}
                      <span className="block font-mono text-[9px] opacity-80">{seat.assignedStudentUserId}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-medium capitalize">
                      {seat.status.toLowerCase()}
                    </div>
                  )}
                </div>

                <div className="mt-1 pt-1 border-t border-current/15 text-[9px] opacity-70 truncate">
                  {seat.floor}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seat Detail / Action Modal */}
      {activeSeatModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveSeatModal(null)}
          title={`Desk ${activeSeatModal.seatNumber}`}
          subtitle={`${activeSeatModal.floor} • ${activeSeatModal.section}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-amber-400">{activeSeatModal.status}</span>
              </div>
              {activeSeatModal.assignedStudentName && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Occupant:</span>
                    <span className="font-bold text-slate-100">{activeSeatModal.assignedStudentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">User ID:</span>
                    <span className="font-mono font-bold text-amber-400">{activeSeatModal.assignedStudentUserId}</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick State Toggles */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-300">Set Desk Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('AVAILABLE')}
                  disabled={isUpdating}
                  className="p-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 rounded-lg font-bold hover:bg-emerald-500/25 cursor-pointer"
                >
                  Mark Available
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('RESERVED')}
                  disabled={isUpdating}
                  className="p-2 bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 rounded-lg font-bold hover:bg-cyan-500/25 cursor-pointer"
                >
                  Reserve Desk
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('MAINTENANCE')}
                  disabled={isUpdating}
                  className="col-span-2 p-2 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-lg font-bold hover:bg-rose-500/25 cursor-pointer"
                >
                  Under Repair / Maintenance
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveSeatModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
