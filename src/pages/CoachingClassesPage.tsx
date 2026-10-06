import React, { useState } from 'react';
import { GraduationCap, Plus, Users, Clock, BookOpen, Layers } from 'lucide-react';
import { CoachingClass, CoachingBatch } from '../types/models';
import { EmptyState } from '../components/common/EmptyState';
import { createClass, createBatch } from '../services/coachingService';
import { Modal } from '../components/common/Modal';

interface CoachingClassesPageProps {
  classes: CoachingClass[];
  batches: CoachingBatch[];
  onRefresh: () => void;
}

export const CoachingClassesPage: React.FC<CoachingClassesPageProps> = ({
  classes,
  batches,
  onRefresh
}) => {
  const [showClassModal, setShowClassModal] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);

  // New Class Form
  const [className, setClassName] = useState<string>('');
  const [section, setSection] = useState<string>('A');
  const [stream, setStream] = useState<string>('Civil Services / General Studies');

  // New Batch Form
  const [batchName, setBatchName] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [timing, setTiming] = useState<string>('08:00 AM - 10:00 AM');
  const [instructor, setInstructor] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    setLoading(true);
    try {
      await createClass({
        name: className.trim(),
        section,
        stream
      });
      setShowClassModal(false);
      setClassName('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim() || !selectedClassId) return;
    const cls = classes.find(c => c.classId === selectedClassId);
    setLoading(true);
    try {
      await createBatch({
        name: batchName.trim(),
        classId: selectedClassId,
        className: cls?.name,
        timing,
        instructor: instructor.trim()
      });
      setShowBatchModal(false);
      setBatchName('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <GraduationCap className="text-amber-400" />
            <span>Coaching Classes & Study Batches</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure coaching batches, study groups, academic streams, and timetable slots.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowClassModal(true)}
            className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Class / Course</span>
          </button>

          <button
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Create Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <Clock size={16} className="text-amber-400" />
          <span>Active Coaching & Discussion Batches ({batches.length})</span>
        </h2>

        {batches.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No coaching batches created"
            description="Create your first coaching batch to organize study materials, assignments, and test series."
            actionText="Create First Batch"
            onAction={() => setShowBatchModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map(batch => (
              <div 
                key={batch.batchId}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {batch.className || 'General'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {batch.timing || 'Flexible'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-sm">
                  {batch.name}
                </h3>

                <div className="text-xs text-slate-400">
                  Faculty: <strong className="text-slate-200">{batch.instructor || 'Kalam Library Faculty'}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classes List */}
      <div className="pt-4 border-t border-slate-800">
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
          <Layers size={16} className="text-amber-400" />
          <span>Registered Courses & Streams ({classes.length})</span>
        </h2>

        {classes.length === 0 ? (
          <div className="p-6 bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            No courses defined yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {classes.map(cls => (
              <div key={cls.classId} className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-200 text-sm">{cls.name}</div>
                <div className="text-slate-400">Stream: {cls.stream || 'General'}</div>
                <div className="text-slate-500 font-mono text-[10px]">Academic Year: {cls.academicYear || '2026-27'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showClassModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowClassModal(false)}
          title="Add New Course / Target Stream"
          subtitle="e.g. UPSC Prelims, UP Police Constable, SSC CGL"
          maxWidth="sm"
        >
          <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Course / Class Name *</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Civil Services Foundation"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Stream / Discipline</label>
              <input
                type="text"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowClassModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Save Course
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Batch Modal */}
      {showBatchModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowBatchModal(false)}
          title="Create New Study Batch"
          subtitle="Assign schedule and syllabus tracking"
          maxWidth="sm"
        >
          <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Batch Title *</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g. Morning GS Discussion Batch"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Associated Course *</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              >
                <option value="">-- Select Course --</option>
                {classes.map(c => (
                  <option key={c.classId} value={c.classId}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Class / Study Timing</label>
              <input
                type="text"
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                placeholder="e.g. 08:00 AM - 10:30 AM"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Faculty / Mentor Name</label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Teacher name"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Create Batch
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
