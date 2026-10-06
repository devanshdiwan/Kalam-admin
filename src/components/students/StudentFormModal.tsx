import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Camera, 
  ShieldCheck, 
  KeyRound, 
  User, 
  BookMarked, 
  Users, 
  Armchair,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { LibrarySeat, UserProfile } from '../../types/models';
import { generateNextUserId, isUserIdUnique, createStudentAccount } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: UserProfile) => void;
  availableSeats: LibrarySeat[];
  initialData?: {
    name?: string;
    phone?: string;
    email?: string;
    interest?: string;
  };
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  availableSeats,
  initialData
}) => {
  const { adminProfile, role } = useAuth();
  const [activeStep, setActiveStep] = useState<'account' | 'personal' | 'guardian' | 'academic' | 'library' | 'identity'>('account');

  // Account
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isCheckingId, setIsCheckingId] = useState<boolean>(false);
  const [idError, setIdError] = useState<string>('');
  const [idSuccess, setIdSuccess] = useState<boolean>(false);

  // Personal
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');

  // Guardian
  const [fatherName, setFatherName] = useState<string>('');
  const [motherName, setMotherName] = useState<string>('');
  const [guardianName, setGuardianName] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('');

  // Academic
  const [className, setClassName] = useState<string>('');
  const [batchId, setBatchId] = useState<string>('');

  // Library
  const [membershipType, setMembershipType] = useState<string>('Full-Day (12 Hours)');
  const [membershipStartDate, setMembershipStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [membershipEndDate, setMembershipEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [assignedSeatId, setAssignedSeatId] = useState<string>('');

  // Identity
  const [aadhaarRaw, setAadhaarRaw] = useState<string>('');

  // UI State
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Initialize or prefill
  useEffect(() => {
    if (isOpen) {
      if (initialData?.name) setName(initialData.name);
      if (initialData?.email) setEmail(initialData.email);
      if (initialData?.phone) setPhone(initialData.phone);
      if (!password) {
        setPassword('123456');
        setConfirmPassword('123456');
      }
      
      // Auto-generate next user ID if blank
      handleAutoGenerateUserId();
    }
  }, [isOpen, initialData]);

  const handleAutoGenerateUserId = async () => {
    setIsCheckingId(true);
    try {
      const generated = await generateNextUserId();
      setUserId(generated);
      setIdSuccess(true);
      setIdError('');
    } catch {
      setUserId('KL-1024');
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleUserIdBlur = async () => {
    if (!userId.trim()) return;
    setIsCheckingId(true);
    setIdError('');
    setIdSuccess(false);
    try {
      const unique = await isUserIdUnique(userId);
      if (unique) {
        setIdSuccess(true);
      } else {
        setIdError(`User ID "${userId}" is already taken.`);
      }
    } catch (err: any) {
      setIdError('Could not verify uniqueness.');
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!userId.trim()) {
      setActiveStep('account');
      setFormError('Please enter or generate a User ID.');
      return;
    }
    if (!name.trim()) {
      setActiveStep('personal');
      setFormError('Full Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setActiveStep('personal');
      setFormError('A valid Email address is required for authentication.');
      return;
    }
    if (!phone.trim()) {
      setActiveStep('personal');
      setFormError('Mobile phone number is required.');
      return;
    }
    if (password.length < 6) {
      setActiveStep('account');
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setActiveStep('account');
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const selectedSeat = availableSeats.find(s => s.seatId === assignedSeatId);
      const student = await createStudentAccount({
        userId: userId.trim().toUpperCase(),
        password,
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
        aadhaarMasked: aadhaarRaw.trim(),
        className: className.trim(),
        batchId: batchId.trim(),
        membershipType,
        membershipStatus: 'ACTIVE',
        membershipStartDate,
        membershipEndDate,
        assignedSeatId: assignedSeatId || '',
        assignedSeatNumber: selectedSeat ? selectedSeat.seatNumber : '',
        profileImageUrl: profileImageUrl.trim()
      }, {
        uid: adminProfile?.uid || 'admin_sys',
        name: adminProfile?.name || 'Administrator',
        role: role || 'SUPER_ADMIN'
      });

      onSuccess(student);
      onClose();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to create student account.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'account', label: '1. Account & Security', icon: KeyRound },
    { id: 'personal', label: '2. Personal Info', icon: User },
    { id: 'guardian', label: '3. Parents & Guardian', icon: Users },
    { id: 'library', label: '4. Membership & Seat', icon: Armchair },
    { id: 'academic', label: '5. Academic / Batch', icon: BookMarked },
    { id: 'identity', label: '6. Identity Verification', icon: ShieldCheck },
  ] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Student Account"
      subtitle="Provision new student profile with Firebase Authentication & Library Membership"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs custom-scrollbar">
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

        {/* Global Error Banner */}
        {formError && (
          <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg">
            <AlertCircle size={16} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Step 1: Account & Credentials */}
        {activeStep === 'account' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  User ID <span className="text-amber-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value.toUpperCase())}
                    onBlur={handleUserIdBlur}
                    placeholder="e.g. KL-1024"
                    className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 uppercase font-mono tracking-wider focus:border-amber-400 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateUserId}
                    disabled={isCheckingId}
                    className="px-3 py-2 text-xs font-semibold bg-slate-750 hover:bg-slate-700 border border-slate-600 rounded-lg text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Auto generate next available ID"
                  >
                    <Sparkles size={13} />
                    <span>Generate</span>
                  </button>
                </div>
                {isCheckingId && <p className="text-[11px] text-slate-400 mt-1">Checking ID availability...</p>}
                {idSuccess && <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1"><Check size={12}/> ID is available</p>}
                {idError && <p className="text-[11px] text-rose-400 mt-1">{idError}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Account Status
                </label>
                <div className="px-3 py-2 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>ACTIVE — User will be enabled upon creation</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Initial Password <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">Provided to student for logging in on Android app.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Confirm Password <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Personal Details */}
        {activeStep === 'personal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Patel"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Email Address <span className="text-amber-400">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mobile Phone Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="https://... or upload in profile"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Residential Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Village / Ward, Tehsil Gursarai, Jhansi (U.P.)"
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Parents & Guardian */}
        {activeStep === 'guardian' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Shri ..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="Smt. ..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Guardian Name (if applicable)
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Local guardian / relative"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Guardian Contact Phone
                </label>
                <input
                  type="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="+91 ..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Membership & Seat */}
        {activeStep === 'library' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Membership Shift / Type
                </label>
                <select
                  value={membershipType}
                  onChange={(e) => setMembershipType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                >
                  <option value="Full-Day (12 Hours)">Full-Day (12 Hours — 8 AM to 8 PM)</option>
                  <option value="Half-Day (Morning Shift)">Half-Day (Morning Shift — 8 AM to 2 PM)</option>
                  <option value="Half-Day (Evening Shift)">Half-Day (Evening Shift — 2 PM to 8 PM)</option>
                  <option value="24 Hours All Access">24 Hours All Access (Full-Time Study)</option>
                  <option value="Short Slot (4 Hours)">Short Slot (4 Hours Flexible)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Assign Study Hall Seat
                </label>
                <select
                  value={assignedSeatId}
                  onChange={(e) => setAssignedSeatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                >
                  <option value="">No seat assigned yet (unreserved)</option>
                  {availableSeats
                    .filter(s => s.status === 'AVAILABLE')
                    .map(seat => (
                      <option key={seat.seatId} value={seat.seatId}>
                        Seat {seat.seatNumber} — {seat.floor} ({seat.section})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Only AVAILABLE seats are shown. Prevents duplicate booking.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Membership Start Date
                </label>
                <input
                  type="date"
                  value={membershipStartDate}
                  onChange={(e) => setMembershipStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Membership Expiry Date
                </label>
                <input
                  type="date"
                  value={membershipEndDate}
                  onChange={(e) => setMembershipEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Academic / Batch */}
        {activeStep === 'academic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Target Exam / Class
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. UPSC / SSC / NEET / NDA / Class 12"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Coaching Batch (Optional)
                </label>
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="e.g. Morning General Studies Batch"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Identity & Aadhaar Protection */}
        {activeStep === 'identity' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
              <span className="font-bold">Aadhaar Privacy Notice:</span> The complete 12-digit Aadhaar number is never stored in plain text. It is automatically masked as <span className="font-mono font-bold text-amber-400">XXXX XXXX 1234</span> for security compliance.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Aadhaar Number (12 Digits)
              </label>
              <input
                type="text"
                value={aadhaarRaw}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setAadhaarRaw(cleaned);
                }}
                placeholder="Enter 12 digits"
                maxLength={12}
                className="w-full max-w-sm px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 tracking-widest font-mono focus:border-amber-400 outline-none"
              />
              {aadhaarRaw.length === 12 && (
                <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                  Stored as: XXXX XXXX {aadhaarRaw.slice(-4)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {activeStep !== 'identity' ? (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === activeStep);
                  if (currentIndex < steps.length - 1) {
                    setActiveStep(steps[currentIndex + 1].id);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Next Section &rarr;
              </button>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Save & Create Student</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
};
