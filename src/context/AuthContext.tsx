import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  arrayUnion,
  arrayRemove,
  runTransaction,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, sanitizeFirestorePayload, testConnection } from '../firebase';
import { Couple, UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  couple: Couple | null; // active space for backward compatibility
  spaces: Couple[]; // all spaces of current user (max 3 slots)
  activeSpaceId: string | null;
  loading: boolean;
  isDemo: boolean;
  demoPartnerView: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  selectSpace: (spaceId: string) => void;
  clearActiveSpace: () => void;
  fetchUserSpaces: () => Promise<Couple[]>;
  leaveOrDeleteSpace: (spaceId: string) => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
  deleteCoupleSpace: () => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  createCoupleSpace: (spaceName?: string) => Promise<string>;
  joinCoupleSpace: (code: string) => Promise<boolean>;
  updateCoupleInfo: (data: Partial<Couple>) => Promise<void>;
  startDemoMode: (initialCode?: string, startInLobby?: boolean) => void;
  toggleDemoPartner: () => void;
  currentUserId: string;
  currentUserName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'nosso_espaco_demo_state';
const ACTIVE_SPACE_STORAGE_KEY = 'nosso_active_space_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [spaces, setSpaces] = useState<Couple[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_SPACE_STORAGE_KEY);
  });
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [demoPartnerView, setDemoPartnerView] = useState<boolean>(false);

  const activeCoupleUnsubRef = useRef<(() => void) | null>(null);

  // Test Firebase connection once on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Fetch all spaces for a given user UID (combining members, spaceIds, partner1, partner2)
  const fetchSpacesForUser = useCallback(async (uid: string, userDocData?: UserProfile): Promise<Couple[]> => {
    try {
      const spaceMap = new Map<string, Couple>();

      // Concurrently query by members, partner1Id, and partner2Id
      const qMembers = query(collection(db, 'couples'), where('members', 'array-contains', uid));
      const qP1 = query(collection(db, 'couples'), where('partner1Id', '==', uid));
      const qP2 = query(collection(db, 'couples'), where('partner2Id', '==', uid));

      const [resMembers, resP1, resP2] = await Promise.allSettled([
        getDocs(qMembers),
        getDocs(qP1),
        getDocs(qP2),
      ]);

      if (resMembers.status === 'fulfilled') {
        resMembers.value.forEach((d) => {
          spaceMap.set(d.id, { id: d.id, ...(d.data() as Omit<Couple, 'id'>) });
        });
      }
      if (resP1.status === 'fulfilled') {
        resP1.value.forEach((d) => {
          spaceMap.set(d.id, { id: d.id, ...(d.data() as Omit<Couple, 'id'>) });
        });
      }
      if (resP2.status === 'fulfilled') {
        resP2.value.forEach((d) => {
          spaceMap.set(d.id, { id: d.id, ...(d.data() as Omit<Couple, 'id'>) });
        });
      }

      // Check explicit spaceIds in user document if any are missing
      if (userDocData?.spaceIds && Array.isArray(userDocData.spaceIds)) {
        const missingIds = userDocData.spaceIds.filter((sId) => !spaceMap.has(sId));
        if (missingIds.length > 0) {
          const docSnaps = await Promise.allSettled(
            missingIds.map((sId) => getDoc(doc(db, 'couples', sId)))
          );
          docSnaps.forEach((res) => {
            if (res.status === 'fulfilled' && res.value.exists()) {
              spaceMap.set(res.value.id, { id: res.value.id, ...(res.value.data() as Omit<Couple, 'id'>) });
            }
          });
        }
      }

      const list = Array.from(spaceMap.values()).slice(0, 3);
      setSpaces(list);
      return list;
    } catch (error) {
      console.error('Error fetching user spaces:', error);
      return [];
    }
  }, []);

  // Listen to the active couple document
  const listenToCouple = useCallback((spaceId: string) => {
    if (activeCoupleUnsubRef.current) {
      activeCoupleUnsubRef.current();
      activeCoupleUnsubRef.current = null;
    }

    const unsub = onSnapshot(
      doc(db, 'couples', spaceId),
      (docSnap) => {
        if (docSnap.exists()) {
          const cData = { id: docSnap.id, ...(docSnap.data() as Omit<Couple, 'id'>) };
          setCouple(cData);
          // also sync into spaces array
          setSpaces((prev) => {
            const index = prev.findIndex((s) => s.id === spaceId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = cData;
              return updated;
            }
            return [...prev, cData].slice(0, 3);
          });
        } else {
          setCouple(null);
          setActiveSpaceId(null);
          localStorage.removeItem(ACTIVE_SPACE_STORAGE_KEY);
        }
      },
      (error) => {
        console.warn('Couple snapshot listener error:', error);
      }
    );

    activeCoupleUnsubRef.current = unsub;
    return unsub;
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
              email: fbUser.email?.toLowerCase() || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Parceiro(a)',
              photoURL: fbUser.photoURL || undefined,
              spaceIds: [],
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, userProfile);
          }
          setUser(userProfile);

          // Fetch all spaces for user (max 3)
          const userSpaces = await fetchSpacesForUser(fbUser.uid, userProfile);

          // Resolve active space if explicitly stored in current session
          const savedActiveId = localStorage.getItem(ACTIVE_SPACE_STORAGE_KEY);
          let targetSpace: Couple | undefined;

          if (savedActiveId) {
            targetSpace = userSpaces.find((s) => s.id === savedActiveId);
          }

          // If valid targetSpace stored, listen to it; otherwise leave activeSpaceId null to show SpaceSelection lobby
          if (targetSpace) {
            setActiveSpaceId(targetSpace.id);
            localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, targetSpace.id);
            listenToCouple(targetSpace.id);
          } else {
            setActiveSpaceId(null);
            setCouple(null);
            localStorage.removeItem(ACTIVE_SPACE_STORAGE_KEY);
          }
        } catch (err) {
          console.error('Error fetching user profile & spaces:', err);
        } finally {
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
            setSpaces(parsed.spaces || (parsed.couple ? [parsed.couple] : []));
            setCouple(parsed.couple);
            setActiveSpaceId(parsed.couple?.id || null);
          } catch {
            setUser(null);
            setSpaces([]);
            setCouple(null);
            setActiveSpaceId(null);
          }
        } else {
          setUser(null);
          setSpaces([]);
          setCouple(null);
          setActiveSpaceId(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (activeCoupleUnsubRef.current) {
        activeCoupleUnsubRef.current();
      }
    };
  }, [fetchSpacesForUser, listenToCouple]);

  // Select a space from the Lobby/Slots screen
  const selectSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, spaceId);

    if (isDemo) {
      const found = spaces.find((s) => s.id === spaceId);
      if (found) {
        setCouple(found);
        localStorage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify({ user, spaces, couple: found })
        );
      }
      return;
    }

    listenToCouple(spaceId);
  };

  // Return to Lobby / Slots screen
  const clearActiveSpace = () => {
    if (activeCoupleUnsubRef.current) {
      activeCoupleUnsubRef.current();
      activeCoupleUnsubRef.current = null;
    }
    setActiveSpaceId(null);
    setCouple(null);
    localStorage.removeItem(ACTIVE_SPACE_STORAGE_KEY);

    if (isDemo) {
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ user, spaces, couple: null })
      );
    }
  };

  const fetchUserSpaces = async (): Promise<Couple[]> => {
    if (isDemo) {
      return spaces;
    }
    if (!user) return [];
    return fetchSpacesForUser(user.uid, user);
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
          email: fbUser.email?.toLowerCase() || '',
          displayName: fbUser.displayName || 'Parceiro(a)',
          photoURL: fbUser.photoURL || undefined,
          spaceIds: [],
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
      spaceIds: [],
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
    if (activeCoupleUnsubRef.current) {
      activeCoupleUnsubRef.current();
      activeCoupleUnsubRef.current = null;
    }
    if (isDemo) {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_SPACE_STORAGE_KEY);
      setIsDemo(false);
      setUser(null);
      setSpaces([]);
      setCouple(null);
      setActiveSpaceId(null);
      return;
    }
    await fbSignOut(auth);
    localStorage.removeItem(ACTIVE_SPACE_STORAGE_KEY);
    setUser(null);
    setSpaces([]);
    setCouple(null);
    setActiveSpaceId(null);
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
        const updatedSpaces = spaces.map((s) => (s.id === updatedCouple?.id ? updatedCouple : s));
        setUser(updatedUser);
        setCouple(updatedCouple);
        setSpaces(updatedSpaces);
        localStorage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify({ user: updatedUser, spaces: updatedSpaces, couple: updatedCouple })
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

  const leaveOrDeleteSpace = async (spaceId: string) => {
    if (isDemo) {
      const remainingSpaces = spaces.filter((s) => s.id !== spaceId);
      setSpaces(remainingSpaces);
      if (couple?.id === spaceId) {
        setCouple(null);
        setActiveSpaceId(null);
      }
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({
          user,
          spaces: remainingSpaces,
          couple: couple?.id === spaceId ? null : couple,
        })
      );
      return;
    }

    if (!user) return;

    try {
      const spaceDocRef = doc(db, 'couples', spaceId);
      const spaceSnap = await getDoc(spaceDocRef);

      if (spaceSnap.exists()) {
        const spaceData = spaceSnap.data() as Couple;
        const currentMembers = spaceData.members || [];
        const otherMembers = currentMembers.filter((m) => m !== user.uid);

        // If only 1 member left (or user is only partner), delete space
        if (
          otherMembers.length === 0 ||
          (!spaceData.partner2Id && spaceData.partner1Id === user.uid)
        ) {
          await deleteDoc(spaceDocRef);
        } else {
          // Remove user from space members
          const isPartner1 = spaceData.partner1Id === user.uid;
          await updateDoc(spaceDocRef, {
            members: arrayRemove(user.uid),
            [isPartner1 ? 'partner1Id' : 'partner2Id']: '',
            [isPartner1 ? 'partner1Name' : 'partner2Name']: 'Parceiro desconectado',
          });
        }
      }

      // Update user document spaceIds
      await updateDoc(doc(db, 'users', user.uid), {
        spaceIds: arrayRemove(spaceId),
      });

      // Clear active space if was active
      if (couple?.id === spaceId || activeSpaceId === spaceId) {
        clearActiveSpace();
      }

      // Clean up local cache keys for this space
      try {
        localStorage.removeItem(`nosso_events_${spaceId}`);
        localStorage.removeItem(`nosso_media_${spaceId}`);
        localStorage.removeItem(`nosso_custom_themes_${spaceId}`);
        localStorage.removeItem(`nosso_custom_questions_${spaceId}`);
      } catch {
        // ignore
      }

      await fetchSpacesForUser(user.uid, user);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `couples/${spaceId}`);
      throw error;
    }
  };

  const deleteCoupleSpace = async () => {
    if (couple) {
      await leaveOrDeleteSpace(couple.id);
    }
  };

  const deleteUserAccount = async () => {
    if (isDemo) {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setIsDemo(false);
      setUser(null);
      setSpaces([]);
      setCouple(null);
      return;
    }

    if (!user || !auth.currentUser) return;

    try {
      const uid = user.uid;
      // Leave all spaces
      for (const sp of spaces) {
        try {
          await leaveOrDeleteSpace(sp.id);
        } catch {
          // non-blocking
        }
      }

      // Delete user document in Firestore
      await deleteDoc(doc(db, 'users', uid));

      // Delete Firebase Auth User
      await deleteUser(auth.currentUser);

      setUser(null);
      setSpaces([]);
      setCouple(null);
      setActiveSpaceId(null);
    } catch (error) {
      console.error('Account deletion error:', error);
      throw error;
    }
  };

  // Generate clean readable code with high entropy like NOSSO-7K9P
  const generateCode = (): string => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `NOSSO-${code}`;
  };

  const createCoupleSpace = async (spaceName?: string): Promise<string> => {
    // ENFORCE LIMIT: Max 3 spaces per user
    if (spaces.length >= 3) {
      throw new Error('Limite máximo de 3 espaços atingido. Exclua ou saia de um espaço para criar outro.');
    }

    const code = generateCode();

    if (isDemo || !user) {
      const demoCoupleId = `couple-${Date.now()}`;
      const newCouple: Couple = {
        id: demoCoupleId,
        code,
        members: [user?.uid || 'user-1'],
        partner1Id: user?.uid || 'user-1',
        partner1Name: user?.displayName || 'Você',
        partner2Id: undefined,
        partner2Name: undefined,
        spaceName: spaceName || `Espaço #${spaces.length + 1}`,
        createdAt: new Date().toISOString(),
      };

      const updatedSpaces = [...spaces, newCouple].slice(0, 3);
      setSpaces(updatedSpaces);
      setCouple(newCouple);
      setActiveSpaceId(demoCoupleId);
      localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, demoCoupleId);
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ user, spaces: updatedSpaces, couple: newCouple })
      );
      return code;
    }

    try {
      const coupleRef = doc(collection(db, 'couples'));
      const newCouple: Couple = {
        id: coupleRef.id,
        code,
        members: [user.uid],
        partner1Id: user.uid,
        partner1Name: user.displayName,
        spaceName: spaceName || `Espaço de ${user.displayName}`,
        createdAt: new Date().toISOString(),
      };

      await setDoc(coupleRef, sanitizeFirestorePayload(newCouple));
      await setDoc(
        doc(db, 'users', user.uid),
        {
          spaceIds: arrayUnion(coupleRef.id),
        },
        { merge: true }
      );

      const updatedSpaces = [...spaces, newCouple].slice(0, 3);
      setSpaces(updatedSpaces);
      setUser((prev) =>
        prev
          ? {
              ...prev,
              spaceIds: [...(prev.spaceIds || []), coupleRef.id],
            }
          : null
      );

      selectSpace(coupleRef.id);
      return code;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'couples');
      throw error;
    }
  };

  const joinCoupleSpace = async (code: string): Promise<boolean> => {
    // ENFORCE LIMIT: Max 3 spaces per user
    if (spaces.length >= 3) {
      throw new Error('Limite máximo de 3 espaços atingido. Exclua ou saia de um espaço para entrar em outro.');
    }

    const cleanCode = code.trim().toUpperCase();

    if (isDemo || !user) {
      const demoCoupleId = `couple-joined-${cleanCode}`;
      const newCouple: Couple = {
        id: demoCoupleId,
        code: cleanCode,
        members: ['user-partner', user?.uid || 'user-me'],
        partner1Id: 'user-partner',
        partner1Name: 'Parceiro(a)',
        partner2Id: user?.uid || 'user-me',
        partner2Name: user?.displayName || 'Você',
        spaceName: `Espaço ${cleanCode}`,
        createdAt: new Date().toISOString(),
      };

      const updatedSpaces = [...spaces, newCouple].slice(0, 3);
      setSpaces(updatedSpaces);
      setCouple(newCouple);
      setActiveSpaceId(demoCoupleId);
      localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, demoCoupleId);
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ user, spaces: updatedSpaces, couple: newCouple })
      );
      return true;
    }

    try {
      const q = query(collection(db, 'couples'), where('code', '==', cleanCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return false;
      }

      const coupleDoc = querySnapshot.docs[0];

      // Execute join atomically with transaction to prevent race conditions
      await runTransaction(db, async (transaction) => {
        const spaceDocRef = doc(db, 'couples', coupleDoc.id);
        const userDocRef = doc(db, 'users', user.uid);

        // All reads MUST be executed before all writes in Firestore transactions
        const currentSnap = await transaction.get(spaceDocRef);
        const userSnap = await transaction.get(userDocRef);

        if (!currentSnap.exists()) {
          throw new Error('Espaço não encontrado.');
        }

        const data = currentSnap.data() as Couple;
        const members = data.members || [];

        // Already a member
        if (
          members.includes(user.uid) ||
          data.partner1Id === user.uid ||
          data.partner2Id === user.uid
        ) {
          return;
        }

        // Space full check
        if (members.length >= 2 || (data.partner2Id && data.partner2Id !== '')) {
          throw new Error('Este espaço já possui 2 participantes.');
        }

        const partner1Id = data.partner1Id || members[0] || '';
        const initialMembers = [partner1Id, ...members, user.uid].filter((m): m is string => Boolean(m));
        const updatedMembers = Array.from(new Set(initialMembers));

        // Writes start here
        transaction.update(spaceDocRef, {
          partner2Id: user.uid,
          partner2Name: user.displayName || 'Parceiro(a)',
          members: updatedMembers,
        });

        if (userSnap.exists()) {
          transaction.update(userDocRef, {
            spaceIds: arrayUnion(coupleDoc.id),
          });
        } else {
          transaction.set(
            userDocRef,
            {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Parceiro(a)',
              spaceIds: [coupleDoc.id],
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      });

      setUser((prev) =>
        prev
          ? {
              ...prev,
              spaceIds: [...(prev.spaceIds || []), coupleDoc.id],
            }
          : null
      );

      await fetchSpacesForUser(user.uid, user);
      selectSpace(coupleDoc.id);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('participantes')) {
        throw error;
      }
      console.error('Erro ao conectar ao espaço:', error);
      handleFirestoreError(error, OperationType.UPDATE, `couples/${cleanCode}`);
      return false;
    }
  };

  const updateCoupleInfo = async (data: Partial<Couple>) => {
    if (!couple) return;

    if (isDemo) {
      const updated = { ...couple, ...data };
      const updatedSpaces = spaces.map((s) => (s.id === couple.id ? updated : s));
      setCouple(updated);
      setSpaces(updatedSpaces);
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ user, spaces: updatedSpaces, couple: updated })
      );
      return;
    }

    try {
      await updateDoc(doc(db, 'couples', couple.id), sanitizeFirestorePayload(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `couples/${couple.id}`);
    }
  };

  // Instant Demo Mode for immediate testing
  const startDemoMode = (initialCode?: string, startInLobby: boolean = false) => {
    const code = initialCode || 'DEMO-PAR';
    const demoUser: UserProfile = {
      uid: 'user-demo-1',
      email: 'josef@nossoespaco.app',
      displayName: 'Josef',
      spaceIds: ['couple-demo-1'],
      partnerName: 'Fulana',
      createdAt: new Date().toISOString(),
    };
    const demoCouple: Couple = {
      id: 'couple-demo-1',
      code: code,
      members: ['user-demo-1', 'user-demo-2'],
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
    setSpaces([demoCouple]);

    if (startInLobby) {
      setCouple(null);
      setActiveSpaceId(null);
      localStorage.removeItem(ACTIVE_SPACE_STORAGE_KEY);
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ user: demoUser, spaces: [demoCouple], couple: null })
      );
    } else {
      setCouple(demoCouple);
      setActiveSpaceId('couple-demo-1');
      localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, 'couple-demo-1');
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ user: demoUser, spaces: [demoCouple], couple: demoCouple })
      );
    }
  };

  const toggleDemoPartner = () => {
    setDemoPartnerView((prev) => !prev);
  };

  // Resolve current active identity
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
        spaces,
        activeSpaceId,
        loading,
        isDemo,
        demoPartnerView,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        selectSpace,
        clearActiveSpace,
        fetchUserSpaces,
        leaveOrDeleteSpace,
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
