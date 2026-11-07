import { auth, firebaseConfig } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function getQuotaUpgradeUrl(): string {
  return `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;
}

export function isQuotaExceededError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('Quota exceeded');
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const formattedError = rawMessage.includes('Quota exceeded')
    ? `${rawMessage} (Spark daily quota resets tomorrow. Manage or upgrade database at: ${getQuotaUpgradeUrl()})`
    : rawMessage;

  const errInfo: FirestoreErrorInfo = {
    error: formattedError,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function formatFirestoreErrorForUser(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  let innerMsg = raw;

  try {
    const parsed = JSON.parse(raw) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string') {
      innerMsg = parsed.error;
    }
  } catch {
    // plain string error
  }

  if (innerMsg.includes('Quota exceeded')) {
    return `Firestore daily Spark quota exceeded (resets next day). Upgrade database at: ${getQuotaUpgradeUrl()}`;
  }
  if (innerMsg.includes('Missing or insufficient permissions')) {
    return 'Permission denied by Firestore security rules. Please verify your signed-in role or contact Super Admin.';
  }
  return innerMsg || 'Unexpected Firestore operation error.';
}
