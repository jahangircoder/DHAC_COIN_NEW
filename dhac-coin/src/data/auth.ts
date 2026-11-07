import { AuthUser } from '../types/student';
import { BOOTSTRAP_SUPER_ADMIN_EMAIL } from '../lib/firebase';

const AUTH_STORAGE_KEY = 'dhac_firebase_auth_profile_v1';

export { BOOTSTRAP_SUPER_ADMIN_EMAIL };

export function saveAuthProfileCache(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // storage unavailable
  }
}

export function getStoredAuth(): AuthUser | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AuthUser;
    }
  } catch {
    // ignore
  }
  return null;
}

export function logoutAuth(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('dhac_auth_user_session_v4');
    localStorage.removeItem('dhac_custom_passwords_v2');
  } catch {
    // ignore
  }
}

const CREDENTIALS_STORAGE_KEY = 'dhac_local_credentials_v1';

export interface StoredCredential {
  email?: string;
  username?: string;
  adNo?: string;
  password: string;
  role: AuthUser['role'];
  user: AuthUser;
}

export function getStoredCredentials(): StoredCredential[] {
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveCredential(cred: StoredCredential): void {
  try {
    const all = getStoredCredentials();
    const filtered = all.filter(
      (c) =>
        (cred.email && c.email?.toLowerCase() === cred.email.toLowerCase()) ||
        (cred.username && c.username?.toLowerCase() === cred.username.toLowerCase()) ||
        (cred.adNo && c.adNo === cred.adNo)
    );
    const updated = [
      ...all.filter(
        (c) =>
          !(
            (cred.email && c.email?.toLowerCase() === cred.email.toLowerCase()) ||
            (cred.username && c.username?.toLowerCase() === cred.username.toLowerCase()) ||
            (cred.adNo && c.adNo === cred.adNo)
          )
      ),
      cred,
    ];
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function verifyCredential(
  identifier: string,
  password: string,
  role?: AuthUser['role']
): AuthUser | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanAd = identifier.trim().toUpperCase().replace('*', '');

  // 1. Check Super Admin hardcoded official credentials
  if (
    (cleanId === 'sidrastudentsunion@gmail.com' ||
      cleanId === 'sidrastudentunion@gmail.com' ||
      cleanId === 'sidraofficial359@gmail.com' ||
      cleanId === 'admin') &&
    password === 'admin1234'
  ) {
    return {
      uid: 'admin-sidrastudentsunion',
      email: 'sidrastudentsunion@gmail.com',
      role: 'SUPER_ADMIN',
      displayName: 'Super Admin (Sidra Students Union)',
      username: 'sidrastudentsunion',
    };
  }

  // 2. Check saved credentials
  const all = getStoredCredentials();
  const matched = all.find((c) => {
    if (role && c.role !== role) return false;
    const matchesId =
      (c.email && c.email.toLowerCase() === cleanId) ||
      (c.username && c.username.toLowerCase() === cleanId) ||
      (c.adNo && (c.adNo === cleanAd || c.adNo.replace('*', '') === cleanAd));
    return matchesId && c.password === password;
  });

  return matched ? matched.user : null;
}
