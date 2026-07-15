import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  getIdTokenResult,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

export const auth = getAuth(app);

export type AppRole = 'admin' | 'registerer' | null;

export interface AppUser extends User {
  role: AppRole;
}

export async function getRole(user: User | null): Promise<AppRole> {
  if (!user) return null;
  try {
    const tokenResult = await getIdTokenResult(user);
    const role = (tokenResult.claims as any)?.role as AppRole | undefined;
    return role ?? null;
  } catch {
    return null;
  }
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  // Force token refresh so custom claims are immediately available
  await credential.user.getIdToken(true);
  return credential.user;
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { User };
