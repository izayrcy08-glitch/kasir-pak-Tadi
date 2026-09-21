import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from './config';

export async function masuk(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function keluar(): Promise<void> {
  await signOut(auth);
}

export function subscribeStatusAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
