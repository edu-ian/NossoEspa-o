import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection } from '../firebase';
import { Couple, UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  couple: Couple | null;
  loading: boolean;
  isDemo: boolean;
  demoPartnerView: boolean; // toggle to simulate partner's perspective
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
  deleteCoupleSpace: () => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  createCoupleSpace: (spaceName?: string) => Promise<string>;
  joinCoupleSpace: (code: string) => Promise<boolean>;
  updateCoupleInfo: (data: Partial<Couple>) => Promise<void>;
  startDemoMode: (initialCode?: string) => void;
  toggleDemoPartner: () => void;
  currentUserId: string;
  currentUserName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'nosso_espaco_demo_state';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [demoPartnerView, setDemoPartnerView] = useState<boolean>(false);

  // Test Firebase connection once on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsDemo(false);
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          let userProfile: UserProfile;
          if (userDoc.exists()) {
            userProfile = userDoc.data() as UserProfile;
          } else {
            userProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Parceiro(a)',
              photoURL: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, userProfile);
          }
          setUser(userProfile);

          // If user already has a couple linked
          if (userProfile.coupleId) {
            listenToCouple(userProfile.coupleId);
          } else {
            setCouple(null);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setLoading(false);
        }
      } else {
        // Check if demo mode was active in session
        const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo);
            setIsDemo(true);
            setUser(parsed.user);
            setCouple(parsed.couple);
          } catch {
            setUser(null);
            setCouple(null);
          }
        } else {
          setUser(null);
          setCouple(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for the active couple document
  const listenToCouple = (coupleId: string) => {
    const unsub = onSnapshot(
      doc(db, 'couples', coupleId),
      (docSnap) => {
        if (docSnap.exists()) {
          setCouple(docSnap.data() as Couple);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Couple snapshot listener error:', error);
        setLoading(false);
      }
    );
    return unsub;
  };

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Parceiro(a)',
          photoURL: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUser(newProfile);
      }
    } catch (err) {
      console.error('Google login failed:', err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    await signInWithEmailAndPassword(auth, cleanEmail, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: cleanName });
    }
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cleanEmail,
      displayName: cleanName || 'Parceiro(a)',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    setUser(newProfile);
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Por favor, informe seu e-mail para recuperar a senha.');
    }
    await sendPasswordResetEmail(auth, cleanEmail);
  };

  const logout = async () => {
    if (isDemo) {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setIsDemo(false);
      setUser(null);
      setCouple(null);
      return;
    }
    await fbSignOut(auth);
    setUser(null);
    setCouple(null);
  };

  const updateProfileName = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (isDemo) {
      if (user) {
        const updatedUser = { ...user, displayName: trimmed };
        let updatedCouple = couple;
        if (couple) {
          if (demoPartnerView) {
            updatedCouple = { ...couple, partner2Name: trimmed };
          } else {
            updatedCouple = { ...couple, partner1Name: trimmed };
          }
        }
        setUser(updatedUser);
        setCouple(updatedCouple);
        localStorage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify({ user: updatedUser, couple: updatedCouple })
        );
      }
      return;
    }

    if (!user || !auth.currentUser) return;

    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await updateDoc(doc(db, 'users', user.uid), { displayName: trimmed });

      if (couple) {
        const isPartner1 = couple.partner1Id === user.uid;
        await updateDoc(doc(db, 'couples', couple.id), {
          [isPartner1 ? 'partner1Name' : 'partner2Name']: trimmed,
        });
      }

      setUser((prev) => (prev ? { ...prev, displayName: trimmed } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const deleteCoupleSpace = async () => {
    if (isDemo) {
      if (user) {
        const updatedUser = { ...user, coupleId: undefined, partnerName: undefined };
        setUser(updatedUser);
        setCouple(null);
        localStorage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify({ user: updatedUser, couple: null })
        );
      }
      return;
    }

    if (!user) return;

    try {
      if (couple) {
        // Remove couple doc
        await deleteDoc(doc(db, 'couples', couple.id));
      }
      await updateDoc(doc(db, 'users', user.uid), {
        coupleId: '',
        partnerName: '',
      });

      setCouple(null);
      setUser((prev) => (prev ? { ...prev, coupleId: undefined, partnerName: undefined } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, couple ? `couples/${couple.id}` : 'couples');
    }
  };

  const deleteUserAccount = async () => {
    if (isDemo) {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setIsDemo(false);
      setUser(null);
      setCouple(null);
      return;
    }

    if (!user || !auth.currentUser) return;

    try {
      const uid = user.uid;
      // If user had a couple, unbind or remove
      if (couple) {
        try {
          if (couple.partner1Id === uid && !couple.partner2Id) {
            await deleteDoc(doc(db, 'couples', couple.id));
          } else {
            await updateDoc(doc(db, 'couples', couple.id), {
              [couple.partner1Id === uid ? 'partner1Id' : 'partner2Id']: '',
              [couple.partner1Id === uid ? 'partner1Name' : 'partner2Name']: 'Ex-parceiro(a)',
            });
          }
        } catch {
          // non-blocking
        }
      }

      // Delete user document in Firestore
      await deleteDoc(doc(db, 'users', uid));

      // Delete Firebase Auth User
      await deleteUser(auth.currentUser);

      setUser(null);
      setCouple(null);
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  };

  // Generate clean readable code like NOSSO-892
  const generateCode = (): string => {
    const num = Math.floor(100 + Math.random() * 900);
    return `NOSSO-${num}`;
  };

  const createCoupleSpace = async (spaceName?: string): Promise<string> => {
    const code = generateCode();

    if (isDemo || !user) {
      // Demo fallback
      const demoCoupleId = `couple-${Date.now()}`;
      const newCouple: Couple = {
        id: demoCoupleId,
        code,
        partner1Id: user?.uid || 'user-1',
        partner1Name: user?.displayName || 'Você',
        partner2Id: 'user-2',
        partner2Name: 'Seu Amor',
        spaceName: spaceName || 'Nosso Espaço Íntimo',
        createdAt: new Date().toISOString(),
      };
      setCouple(newCouple);
      if (user) {
        const updatedUser = { ...user, coupleId: demoCoupleId, partnerName: 'Seu Amor' };
        setUser(updatedUser);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: updatedUser, couple: newCouple }));
      }
      return code;
    }

    try {
      const coupleRef = doc(collection(db, 'couples'));
      const newCouple: Couple = {
        id: coupleRef.id,
        code,
        partner1Id: user.uid,
        partner1Name: user.displayName,
        spaceName: spaceName || `Espaço de ${user.displayName}`,
        createdAt: new Date().toISOString(),
      };

      await setDoc(coupleRef, newCouple);
      await updateDoc(doc(db, 'users', user.uid), {
        coupleId: coupleRef.id,
      });

      setUser((prev) => (prev ? { ...prev, coupleId: coupleRef.id } : null));
      setCouple(newCouple);
      listenToCouple(coupleRef.id);
      return code;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'couples');
      throw error;
    }
  };

  const joinCoupleSpace = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();

    if (isDemo || !user) {
      // Allow demo joining
      const demoCoupleId = `couple-joined-${cleanCode}`;
      const newCouple: Couple = {
        id: demoCoupleId,
        code: cleanCode,
        partner1Id: 'user-partner',
        partner1Name: 'Parceiro(a)',
        partner2Id: user?.uid || 'user-me',
        partner2Name: user?.displayName || 'Você',
        spaceName: 'Nosso Espaço',
        createdAt: new Date().toISOString(),
      };
      setCouple(newCouple);
      if (user) {
        const updatedUser = { ...user, coupleId: demoCoupleId, partnerName: 'Parceiro(a)' };
        setUser(updatedUser);
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: updatedUser, couple: newCouple }));
      }
      return true;
    }

    try {
      const q = query(collection(db, 'couples'), where('code', '==', cleanCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return false;
      }

      const coupleDoc = querySnapshot.docs[0];
      const coupleData = coupleDoc.data() as Couple;

      // Update couple with partner 2
      await updateDoc(doc(db, 'couples', coupleDoc.id), {
        partner2Id: user.uid,
        partner2Name: user.displayName,
      });

      // Update current user
      await updateDoc(doc(db, 'users', user.uid), {
        coupleId: coupleDoc.id,
        partnerName: coupleData.partner1Name,
      });

      setUser((prev) => (prev ? { ...prev, coupleId: coupleDoc.id, partnerName: coupleData.partner1Name } : null));
      listenToCouple(coupleDoc.id);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'couples');
      return false;
    }
  };

  const updateCoupleInfo = async (data: Partial<Couple>) => {
    if (!couple) return;

    if (isDemo) {
      const updated = { ...couple, ...data };
      setCouple(updated);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user, couple: updated }));
      return;
    }

    try {
      await updateDoc(doc(db, 'couples', couple.id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `couples/${couple.id}`);
    }
  };

  // Instant Demo Mode for immediate testing
  const startDemoMode = (initialCode?: string) => {
    const code = initialCode || 'DEMO-PAR';
    const demoUser: UserProfile = {
      uid: 'user-demo-1',
      email: 'josef@nossoespaco.app',
      displayName: 'Josef',
      coupleId: 'couple-demo-1',
      partnerName: 'Fulana',
      createdAt: new Date().toISOString(),
    };
    const demoCouple: Couple = {
      id: 'couple-demo-1',
      code: code,
      partner1Id: 'user-demo-1',
      partner1Name: 'Josef',
      partner2Id: 'user-demo-2',
      partner2Name: 'Fulana',
      spaceName: 'Josef & Fulana',
      anniversaryDate: '2023-06-12',
      createdAt: new Date().toISOString(),
    };

    setIsDemo(true);
    setUser(demoUser);
    setCouple(demoCouple);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, couple: demoCouple }));
  };

  const toggleDemoPartner = () => {
    setDemoPartnerView((prev) => !prev);
  };

  // Resolve current active identity (helps demo mode switch between Partner 1 and Partner 2 to test bilateral ratings!)
  const currentUserId = isDemo
    ? demoPartnerView
      ? (couple?.partner2Id || 'user-demo-2')
      : (couple?.partner1Id || 'user-demo-1')
    : (user?.uid || '');

  const currentUserName = isDemo
    ? demoPartnerView
      ? (couple?.partner2Name || 'Fulana')
      : (couple?.partner1Name || 'Josef')
    : (user?.displayName || 'Você');

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        couple,
        loading,
        isDemo,
        demoPartnerView,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        updateProfileName,
        deleteCoupleSpace,
        deleteUserAccount,
        createCoupleSpace,
        joinCoupleSpace,
        updateCoupleInfo,
        startDemoMode,
        toggleDemoPartner,
        currentUserId,
        currentUserName,
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
