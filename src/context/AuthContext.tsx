import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

interface DbUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'staff' | 'admin';
  contactNumber?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: DbUserProfile | null;
  role: 'student' | 'staff' | 'admin';
  loading: boolean;
  token: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (newRole: 'student' | 'staff' | 'admin') => Promise<void>;
  updateProfileData: (fullName: string, contactNumber: string) => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUserProfile | null>(null);
  const [role, setRole] = useState<'student' | 'staff' | 'admin'>('student');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const fetchDbUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.dbUser);
        if (data.dbUser?.role) {
          setRole(data.dbUser.role);
        }
      }
    } catch (err) {
      console.warn('Could not fetch DB profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const t = await currentUser.getIdToken();
          setToken(t);
          await fetchDbUser(t);
        } catch (e) {
          console.error('Failed to get user token:', e);
        }
      } else {
        setToken(null);
        setDbUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getToken = async (): Promise<string | null> => {
    if (user) {
      try {
        const t = await user.getIdToken();
        setToken(t);
        return t;
      } catch (err) {
        return token;
      }
    }
    return null;
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      setUser(result.user);
      const t = await result.user.getIdToken();
      setToken(t);
      await fetchDbUser(t);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setDbUser(null);
      setToken(null);
      setRole('student');
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  const switchRole = async (newRole: 'student' | 'staff' | 'admin') => {
    setRole(newRole);
    if (token) {
      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        });
      } catch (err) {
        console.warn('Role switch sync error:', err);
      }
    }
  };

  const updateProfileData = async (fullName: string, contactNumber: string) => {
    if (token) {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, contactNumber }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDbUser(updated);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        role,
        loading,
        token,
        signInWithGoogle,
        signOut,
        switchRole,
        updateProfileData,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
