import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  UserX, 
  UserCheck, 
  KeyRound, 
  AlertCircle, 
  Sparkles,
  Edit,
  Trash2,
  Lock,
  Mail,
  User,
  CheckCircle2
} from 'lucide-react';
import { AdminUser, AdminRole } from '../types/models';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { 
  getAdminAccounts, 
  createNewAdminAccount, 
  updateAdminAccountDetails, 
  deleteAdminAccount, 
  StoredAdminAccount 
} from '../services/adminStore';

interface AdminUsersPageProps {
  adminUsers: AdminUser[];
  onRefresh: () => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({
  onRefresh
}) => {
  const { adminProfile, role, refreshProfile } = useAuth();
  const [adminList, setAdminList] = useState<StoredAdminAccount[]>([]);
  const [search, setSearch] = useState<string>('');

  // Add Admin Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>('');
  const [addEmail, setAddEmail] = useState<string>('');
  const [addPassword, setAddPassword] = useState<string>('ADMIN123');
  const [addRole, setAddRole] = useState<AdminRole>('LIBRARIAN');
  const [addError, setAddError] = useState<string>('');

  // Edit Admin Modal
  const [editingAdmin, setEditingAdmin] = useState<StoredAdminAccount | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editRole, setEditRole] = useState<AdminRole>('SUPER_ADMIN');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editError, setEditError] = useState<string>('');

  const [successToast, setSuccessToast] = useState<string>('');

  const isSuperAdmin = role === 'SUPER_ADMIN';

  const loadAccounts = () => {
    const list = getAdminAccounts();
    setAdminList(list);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      setAddError('Please fill in Name, Email, and Password.');
      return;
    }
    setAddError('');

    try {
      createNewAdminAccount({
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword.trim(),
        role: addRole
      }, {
        uid: adminProfile?.uid || 'adm_root',
        name: adminProfile?.name || 'SUPER ADMIN',
        role: role || 'SUPER_ADMIN'
      });

      setShowAddModal(false);
      setAddName('');
      setAddEmail('');
      setAddPassword('ADMIN123');
      loadAccounts();
      onRefresh();
      setSuccessToast(`New administrator "${addName}" added successfully.`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setAddError(err.message || 'Failed to create administrator.');
    }
  };

  const handleOpenEdit = (admin: StoredAdminAccount) => {
    setEditingAdmin(admin);
    setEditName(admin.name);
    setEditEmail(admin.email);
    setEditPassword(admin.password || '');
    setEditRole(admin.role);
    setEditStatus(admin.status);
    setEditError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Name and Email cannot be empty.');
      return;
    }
    setEditError('');

    try {
      updateAdminAccountDetails(editingAdmin.uid, {
        name: editName.trim(),
        email: editEmail.trim(),
        password: editPassword.trim(),
        role: editRole,
        status: editStatus
      }, {
        uid: adminProfile?.uid || 'adm_root',
        name: adminProfile?.name || 'SUPER ADMIN',
        role: role || 'SUPER_ADMIN'
      });

      setEditingAdmin(null);
      loadAccounts();
      refreshProfile();
      onRefresh();
      setSuccessToast(`Details for "${editName}" updated successfully.`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update admin details.');
    }
  };

  const handleDelete = (admin: StoredAdminAccount) => {
    try {
      deleteAdminAccount(admin.uid, {
        uid: adminProfile?.uid || 'adm_root',
        name: adminProfile?.name || 'SUPER ADMIN',
        role: role || 'SUPER_ADMIN'
      });
      loadAccounts();
      onRefresh();
      setSuccessToast(`Admin "${admin.name}" removed.`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      setSuccessToast(`Cannot delete admin: ${err.message}`);
      setTimeout(() => setSuccessToast(''), 4000);
    }
  };

  const filteredAdmins = (adminList || []).filter(a => {
    if (!a) return false;
    const q = (search || '').toLowerCase().trim();
    const name = (a.name || '').toLowerCase();
    const email = (a.email || '').toLowerCase();
    const role = (a.role || '').toLowerCase();

    return !q || name.includes(q) || email.includes(q) || role.includes(q);
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="text-amber-400" />
            <span>Admin Users & Credentials Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage administrative personnel, edit credentials, and grant role permissions.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add New Admin</span>
          </button>
        )}
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Role Breakdown Reference */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <Badge variant="purple" size="sm" className="mb-1">SUPER_ADMIN</Badge>
          <span className="text-[11px] text-slate-400 block">Full system access & admin management</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <Badge variant="purple" size="sm" className="mb-1">ADMIN</Badge>
          <span className="text-[11px] text-slate-400 block">Student admissions, notices, notifications</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <Badge variant="info" size="sm" className="mb-1">LIBRARIAN</Badge>
          <span className="text-[11px] text-slate-400 block">Desks, catalogue, book issues, gate passes</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <Badge variant="warning" size="sm" className="mb-1">TEACHER</Badge>
          <span className="text-[11px] text-slate-400 block">Coaching classes, tests, homework, materials</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <Badge variant="success" size="sm" className="mb-1">ACCOUNTANT</Badge>
          <span className="text-[11px] text-slate-400 block">Fees, receipts, payments & financial audit</span>
        </div>
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <Badge variant="neutral" size="sm" className="mb-1">STAFF</Badge>
          <span className="text-[11px] text-slate-400 block">Attendance logging & gate validation only</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search administrators by name, email, or role..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Current Password</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAdmins.map(admin => {
                const isCurrent = admin.uid === adminProfile?.uid;
                const isRoot = (admin.email || '').toLowerCase() === 'superadmin@gmail.com';

                return (
                  <tr key={admin.uid} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400">
                        {(admin.name || 'Admin').charAt(0)}
                      </div>
                      <div>
                        <span>{admin.name}</span>
                        {isCurrent && (
                          <span className="ml-1.5 text-[10px] text-amber-300 font-normal font-mono bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                            (You)
                          </span>
                        )}
                        {isRoot && (
                          <span className="ml-1.5 text-[10px] text-purple-300 font-normal font-mono bg-purple-500/15 px-1 py-0.5 rounded border border-purple-500/30">
                            Root
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {admin.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="purple" size="sm">
                        {admin.role}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {isSuperAdmin ? (
                        <span className="text-amber-300 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {admin.password || 'ADMIN123'}
                        </span>
                      ) : (
                        <span>••••••••</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={admin.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                        {admin.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Recent Session'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleOpenEdit(admin)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700 rounded-md font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit Admin Details & Password"
                          >
                            <Edit size={13} />
                            <span>Edit Details</span>
                          </button>
                        )}

                        {isSuperAdmin && !isRoot && (
                          <button
                            onClick={() => handleDelete(admin)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                            title="Delete Admin"
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Add New Admin Modal */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Add New Administrator"
          subtitle="Provision new administrative login credentials"
          maxWidth="sm"
        >
          <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
            {addError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{addError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-300 mb-1">Admin Full Name *</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Admin Login Email *</label>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="e.g. librarian@kalamlibrary.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Admin Password *</label>
              <input
                type="text"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Assigned Role *</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as AdminRole)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              >
                <option value="ADMIN">ADMIN (General & Admissions)</option>
                <option value="LIBRARIAN">LIBRARIAN (Seats, Books & Gate Passes)</option>
                <option value="TEACHER">TEACHER (Batches, Tests & Homework)</option>
                <option value="ACCOUNTANT">ACCOUNTANT (Fees & Billing)</option>
                <option value="STAFF">STAFF (Attendance & Entry)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full System Access)</option>
              </select>
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
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Create Admin
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <Modal
          isOpen={true}
          onClose={() => setEditingAdmin(null)}
          title={`Edit Details: ${editingAdmin.name}`}
          subtitle={`Account Email: ${editingAdmin.email}`}
          maxWidth="sm"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {editError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-300 mb-1">Admin Full Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Admin Login Email *</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Login Password *</label>
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Change password"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400 font-mono font-bold"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                You can change the password here. New password will immediately be required for signing in.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Role *</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as AdminRole)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full System Access)</option>
                <option value="ADMIN">ADMIN (General & Admissions)</option>
                <option value="LIBRARIAN">LIBRARIAN (Seats, Books & Gate Passes)</option>
                <option value="TEACHER">TEACHER (Batches, Tests & Homework)</option>
                <option value="ACCOUNTANT">ACCOUNTANT (Fees & Billing)</option>
                <option value="STAFF">STAFF (Attendance & Entry)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Account Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-amber-400"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
