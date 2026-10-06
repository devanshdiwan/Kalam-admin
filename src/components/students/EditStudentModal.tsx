import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  KeyRound, 
  User, 
  Users, 
  Armchair, 
  BookMarked, 
  ShieldCheck, 
  AlertCircle, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { UserProfile, LibrarySeat } from '../../types/models';
import { updateStudentProfile } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import { repoSeats } from '../../services/dataRepository';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserProfile | null;
  seats: LibrarySeat[];
  onSuccess: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  seats,
  onSuccess
}) => {
  const { adminProfile, role } = useAuth();
  const [activeStep, setActiveStep] = useState<'account' | 'personal' | 'guardian' | 'library' | 'academic' | 'identity'>('account');
  const [showPassword, setShowPassword] = useState<boolean>(true);

  // Form Fields
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');

  const [fatherName, setFatherName] = useState<string>('');
  const [motherName, setMotherName] = useState<string>('');
  const [guardianName, setGuardianName] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('');

  const [className, setClassName] = useState<string>('');
  const [batchId, setBatchId] = useState<string>('');

  const [membershipType, setMembershipType] = useState<string>('Full-Day (12 Hours)');
  const [membershipStatus, setMembershipStatus] = useState<'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'INACTIVE'>('ACTIVE');
  const [membershipStartDate, setMembershipStartDate] = useState<string>('');
  const [membershipEndDate, setMembershipEndDate] = useState<string>('');
  const [assignedSeatId, setAssignedSeatId] = useState<string>('');

  const [aadhaarRaw, setAadhaarRaw] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copiedCredentials, setCopiedCredentials] = useState<boolean>(false);

  useEffect(() => {
    if (student && isOpen) {
      setUserId(student.userId || '');
      setPassword(student.password || '123456');
      setActive(student.active !== false);

      setName(student.name || '');
      setEmail(student.email || '');
      setPhone(student.phone || '');
      setDateOfBirth(student.dateOfBirth || '');
      setGender(student.gender || 'Male');
      setAddress(student.address || '');
      setProfileImageUrl(student.profileImageUrl || '');

      setFatherName(student.fatherName || '');
      setMotherName(student.motherName || '');
      setGuardianName(student.guardianName || '');
      setGuardianPhone(student.guardianPhone || '');

      setClassName(student.className || '');
      setBatchId(student.batchId || '');

      setMembershipType(student.membershipType || 'Full-Day (12 Hours)');
      setMembershipStatus(student.membershipStatus || 'ACTIVE');
      setMembershipStartDate(student.membershipStartDate || '');
      setMembershipEndDate(student.membershipEndDate || '');
      setAssignedSeatId(student.assignedSeatId || '');

      setAadhaarRaw(student.aadhaarMasked ? student.aadhaarMasked.replace(/\D/g, '') : '');
      setError('');
    }
  }, [student, isOpen]);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Student Name is required.');
      return;
    }
    if (!userId.trim()) {
      setError('User ID is required.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedSeat = seats.find(s => s.seatId === assignedSeatId);
      const oldSeatId = student.assignedSeatId;

      // If seat changed, free old seat and occupy new seat
      if (oldSeatId && oldSeatId !== assignedSeatId) {
        await repoSeats.update(oldSeatId, {
          status: 'AVAILABLE',
          assignedUid: undefined,
          assignedStudentName: undefined,
          assignedStudentUserId: undefined
        });
      }

      if (assignedSeatId && assignedSeatId !== oldSeatId) {
        await repoSeats.update(assignedSeatId, {
          status: 'OCCUPIED',
          assignedUid: student.uid,
          assignedStudentName: name.trim(),
          assignedStudentUserId: userId.trim().toUpperCase()
        });
      }

      let aadhaarMasked = student.aadhaarMasked || '';
      if (aadhaarRaw && aadhaarRaw.length >= 4) {
        aadhaarMasked = `XXXX XXXX ${aadhaarRaw.slice(-4)}`;
      }

      await updateStudentProfile(student.uid, {
        userId: userId.trim().toUpperCase(),
        password: password.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        dateOfBirth,
        gender,
        address: address.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        aadhaarMasked,
        className: className.trim(),
        batchId: batchId.trim(),
        membershipType,
        membershipStatus,
        membershipStartDate,
        membershipEndDate,
        assignedSeatId,
        assignedSeatNumber: selectedSeat ? selectedSeat.seatNumber : (assignedSeatId || ''),
        profileImageUrl: profileImageUrl.trim(),
        active
      }, {
        uid: adminProfile?.uid || 'adm_root',
        name: adminProfile?.name || 'SUPER ADMIN',
        role: role || 'SUPER_ADMIN'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update student details.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'account', label: '1. Account & Password', icon: KeyRound },
    { id: 'personal', label: '2. Personal Info', icon: User },
    { id: 'library', label: '3. Membership & Seat', icon: Armchair },
    { id: 'guardian', label: '4. Guardian Info', icon: Users },
    { id: 'academic', label: '5. Academic / Batch', icon: BookMarked },
    { id: 'identity', label: '6. Aadhaar Identity', icon: ShieldCheck },
  ] as const;

  // Available seats plus the currently assigned seat
  const seatOptions = seats.filter(s => s.status === 'AVAILABLE' || s.seatId === student.assignedSeatId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Student: ${student.name}`}
      subtitle={`User ID: ${student.userId} • Edit all profile & login credentials`}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        
        {/* Step Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 custom-scrollbar">
          {steps.map(s => {
            const Icon = s.icon;
            const isActive = activeStep === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStep(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-amber-400 text-slate-950 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Account & Password */}
        {activeStep === 'account' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong className="text-amber-300">App Login Credentials:</strong> Student uses this <strong>User ID</strong> and <strong>Password</strong> to sign into the Kalam Library Android App.
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`User ID: ${userId}\nPassword: ${password}\nLibrary: Kalam Library Gursarai`);
                  setCopiedCredentials(true);
                  setTimeout(() => setCopiedCredentials(false), 3000);
                }}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-md font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedCredentials ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedCredentials ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  User ID (Login ID) *
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toUpperCase())}
                  placeholder="e.g. KL-1024"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold tracking-wider outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300">
                    App Login Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('123456')}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Set to "123456"
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter student password"
                    className="w-full pr-10 pl-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  If student gets "incorrect password", update the password here, save changes, and share with the student.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={active ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setActive(e.target.value === 'ACTIVE')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                >
                  <option value="ACTIVE">ACTIVE — Allowed to Login & Enter</option>
                  <option value="INACTIVE">INACTIVE — Suspended / Deactivated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 2. Personal Information */}
        {activeStep === 'personal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Profile Photo URL</label>
                <input
                  type="url"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Residential Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

        {/* 3. Membership & Desk Seat */}
        {activeStep === 'library' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Membership Plan / Shift</label>
                <select
                  value={membershipType}
                  onChange={(e) => setMembershipType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                >
                  <option value="Full-Day (12 Hours)">Full-Day (12 Hours — 8 AM to 8 PM)</option>
                  <option value="Half-Day (Morning Shift)">Half-Day (Morning Shift — 8 AM to 2 PM)</option>
                  <option value="Half-Day (Evening Shift)">Half-Day (Evening Shift — 2 PM to 8 PM)</option>
                  <option value="24 Hours All Access">24 Hours All Access</option>
                  <option value="Short Slot (4 Hours)">Short Slot (4 Hours)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Membership Status</label>
                <select
                  value={membershipStatus}
                  onChange={(e) => setMembershipStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="EXPIRING_SOON">EXPIRING_SOON</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Assigned Study Desk</label>
                <select
                  value={assignedSeatId}
                  onChange={(e) => setAssignedSeatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                >
                  <option value="">-- No Desk Allocated (Unassigned) --</option>
                  {seatOptions.map(seat => (
                    <option key={seat.seatId} value={seat.seatId}>
                      Desk {seat.seatNumber} — {seat.floor} ({seat.section}) {seat.seatId === student.assignedSeatId ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Membership Start Date</label>
                <input
                  type="date"
                  value={membershipStartDate}
                  onChange={(e) => setMembershipStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Membership Expiry Date</label>
                <input
                  type="date"
                  value={membershipEndDate}
                  onChange={(e) => setMembershipEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Guardian Details */}
        {activeStep === 'guardian' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Father's Name</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Mother's Name</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Guardian Name</label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Guardian Phone</label>
                <input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. Academic */}
        {activeStep === 'academic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Class / Stream</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. UPSC, SSC, NEET..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Coaching Batch</label>
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="e.g. Morning Batch"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. Identity Verification (Aadhaar) */}
        {activeStep === 'identity' && (
          <div className="space-y-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                value={aadhaarRaw}
                onChange={(e) => setAadhaarRaw(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12 digits"
                className="w-full max-w-sm px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono tracking-widest outline-none focus:border-amber-400"
                maxLength={12}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Stored securely as: <span className="font-mono text-amber-300 font-bold">XXXX XXXX {aadhaarRaw.slice(-4) || '1234'}</span>
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-lg cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save size={15} />
            <span>{loading ? 'Saving Changes...' : 'Save All Details'}</span>
          </button>
        </div>

      </form>
    </Modal>
  );
};
