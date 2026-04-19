import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Error handling interface
export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export const handleFirestoreError = (error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) => {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email || '',
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || ''
    }))
  } : {
    userId: 'unauthenticated',
    email: '',
    emailVerified: false,
    isAnonymous: false,
    providerInfo: []
  };

  const errorInfo: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore error',
    operationType,
    path,
    authInfo
  };

  console.error("Firestore Error:", errorInfo);
  throw new Error(JSON.stringify(errorInfo));
};

// Database specific functions
export const syncUserProfile = async (user: any) => {
    const userRef = doc(db, 'users', user.uid);
    try {
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } else {
            await updateDoc(userRef, {
                displayName: user.displayName,
                photoURL: user.photoURL,
                updatedAt: serverTimestamp()
            });
        }
    } catch (err) {
        handleFirestoreError(err, 'write', `users/${user.uid}`);
    }
};

export const saveCareerDiscovery = async (userId: string, answers: any, report: any) => {
    const docRef = doc(db, 'users', userId, 'careerDiscovery', 'latest');
    try {
        await setDoc(docRef, {
            userId,
            answers,
            report,
            createdAt: serverTimestamp()
        });
    } catch (err) {
        handleFirestoreError(err, 'write', `users/${userId}/careerDiscovery/latest`);
    }
};

export const getLatestCareerDiscovery = async (userId: string) => {
    const docRef = doc(db, 'users', userId, 'careerDiscovery', 'latest');
    try {
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (err) {
        handleFirestoreError(err, 'get', `users/${userId}/careerDiscovery/latest`);
    }
};

export const savePrepAssessment = async (userId: string, data: { role: string, domain: string, level: string, results: any, finalReport: any }) => {
    // We'll use a role-based ID or a timestamp
    const assessmentId = `${data.role.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    const docRef = doc(db, 'users', userId, 'prepAssessments', assessmentId);
    try {
        await setDoc(docRef, {
            ...data,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return assessmentId;
    } catch (err) {
        handleFirestoreError(err, 'create', `users/${userId}/prepAssessments/${assessmentId}`);
    }
};

export const getPrepAssessmentHistory = async (userId: string) => {
    const collRef = collection(db, 'users', userId, 'prepAssessments');
    const q = query(collRef, where("userId", "==", userId)); // Redundant but safe for future indexing
    try {
        const querySnapshot = await getDocs(collRef);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        handleFirestoreError(err, 'list', `users/${userId}/prepAssessments`);
    }
};

export const getCareerDiscoveryHistory = async (userId: string) => {
    const collRef = collection(db, 'users', userId, 'careerDiscovery');
    try {
        const querySnapshot = await getDocs(collRef);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        handleFirestoreError(err, 'list', `users/${userId}/careerDiscovery`);
    }
};
