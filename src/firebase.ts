import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, arrayUnion, collection, getDocs, query, where, addDoc, serverTimestamp, orderBy, limit, deleteDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const signOut = () => auth.signOut();

export interface UserProfile {
    uid: string;
    email: string;
    userId: string;
    plan?: string;
    referralCode: string;
    referredBy?: string | null;
    credits: number;
    points: number;
    rank: string;
    streak: number;
    lastLoginDate: string;
    referralCount: number;
    completedTasks: string[];
    achievements: string[];
    dailyMissions: {
        [key: string]: {
            count: number;
            completed: boolean;
        };
    };
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    }
    return null;
};

export const createUserProfile = async (user: User, referredBy?: string): Promise<UserProfile> => {
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const userId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        userId,
        plan: 'Starter',
        referralCode,
        referredBy: referredBy || null,
        credits: 10000, // Starting credits
        points: 0,
        rank: 'Beginner',
        streak: 1,
        lastLoginDate: new Date().toISOString().split('T')[0],
        referralCount: 0,
        completedTasks: [],
        achievements: [],
        dailyMissions: {
            'design_3_thumbnails': { count: 0, completed: false },
            'use_title_gen': { count: 0, completed: false },
            'try_new_style': { count: 0, completed: false },
            'share_photo': { count: 0, completed: false }
        }
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    
    if (referredBy) {
        const referrerQuery = query(collection(db, 'users'), where('referralCode', '==', referredBy));
        const referrerSnap = await getDocs(referrerQuery);
        if (!referrerSnap.empty) {
            const referrerDoc = referrerSnap.docs[0];
            await updateDoc(referrerDoc.ref, {
                credits: increment(5),
                referralCount: increment(1),
                points: increment(100)
            });
        }
    }
    
    return profile;
};

export const addCredits = async (uid: string, amount: number, points: number = 0) => {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
        credits: increment(amount),
        points: increment(points)
    });
};

export const updateProgress = async (uid: string, missionKey: string, incrementValue: number = 1) => {
    const docRef = doc(db, 'users', uid);
    const profile = await getUserProfile(uid);
    if (!profile) return;

    const mission = profile.dailyMissions[missionKey];
    if (!mission || mission.completed) return;

    const newCount = mission.count + incrementValue;
    let completed = false;
    let reward = 0;
    let points = 0;

    // Mission thresholds
    if (missionKey === 'design_3_thumbnails' && newCount >= 3) { completed = true; reward = 5; points = 10; }
    if (missionKey === 'use_title_gen' && newCount >= 1) { completed = true; reward = 3; points = 5; }
    if (missionKey === 'try_new_style' && newCount >= 1) { completed = true; reward = 4; points = 8; }
    if (missionKey === 'share_photo' && newCount >= 1) { completed = true; reward = 6; points = 12; }

    await updateDoc(docRef, {
        [`dailyMissions.${missionKey}.count`]: newCount,
        [`dailyMissions.${missionKey}.completed`]: completed,
        credits: increment(completed ? reward : 0),
        points: increment(completed ? points : 0)
    });
};

// Custom Personas and Styles Management
export interface CustomItem {
    id: string;
    name: string;
    // For older compatibility or transient UI
    images?: string[]; 
    status?: 'PROCESSING' | 'READY';
    avatar?: string;
    stylePrompt?: string;

    // Vector Engine Specifics
    style_vector?: any; 
    embedding?: any;
    preview_url?: string;
}

export const getCustomPersonas = async (uid: string): Promise<CustomItem[]> => {
    const q = query(collection(db, `users/${uid}/customPersonas`));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomItem));
};

export const saveCustomPersona = async (uid: string, persona: CustomItem) => {
    const docRef = doc(db, `users/${uid}/customPersonas`, persona.id);
    await setDoc(docRef, persona);
};

export const deleteCustomPersona = async (uid: string, personaId: string) => {
    const docRef = doc(db, `users/${uid}/customPersonas`, personaId);
    await deleteDoc(docRef);
};

export const getCustomStyles = async (uid: string): Promise<CustomItem[]> => {
    const q = query(collection(db, `users/${uid}/customStyles`));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomItem));
};

export const saveCustomStyle = async (uid: string, style: CustomItem) => {
    const docRef = doc(db, `users/${uid}/customStyles`, style.id);
    await setDoc(docRef, style);
};

export const deleteCustomStyle = async (uid: string, styleId: string) => {
    const docRef = doc(db, `users/${uid}/customStyles`, styleId);
    await deleteDoc(docRef);
};

export const completeTask = async (uid: string, taskId: string, reward: number) => {
    const docRef = doc(db, 'users', uid);
    const profile = await getUserProfile(uid);
    if (profile && !profile.completedTasks.includes(taskId)) {
        await updateDoc(docRef, {
            credits: increment(reward),
            completedTasks: arrayUnion(taskId)
        });
        return true;
    }
    return false;
};

export const saveOptimization = async (uid: string, originalScore: number, newScore: number, promptUsed: string, explanation: string) => {
    const optimizationsRef = collection(db, 'optimizations');
    await addDoc(optimizationsRef, {
        uid,
        originalScore,
        newScore,
        improvement: newScore - originalScore,
        promptUsed,
        explanation,
        timestamp: serverTimestamp()
    });
};

export const getSuccessfulOptimizations = async (uid: string, limitCount: number = 3) => {
    const optimizationsRef = collection(db, 'optimizations');
    const q = query(
        optimizationsRef, 
        where('uid', '==', uid)
    );
    
    const querySnapshot = await getDocs(q);
    const results: any[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.improvement > 0) {
            results.push(data);
        }
    });
    
    // Sort in memory to avoid requiring a composite index in Firestore
    results.sort((a, b) => b.improvement - a.improvement);
    
    return results.slice(0, limitCount);
};
