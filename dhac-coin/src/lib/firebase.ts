import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

export const BOOTSTRAP_SUPER_ADMIN_EMAILS = [
  'sidrastudentsunion@gmail.com',
  'sidrastudentunion@gmail.com',
  'sidraofficial359@gmail.com',
];
export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'sidrastudentsunion@gmail.com';

export function isBootstrapAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return BOOTSTRAP_SUPER_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === normalized);
}

const app = initializeApp(firebaseConfig);
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Uploads a base64 or data URL image to Firebase Cloud Storage.
 * Falls back safely to compact data URL if Cloud Storage bucket is unavailable.
 */
export async function uploadImageToFirebaseStorage(
  storagePath: string,
  dataUrl: string
): Promise<string> {
  if (!firebaseConfig.storageBucket || !dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  try {
    const storageRef = ref(storage, storagePath);
    await uploadString(storageRef, dataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.warn(`[Firebase Storage]: Upload fallback for ${storagePath}:`, err);
    return dataUrl;
  }
}

export { app, firebaseConfig };

export type FirebaseConnectionState = 'checking' | 'connected' | 'offline' | 'quota_exceeded';

export async function testFirestoreConnection(): Promise<FirebaseConnectionState> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return 'connected';
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration.');
        return 'offline';
      }
      if (error.message.includes('Quota exceeded')) {
        console.error(
          `Firestore daily quota exceeded. Upgrade or inspect database at: https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`
        );
        return 'quota_exceeded';
      }
    }
    return 'offline';
  }
}

// Mandatory boot connectivity verification
void testFirestoreConnection();
