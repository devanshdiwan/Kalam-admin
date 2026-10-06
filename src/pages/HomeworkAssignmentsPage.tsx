import React, { useState } from 'react';
import { BookOpen, Plus, Calendar, CheckCircle2, Award, Clock } from 'lucide-react';
import { HomeworkAssignment, TestRecord, ResultRecord, UserProfile } from '../types/models';
import { EmptyState } from '../components/common/EmptyState';
import { createHomework, createTest, publishResult } from '../services/coachingService';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

interface HomeworkAssignmentsPageProps {
  homework: HomeworkAssignment[];
  tests: TestRecord[];
  results: ResultRecord[];
  students: UserProfile[];
  onRefresh: () => void;
}

export const HomeworkAssignmentsPage: React.FC<HomeworkAssignmentsPageProps> = ({
  homework,
  tests,
  results,
  students,
  onRefresh
}) => {
  const { adminProfile, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'homework' | 'tests' | 'results'>('homework');
  const [showHomeworkModal, setShowHomeworkModal] = useState<boolean>(false);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  // Homework state
  const [hwTitle, setHwTitle] = useState<string>('');
  const [hwDesc, setHwDesc] = useState<string>('');
  const [hwSubject, setHwSubject] = useState<string>('General Studies');
  const [hwDue, setHwDue] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  // Test state
  const [testTitle, setTestTitle] = useState<string>('');
  const [testSubject, setTestSubject] = useState<string>('GS Mock Test');
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [testTotalMarks, setTestTotalMarks] = useState<number>(100);

  // Result state
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>('');
  const [marksObtained, setMarksObtained] = useState<number>(75);
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [remarks, setRemarks] = useState<string>('Excellent performance');

  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateHw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) return;
    setLoading(true);
    try {
      await createHomework({
        type: 'HOMEWORK',
        title: hwTitle.trim(),
        description: hwDesc.trim(),
        subjectName: hwSubject.trim(),
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: hwDue,
        status: 'ACTIVE'
      }, {
        uid: adminProfile?.uid || 'adm',
        name: adminProfile?.name || 'Administrator',
        role: role || 'TEACHER'
      });
      setShowHomeworkModal(false);
      setHwTitle('');
      setHwDesc('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;
    setLoading(true);
    try {
      await createTest({
        title: testTitle.trim(),
        subjectName: testSubject.trim(),
        date: testDate,
        time: '10:00 AM',
        duration: '120 mins',
        totalMarks: Number(testTotalMarks) || 100,
        status: 'UPCOMING'
      });
      setShowTestModal(false);
      setTestTitle('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentUid) return;
    const student = students.find(s => s.uid === selectedStudentUid);
    const test = tests.find(t => t.testId === selectedTestId);
    if (!student) return;

    setLoading(true);
    try {
      const percentage = Math.round((marksObtained / maxMarks) * 100);
      let grade = 'A';
      if (percentage < 60) grade = 'C';
      else if (percentage < 80) grade = 'B';

      await publishResult({
        testId: selectedTestId || 'test_custom',
        testTitle: test?.title || 'Weekly Assessment',
        studentId: student.userId,
        studentName: student.name,
        subjectName: test?.subjectName || 'General Studies',
        marksObtained: Number(marksObtained),
        maximumMarks: Number(maxMarks),
        percentage,
        grade,
        remarks
      });
      setShowResultModal(false);
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
            <BookOpen className="text-amber-400" />
            <span>Homework, Mock Tests & Results</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage daily assignments, schedule mock assessments, and publish verified test scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'homework' && (
            <button
              onClick={() => setShowHomeworkModal(true)}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Assign Homework</span>
            </button>
          )}

          {activeTab === 'tests' && (
            <button
              onClick={() => setShowTestModal(true)}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Schedule Test</span>
            </button>
          )}

          {activeTab === 'results' && (
            <button
              onClick={() => setShowResultModal(true)}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Award size={15} />
              <span>Publish Result</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('homework')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'homework' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Homework Assignments ({homework.length})
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'tests' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mock Tests & Exams ({tests.length})
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'results' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Published Scores ({results.length})
        </button>
      </div>

      {/* Homework Tab */}
      {activeTab === 'homework' && (
        <div>
          {homework.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No homework assignments active"
              description="Assign home reading, essay topics, or analytical questions for students."
              actionText="Assign Homework"
              onAction={() => setShowHomeworkModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homework.map(hw => (
                <div key={hw.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {hw.subjectName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Due: {hw.dueDate}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">
                    {hw.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {hw.description}
                  </p>

                  <div className="pt-2 text-[10px] text-slate-500">
                    Assigned by {hw.createdBy || 'Teacher'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div>
          {tests.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No tests scheduled"
              description="Schedule regular practice and full-length test series for registered batches."
              actionText="Schedule Test"
              onAction={() => setShowTestModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map(test => (
                <div key={test.testId} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {test.subjectName}
                    </span>
                    <Badge variant={test.status === 'UPCOMING' ? 'info' : 'success'} size="sm">
                      {test.status}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-slate-100 text-sm">
                    {test.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Date: <strong className="font-mono text-amber-300">{test.date}</strong></span>
                    <span>Max Marks: <strong className="font-mono">{test.totalMarks}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {results.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No test results recorded"
              description="Publish student marks to allow students to review their progress on the app."
              actionText="Publish First Result"
              onAction={() => setShowResultModal(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4">Marks Obtained</th>
                    <th className="py-3 px-4">Percentage</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {results.map(res => (
                    <tr key={res.resultId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-200 block">{res.studentName}</span>
                        <span className="font-mono text-slate-400 text-[10px] block">{res.studentId}</span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-300">
                        {res.testTitle}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {res.marksObtained} / {res.maximumMarks}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                        {res.percentage}%
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="purple" size="sm">{res.grade}</Badge>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {res.remarks || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Homework Modal */}
      {showHomeworkModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowHomeworkModal(false)}
          title="Assign New Homework / Task"
          subtitle="Publish assignment details to the student mobile app"
          maxWidth="md"
        >
          <form onSubmit={handleCreateHw} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Homework Title *</label>
              <input
                type="text"
                value={hwTitle}
                onChange={(e) => setHwTitle(e.target.value)}
                placeholder="e.g. Daily Current Affairs Analysis Essay"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={hwSubject}
                  onChange={(e) => setHwSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Submission Deadline</label>
                <input
                  type="date"
                  value={hwDue}
                  onChange={(e) => setHwDue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Task Instructions</label>
              <textarea
                rows={3}
                value={hwDesc}
                onChange={(e) => setHwDesc(e.target.value)}
                placeholder="Questions, chapters to summarize, or problems to solve..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowHomeworkModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Assign Task
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowTestModal(false)}
          title="Schedule Mock Test / Assessment"
          subtitle="Notify students of scheduled exam date and syllabus"
          maxWidth="md"
        >
          <form onSubmit={handleCreateTest} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Test Title *</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g. Weekly Full-Length Mock Test #04"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Subject / Paper</label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Test Date</label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Maximum Marks</label>
              <input
                type="number"
                value={testTotalMarks}
                onChange={(e) => setTestTotalMarks(Number(e.target.value) || 100)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Schedule Test
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowResultModal(false)}
          title="Publish Student Test Score"
          subtitle="Enter marks obtained by enrolled member"
          maxWidth="md"
        >
          <form onSubmit={handlePublishResult} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Select Student *</label>
              <select
                value={selectedStudentUid}
                onChange={(e) => setSelectedStudentUid(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              >
                <option value="">-- Choose Student --</option>
                {students.map(s => (
                  <option key={s.uid} value={s.uid}>{s.name} ({s.userId})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Marks Obtained *</label>
                <input
                  type="number"
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Maximum Marks *</label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value) || 100)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Remarks / Feedback</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Strong in Modern History, needs revision in Geography"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Publish Score
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
