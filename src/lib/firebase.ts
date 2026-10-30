import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Robust error handling helper for Firestore operations
 */
export function handleFirestoreError(error: unknown, operation: string) {
  const err = error as { code?: string; message?: string };
  console.error(`Firestore [${operation}] error:`, err.code, err.message);
  
  if (err.code === 'permission-denied') {
    return 'Access denied: You do not have cryptographic permission to access or modify this record.';
  } else if (err.code === 'unauthenticated') {
    return 'Authentication required: Please sign in to verify your cryptographic identity.';
  } else if (err.code === 'not-found') {
    return 'Record not found in the secure vault.';
  }
  return err.message || `An error occurred during ${operation}.`;
}

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
};
export type { User };
