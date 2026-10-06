import React, { useState } from 'react';
import { FileText, Plus, Download, Search, ExternalLink, BookOpen, Layers } from 'lucide-react';
import { StudyMaterial } from '../types/models';
import { EmptyState } from '../components/common/EmptyState';
import { createStudyMaterial } from '../services/coachingService';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

interface StudyMaterialPageProps {
  materials: StudyMaterial[];
  onRefresh: () => void;
}

export const StudyMaterialPage: React.FC<StudyMaterialPageProps> = ({
  materials,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('General Studies');
  const [fileType, setFileType] = useState<any>('PDF');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;

    setIsSaving(true);
    try {
      await createStudyMaterial({
        title: title.trim(),
        description: description.trim(),
        subjectId: 'sub_general',
        subjectName,
        fileUrl: fileUrl.trim(),
        fileType
      }, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'TEACHER'
      });

      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <FileText className="text-amber-400" />
            <span>Digital Study Material & Notes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Syllabus notes, question banks, previous year papers, and curated PDFs for students.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No study materials uploaded"
          description="Upload downloadable PDFs or worksheets for students enrolled in Kalam Library."
          actionText="Upload First Note"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(mat => (
            <div 
              key={mat.materialId}
              className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {mat.fileType}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {mat.subjectName || 'General'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-sm mb-1">
                  {mat.title}
                </h3>

                {mat.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {mat.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[10px]">
                  Uploaded by {mat.uploadedBy || 'Faculty'}
                </span>

                <a
                  href={mat.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 rounded-md font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink size={12} />
                  <span>Open Resource</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Upload / Register Study Material"
          subtitle="Publish reference PDFs or lecture worksheets"
          maxWidth="md"
        >
          <form onSubmit={handleSaveMaterial} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Resource Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern Indian History Hand-Written Notes"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Subject / Stream</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Indian Polity, Reasoning..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Format Type</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="Notes">Class Notes</option>
                  <option value="Worksheet">Practice Worksheet</option>
                  <option value="Question Paper">Previous Year Paper</option>
                  <option value="Image">Diagram / Chart</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">File URL / Download Link *</label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://firebasestorage.googleapis.com/... or cloud link"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Summary / Guidance</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions on syllabus topics covered..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                {isSaving ? 'Uploading...' : 'Publish Resource'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
