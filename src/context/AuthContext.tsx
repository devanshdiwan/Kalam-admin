import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser, AdminRole } from '../types/models';
import { 
  getActiveSession, 
  setActiveSession, 
  validateAdminLogin, 
  StoredAdminAccount, 
  DEFAULT_SUPER_ADMIN 
} from '../services/adminStore';

interface AuthContextType {
  currentUser: { uid: string; email: string; displayName?: string } | null;
  adminProfile: AdminUser | null;
  role: AdminRole | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (allowedRoles: AdminRole[]) => boolean;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = () => {
    const session = getActiveSession();
    if (session) {
      setAdminProfile(session);
    } else {
      setAdminProfile(null);
    }
  };

  useEffect(() => {
    // Restore saved session on mount
    const session = getActiveSession();
    if (session) {
      setAdminProfile(session);
    }
    setLoading(false);
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const validAdmin = validateAdminLogin(email, pass);
      setAdminProfile(validAdmin);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setActiveSession(null);
    setAdminProfile(null);
  };

  const hasPermission = (allowedRoles: AdminRole[]): boolean => {
    if (!adminProfile) return false;
    if (adminProfile.role === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(adminProfile.role);
  };

  const currentUser = adminProfile ? {
    uid: adminProfile.uid,
    email: adminProfile.email,
    displayName: adminProfile.name
  } : null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      adminProfile,
      role: adminProfile?.role || null,
      loading,
      loginWithEmail,
      logout,
      hasPermission,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
