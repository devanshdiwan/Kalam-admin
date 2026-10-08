import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AdminUser, AdminRole } from '../types/models';
import { 
  getActiveSession, 
  setActiveSession, 
  validateAdminLogin, 
  StoredAdminAccount, 
  DEFAULT_SUPER_ADMIN 
} from '../services/adminStore';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  currentUser: { uid: string; email: string; displayName?: string } | null;
  adminProfile: AdminUser | null;
  role: AdminRole | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (allowedRoles: AdminRole[]) => boolean;
  refreshProfile: () => void;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(() => {
    return getActiveSession();
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    // If a valid session already exists in storage, do not block the UI on load
    return !getActiveSession();
  });

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
      setLoading(false);
    }

    // Safety timeout: Never keep the loading spinner up for more than 800ms
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 800);

    // Subscribe to Firebase Authentication state safely
    let unsubscribeAuth = () => {};
    try {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        clearTimeout(safetyTimeout);
        setFirebaseUser(user);
        if (user && session && session.uid !== user.uid) {
          // Sync Firebase UID to current session if different
          const updated = { ...session, uid: user.uid };
          setActiveSession(updated);
          setAdminProfile(updated);
        }
        setLoading(false);
      }, (err) => {
        console.warn('[Firebase Auth state notice]:', err);
        clearTimeout(safetyTimeout);
        setLoading(false);
      });
    } catch (err) {
      console.warn('[Firebase Auth listener notice]:', err);
      clearTimeout(safetyTimeout);
      setLoading(false);
    }

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribeAuth();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const validAdmin = validateAdminLogin(email, pass);

      // Perform real Firebase Authentication
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass.trim());
        if (cred.user && cred.user.uid) {
          validAdmin.uid = cred.user.uid;
        }
      } catch (authErr: any) {
        const code = authErr?.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-email') {
          try {
            const signupCred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), pass.trim());
            if (signupCred.user && signupCred.user.uid) {
              validAdmin.uid = signupCred.user.uid;
            }
          } catch (signUpErr: any) {
            console.warn('[Firebase Auth SignUp Note]:', signUpErr.message);
          }
        } else {
          console.warn('[Firebase Auth SignIn Note]:', authErr.message);
        }
      }

      setActiveSession(validAdmin);
      setAdminProfile(validAdmin);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    setActiveSession(null);
    setAdminProfile(null);
    setFirebaseUser(null);
  };

  const hasPermission = (allowedRoles: AdminRole[]): boolean => {
    if (!adminProfile) return false;
    if (adminProfile.role === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(adminProfile.role);
  };

  const currentUser = useMemo(() => {
    if (!adminProfile) return null;
    return {
      uid: firebaseUser?.uid || adminProfile.uid,
      email: adminProfile.email,
      displayName: adminProfile.name
    };
  }, [adminProfile, firebaseUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      adminProfile,
      role: adminProfile?.role || null,
      loading,
      loginWithEmail,
      logout,
      hasPermission,
      refreshProfile,
      firebaseUser
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
