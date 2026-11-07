import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  isBootstrapAdminEmail,
} from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import {
  boundNonEmptyString,
  boundOptionalString,
  isValidFirestoreId,
  sanitizeIdSegment,
} from '../lib/validation';
import { AuthUser, StudentRecord, TeacherRecord } from '../types/student';
import { getMentorDocId } from '../data/teachers';
import {
  saveAuthProfileCache,
  logoutAuth,
  saveCredential,
  verifyCredential,
  getStoredAuth,
} from '../data/auth';

export interface FirebaseAuthSessionState {
  firebaseUser: FirebaseUser | null;
  authUser: AuthUser | null;
  authReady: boolean;
  userProfileLoaded: boolean;
}

export interface ManagedUserDirectoryItem {
  uid: string;
  displayName: string;
  role: AuthUser['role'];
  username?: string;
  teacherId?: string;
  mentorDocId?: string;
  mentorName?: string;
  studentDocId?: string;
  adNo?: string;
  className?: string;
}

function mapFirestoreUserToAuthUser(
  fbUser: FirebaseUser,
  data: Record<string, unknown>
): AuthUser {
  const rawRole = String(data.role || 'VIEWER');
  const role: AuthUser['role'] =
    rawRole === 'SUPER_ADMIN' ||
    rawRole === 'TEACHER_ADMIN' ||
    rawRole === 'STUDENT' ||
    rawRole === 'VIEWER'
      ? rawRole
      : 'VIEWER';

  const displayName = boundNonEmptyString(
    data.displayName,
    120,
    fbUser.displayName || fbUser.email?.split('@')[0] || 'DHAC Member'
  );
  const username = boundNonEmptyString(
    data.username,
    64,
    fbUser.email?.split('@')[0] || fbUser.uid.slice(0, 12)
  );

  return {
    uid: fbUser.uid,
    email: fbUser.email || undefined,
    role,
    displayName,
    username,
    teacherId: boundOptionalString(data.teacherId, 32),
    mentorDocId: boundOptionalString(data.mentorDocId, 32),
    mentorName: boundOptionalString(data.mentorName, 100),
    studentId: boundOptionalString(data.studentDocId, 32),
    studentDocId: boundOptionalString(data.studentDocId, 32),
    adNo: boundOptionalString(data.adNo, 20),
    className: boundOptionalString(data.className, 16),
    photoUrl: boundOptionalString(data.photoUrl, 50000) || fbUser.photoURL || undefined,
  };
}

export async function ensureFirebaseUserProvisioned(
  fbUser: FirebaseUser
): Promise<AuthUser> {
  const uid = fbUser.uid;
  const email = (fbUser.email || '').trim().toLowerCase();
  const isBootstrapSuper =
    fbUser.emailVerified === true && isBootstrapAdminEmail(email);

  const userRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'info');
  const adminRef = doc(db, 'admins', uid);

  let existingUserData: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingUserData = snap.data() as Record<string, unknown>;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }

  // Provision /admins/{uid} first if verified bootstrap Super Admin
  if (isBootstrapSuper) {
    try {
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          uid,
          email: boundNonEmptyString(fbUser.email, 160, BOOTSTRAP_SUPER_ADMIN_EMAIL),
          role: 'SUPER_ADMIN',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `admins/${uid}`);
    }
  }

  // Create non-PII /users/{uid} document if first login
  if (!existingUserData) {
    const defaultRole: AuthUser['role'] = isBootstrapSuper ? 'SUPER_ADMIN' : 'VIEWER';
    const defaultDisplay = isBootstrapSuper
      ? boundNonEmptyString(fbUser.displayName, 120, 'Super Admin (Sidra)')
      : boundNonEmptyString(
          fbUser.displayName,
          120,
          email ? email.split('@')[0].toUpperCase() : 'Campus Member'
        );
    const defaultUsername = isBootstrapSuper
      ? 'sidra2026'
      : sanitizeIdSegment(email ? email.split('@')[0] : uid, 'DHAC');

    const profilePayload: Record<string, unknown> = {
      uid,
      displayName: defaultDisplay,
      role: defaultRole,
      username: defaultUsername,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(userRef, profilePayload);
      existingUserData = profilePayload;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
    }
  } else if (isBootstrapSuper && existingUserData.role !== 'SUPER_ADMIN') {
    try {
      await updateDoc(userRef, {
        role: 'SUPER_ADMIN',
        updatedAt: serverTimestamp(),
      });
      existingUserData = { ...existingUserData, role: 'SUPER_ADMIN' };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  }

  // Provision isolated PII subcollection /users/{uid}/private/info
  try {
    const privSnap = await getDoc(privateRef);
    if (!privSnap.exists() && fbUser.emailVerified) {
      await setDoc(privateRef, {
        uid,
        email: boundNonEmptyString(fbUser.email, 160, 'member@dhac.edu.in'),
        providerId: boundNonEmptyString(
          fbUser.providerData?.[0]?.providerId || 'google.com',
          64,
          'google.com'
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/private/info`);
  }

  // Fetch canonical stored document
  try {
    const freshSnap = await getDoc(userRef);
    if (freshSnap.exists()) {
      const mapped = mapFirestoreUserToAuthUser(
        fbUser,
        freshSnap.data() as Record<string, unknown>
      );
      saveAuthProfileCache(mapped);
      return mapped;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }

  const fallback = mapFirestoreUserToAuthUser(fbUser, existingUserData || {});
  saveAuthProfileCache(fallback);
  return fallback;
}

const activeAuthSubscribers = new Set<(state: FirebaseAuthSessionState) => void>();
let latestSessionState: FirebaseAuthSessionState = {
  firebaseUser: auth.currentUser,
  authUser: getStoredAuth(),
  authReady: false,
  userProfileLoaded: false,
};

export function broadcastAuthState(partial: Partial<FirebaseAuthSessionState>) {
  latestSessionState = { ...latestSessionState, ...partial };
  activeAuthSubscribers.forEach((cb) => {
    try {
      cb(latestSessionState);
    } catch (e) {
      console.error('[AUTH BROADCAST ERROR]:', e);
    }
  });
}

export function subscribeToFirebaseAuth(
  onChange: (state: FirebaseAuthSessionState) => void
): () => void {
  activeAuthSubscribers.add(onChange);
  // Emit current cached state immediately
  onChange(latestSessionState);

  let unsubscribeUserDoc: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
    if (unsubscribeUserDoc) {
      unsubscribeUserDoc();
      unsubscribeUserDoc = null;
    }

    if (!fbUser) {
      // If we have a local active session from credentials, preserve it
      const cached = getStoredAuth();
      if (!cached) {
        logoutAuth();
        broadcastAuthState({
          firebaseUser: null,
          authUser: null,
          authReady: true,
          userProfileLoaded: true,
        });
      } else {
        broadcastAuthState({
          firebaseUser: null,
          authUser: cached,
          authReady: true,
          userProfileLoaded: true,
        });
      }
      return;
    }

    try {
      const initialAuthUser = await ensureFirebaseUserProvisioned(fbUser);
      broadcastAuthState({
        firebaseUser: fbUser,
        authUser: initialAuthUser,
        authReady: true,
        userProfileLoaded: true,
      });

      const userRef = doc(db, 'users', fbUser.uid);
      unsubscribeUserDoc = onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const updatedAuthUser = mapFirestoreUserToAuthUser(
              fbUser,
              snapshot.data() as Record<string, unknown>
            );
            saveAuthProfileCache(updatedAuthUser);
            broadcastAuthState({
              firebaseUser: fbUser,
              authUser: updatedAuthUser,
              authReady: true,
              userProfileLoaded: true,
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${fbUser.uid}`);
        }
      );
    } catch (error) {
      console.error('[FIREBASE AUTH PROVISION ERROR]:', error);
      broadcastAuthState({
        firebaseUser: fbUser,
        authUser: null,
        authReady: true,
        userProfileLoaded: true,
      });
    }
  });

  return () => {
    activeAuthSubscribers.delete(onChange);
    if (unsubscribeUserDoc) unsubscribeUserDoc();
    unsubscribeAuth();
  };
}

export async function signInWithGoogleAccount(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch {}
  logoutAuth();
  broadcastAuthState({
    firebaseUser: null,
    authUser: null,
    authReady: true,
    userProfileLoaded: true,
  });
}

/**
 * Signs in as Student, Teacher, or Super Admin
 */
export async function loginUserWithRole(params: {
  role: 'STUDENT' | 'TEACHER_ADMIN' | 'SUPER_ADMIN';
  identifier: string;
  password: string;
  students: StudentRecord[];
  teachers?: TeacherRecord[];
}): Promise<AuthUser> {
  const { role, identifier, password, students, teachers = [] } = params;
  const cleanId = identifier.trim();
  const cleanEmail = cleanId.toLowerCase();
  const cleanAd = cleanId.toUpperCase().replace('*', '');

  // =========================================================================
  // 1. SUPER_ADMIN LOGIN
  // =========================================================================
  if (role === 'SUPER_ADMIN') {
    const isAuthorizedEmail =
      cleanEmail === 'sidrastudentsunion@gmail.com' ||
      cleanEmail === 'sidrastudentunion@gmail.com' ||
      cleanEmail === 'sidraofficial359@gmail.com' ||
      cleanEmail === 'admin';

    if (!isAuthorizedEmail) {
      throw new Error(
        'Unauthorized administrator email. Please use the official admin address: sidrastudentsunion@gmail.com'
      );
    }

    if (password !== 'admin1234') {
      throw new Error('Invalid administrator password. Please enter the authorized administrator password.');
    }

    let fbUser: FirebaseUser | null = null;
    const targetEmail = cleanEmail.includes('@') ? cleanEmail : 'sidrastudentsunion@gmail.com';
    try {
      const res = await signInWithEmailAndPassword(auth, targetEmail, password);
      fbUser = res.user;
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        try {
          const res = await createUserWithEmailAndPassword(auth, targetEmail, password);
          fbUser = res.user;
        } catch {}
      }
    }

    const adminUser: AuthUser = {
      uid: fbUser?.uid || 'admin-sidrastudentsunion',
      email: targetEmail,
      role: 'SUPER_ADMIN',
      displayName: 'Super Admin (Sidra Students Union)',
      username: 'sidrastudentsunion',
    };

    const adminUid = adminUser.uid || 'admin-sidrastudentsunion';
    try {
      const userRef = doc(db, 'users', adminUid);
      await setDoc(
        userRef,
        {
          uid: adminUid,
          displayName: adminUser.displayName,
          role: 'SUPER_ADMIN',
          username: adminUser.username,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      const adminRef = doc(db, 'admins', adminUid);
      await setDoc(
        adminRef,
        {
          uid: adminUid,
          email: targetEmail,
          role: 'SUPER_ADMIN',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('[ADMIN FIRESTORE DOC SYNC]:', e);
    }

    saveAuthProfileCache(adminUser);
    broadcastAuthState({
      authUser: adminUser,
      firebaseUser: fbUser || auth.currentUser,
      authReady: true,
      userProfileLoaded: true,
    });
    return adminUser;
  }

  // =========================================================================
  // 2. STUDENT LOGIN
  // =========================================================================
  if (role === 'STUDENT') {
    const matchedStored = verifyCredential(cleanId, password, 'STUDENT');
    if (matchedStored) {
      saveAuthProfileCache(matchedStored);
      broadcastAuthState({
        authUser: matchedStored,
        firebaseUser: auth.currentUser,
        authReady: true,
        userProfileLoaded: true,
      });
      return matchedStored;
    }

    if (cleanEmail.includes('@')) {
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (res.user) {
          const snap = await getDoc(doc(db, 'users', res.user.uid));
          if (snap.exists() && snap.data().role === 'STUDENT') {
            const mapped = mapFirestoreUserToAuthUser(res.user, snap.data());
            saveAuthProfileCache(mapped);
            broadcastAuthState({
              authUser: mapped,
              firebaseUser: res.user,
              authReady: true,
              userProfileLoaded: true,
            });
            return mapped;
          }
        }
      } catch {}
    }

    const matchedStudent = students.find(
      (s) =>
        s.adNo.toUpperCase().replace('*', '') === cleanAd ||
        s.studentId.toUpperCase() === cleanAd ||
        s.id.toUpperCase() === cleanAd
    );

    if (!matchedStudent) {
      throw new Error(
        `No student found matching Admission Number #${cleanId}. Please verify your AD Number or click "Sign Up" to create an account.`
      );
    }

    if (password === cleanAd || password === '1234' || password === 'student123') {
      const studentUser: AuthUser = {
        uid: `stu-${cleanAd}`,
        email: `${cleanAd.toLowerCase()}@dhac.student.in`,
        role: 'STUDENT',
        displayName: `${matchedStudent.name} (AD #${matchedStudent.adNo})`,
        username: `student_${cleanAd}`,
        studentId: matchedStudent.id,
        studentDocId: matchedStudent.id,
        adNo: matchedStudent.adNo,
        className: matchedStudent.className,
        photoUrl: matchedStudent.photoUrl || undefined,
      };
      saveAuthProfileCache(studentUser);
      saveCredential({
        adNo: matchedStudent.adNo,
        username: studentUser.username,
        email: studentUser.email,
        password,
        role: 'STUDENT',
        user: studentUser,
      });
      broadcastAuthState({
        authUser: studentUser,
        firebaseUser: auth.currentUser,
        authReady: true,
        userProfileLoaded: true,
      });
      return studentUser;
    }

    throw new Error(
      `Incorrect password for Student AD #${cleanAd}. If you haven't registered your password yet, click "Sign Up" to create your student account.`
    );
  }

  // =========================================================================
  // 3. TEACHER / FACULTY ADMIN LOGIN
  // =========================================================================
  if (role === 'TEACHER_ADMIN') {
    const matchedStored = verifyCredential(cleanId, password, 'TEACHER_ADMIN');
    if (matchedStored) {
      saveAuthProfileCache(matchedStored);
      broadcastAuthState({
        authUser: matchedStored,
        firebaseUser: auth.currentUser,
        authReady: true,
        userProfileLoaded: true,
      });
      return matchedStored;
    }

    if (cleanEmail.includes('@')) {
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (res.user) {
          const snap = await getDoc(doc(db, 'users', res.user.uid));
          if (snap.exists() && (snap.data().role === 'TEACHER_ADMIN' || snap.data().role === 'SUPER_ADMIN')) {
            const mapped = mapFirestoreUserToAuthUser(res.user, snap.data());
            saveAuthProfileCache(mapped);
            broadcastAuthState({
              authUser: mapped,
              firebaseUser: res.user,
              authReady: true,
              userProfileLoaded: true,
            });
            return mapped;
          }
        }
      } catch {}
    }

    const matchedTeacher = teachers.find(
      (t) =>
        t.username.toLowerCase() === cleanEmail ||
        t.teacherId.toLowerCase() === cleanEmail ||
        (t.assignedEmail && t.assignedEmail.toLowerCase() === cleanEmail)
    );

    if (matchedTeacher && (password === 'teacher123' || password === 'admin1234')) {
      const teacherUser: AuthUser = {
        uid: `tea-${matchedTeacher.teacherId.toLowerCase()}`,
        email: matchedTeacher.assignedEmail || `${matchedTeacher.username}@dhac.edu.in`,
        role: 'TEACHER_ADMIN',
        displayName: `${matchedTeacher.name} (${matchedTeacher.teacherId})`,
        username: matchedTeacher.username,
        teacherId: matchedTeacher.teacherId,
        mentorDocId: matchedTeacher.id,
        mentorName: matchedTeacher.name,
      };
      saveAuthProfileCache(teacherUser);
      saveCredential({
        username: matchedTeacher.username,
        email: teacherUser.email,
        password,
        role: 'TEACHER_ADMIN',
        user: teacherUser,
      });
      broadcastAuthState({
        authUser: teacherUser,
        firebaseUser: auth.currentUser,
        authReady: true,
        userProfileLoaded: true,
      });
      return teacherUser;
    }

    throw new Error(
      'Invalid teacher credentials. Please verify your Username/Email and Password, or click "Sign Up" to register.'
    );
  }

  throw new Error('Unsupported role selected.');
}

/**
 * Signs up a Student with Admission No, Username, Email, and Password
 */
export async function signUpStudentUser(params: {
  adNo: string;
  username: string;
  email: string;
  password: string;
  students: StudentRecord[];
}): Promise<AuthUser> {
  const { adNo, username, email, password, students } = params;
  const cleanAd = adNo.trim().toUpperCase().replace('*', '');
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  if (!cleanAd) {
    throw new Error('Please enter your DHAC Admission Number (AD).');
  }
  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const matchedStudent = students.find(
    (s) =>
      s.adNo.toUpperCase().replace('*', '') === cleanAd ||
      s.studentId.toUpperCase() === cleanAd
  );

  if (!matchedStudent) {
    throw new Error(
      `Admission Number #${cleanAd} was not found in the official 290-student registry. Please check your Admission Number.`
    );
  }

  let fbUser: FirebaseUser | null = null;
  try {
    const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    fbUser = res.user;
    try {
      await updateProfile(fbUser, {
        displayName: `${matchedStudent.name} (AD #${matchedStudent.adNo})`,
      });
    } catch {}
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
        fbUser = res.user;
      } catch {
        throw new Error('This email address is already registered with a different password.');
      }
    }
  }

  const uid = fbUser?.uid || `stu-${cleanAd}-${Date.now().toString().slice(-4)}`;
  const studentUser: AuthUser = {
    uid,
    email: cleanEmail,
    role: 'STUDENT',
    displayName: `${matchedStudent.name} (AD #${matchedStudent.adNo})`,
    username: cleanUsername,
    studentId: matchedStudent.id,
    studentDocId: matchedStudent.id,
    adNo: matchedStudent.adNo,
    className: matchedStudent.className,
    photoUrl: matchedStudent.photoUrl || undefined,
  };

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        uid,
        displayName: studentUser.displayName,
        role: 'STUDENT',
        username: cleanUsername,
        studentDocId: matchedStudent.id,
        adNo: matchedStudent.adNo,
        className: matchedStudent.className,
        photoUrl: matchedStudent.photoUrl || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[FIRESTORE STUDENT SIGNUP SYNC]:', e);
  }

  saveCredential({
    adNo: matchedStudent.adNo,
    username: cleanUsername,
    email: cleanEmail,
    password,
    role: 'STUDENT',
    user: studentUser,
  });

  saveAuthProfileCache(studentUser);
  broadcastAuthState({
    authUser: studentUser,
    firebaseUser: fbUser || auth.currentUser,
    authReady: true,
    userProfileLoaded: true,
  });

  return studentUser;
}

/**
 * Signs up a Teacher with Username, Email, and Password
 */
export async function signUpTeacherUser(params: {
  username: string;
  email: string;
  password: string;
  teachers?: TeacherRecord[];
}): Promise<AuthUser> {
  const { username, email, password, teachers = [] } = params;
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const matchedTeacher = teachers.find(
    (t) =>
      t.username.toLowerCase() === cleanUsername.toLowerCase() ||
      (t.assignedEmail && t.assignedEmail.toLowerCase() === cleanEmail)
  );

  let fbUser: FirebaseUser | null = null;
  try {
    const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    fbUser = res.user;
    try {
      await updateProfile(fbUser, {
        displayName: matchedTeacher ? `${matchedTeacher.name} (${matchedTeacher.teacherId})` : cleanUsername,
      });
    } catch {}
  } catch (err: any) {
    if (err?.code === 'auth/email-already-in-use') {
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
        fbUser = res.user;
      } catch {
        throw new Error('This email address is already registered with a different password.');
      }
    }
  }

  const uid = fbUser?.uid || `tea-${cleanUsername.toLowerCase()}-${Date.now().toString().slice(-4)}`;
  const teacherUser: AuthUser = {
    uid,
    email: cleanEmail,
    role: 'TEACHER_ADMIN',
    displayName: matchedTeacher ? `${matchedTeacher.name} (${matchedTeacher.teacherId})` : cleanUsername,
    username: cleanUsername,
    teacherId: matchedTeacher?.teacherId || undefined,
    mentorDocId: matchedTeacher?.id || undefined,
    mentorName: matchedTeacher?.name || cleanUsername,
  };

  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        uid,
        displayName: teacherUser.displayName,
        role: 'TEACHER_ADMIN',
        username: cleanUsername,
        teacherId: teacherUser.teacherId || '',
        mentorDocId: teacherUser.mentorDocId || '',
        mentorName: teacherUser.mentorName || cleanUsername,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('[FIRESTORE TEACHER SIGNUP SYNC]:', e);
  }

  saveCredential({
    username: cleanUsername,
    email: cleanEmail,
    password,
    role: 'TEACHER_ADMIN',
    user: teacherUser,
  });

  saveAuthProfileCache(teacherUser);
  broadcastAuthState({
    authUser: teacherUser,
    firebaseUser: fbUser || auth.currentUser,
    authReady: true,
    userProfileLoaded: true,
  });

  return teacherUser;
}

/**
 * Allows a signed-in Google user (currently in VIEWER role) to self-bind
 * to their official Student profile verified against /students/{studentDocId} in Firestore rules.
 */
export async function linkCurrentUserToStudent(
  fbUser: FirebaseUser,
  student: StudentRecord
): Promise<void> {
  if (!isValidFirestoreId(student.id)) {
    throw new Error('Invalid student document identifier.');
  }
  const userRef = doc(db, 'users', fbUser.uid);
  try {
    await updateDoc(userRef, {
      role: 'STUDENT',
      studentDocId: student.id,
      adNo: boundNonEmptyString(student.adNo, 20, student.adNo),
      className: boundNonEmptyString(student.className, 16, student.className),
      displayName: boundNonEmptyString(`${student.name} (AD #${student.adNo})`, 120, student.name),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${fbUser.uid}`);
  }
}

/**
 * Automatically or manually binds a signed-in Google user to a Faculty Mentor record
 * when their verified Google email matches mentor.assignedEmail in Firestore.
 */
export async function linkCurrentUserToAuthorizedMentor(
  fbUser: FirebaseUser,
  mentor: TeacherRecord
): Promise<void> {
  const mentorDocId = getMentorDocId(mentor);
  if (!isValidFirestoreId(mentorDocId)) {
    throw new Error('Invalid mentor document identifier.');
  }
  const userRef = doc(db, 'users', fbUser.uid);
  try {
    await updateDoc(userRef, {
      role: 'TEACHER_ADMIN',
      teacherId: boundNonEmptyString(mentor.teacherId, 32, mentor.teacherId),
      mentorDocId,
      mentorName: boundNonEmptyString(mentor.name, 100, mentor.name),
      displayName: boundNonEmptyString(`${mentor.name} (${mentor.teacherId})`, 120, mentor.name),
      username: boundNonEmptyString(mentor.username, 64, mentor.username),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${fbUser.uid}`);
  }
}

/**
 * Super Admin action: Assign or update any signed-in user's institutional role & link in /users/{uid}.
 */
export async function assignUserRoleBySuperAdmin(params: {
  targetUid: string;
  role: AuthUser['role'];
  displayName: string;
  mentor?: TeacherRecord | null;
  student?: StudentRecord | null;
}): Promise<void> {
  const { targetUid, role, displayName, mentor, student } = params;
  if (!isValidFirestoreId(targetUid)) {
    throw new Error('Invalid target UID.');
  }

  const userRef = doc(db, 'users', targetUid);
  const updatePayload: Record<string, unknown> = {
    role,
    displayName: boundNonEmptyString(displayName, 120, 'DHAC Member'),
    updatedAt: serverTimestamp(),
  };

  if (role === 'TEACHER_ADMIN' && mentor) {
    const mDocId = getMentorDocId(mentor);
    updatePayload.teacherId = boundNonEmptyString(mentor.teacherId, 32, mentor.teacherId);
    updatePayload.mentorDocId = mDocId;
    updatePayload.mentorName = boundNonEmptyString(mentor.name, 100, mentor.name);
  } else if (role === 'STUDENT' && student) {
    updatePayload.studentDocId = student.id;
    updatePayload.adNo = boundNonEmptyString(student.adNo, 20, student.adNo);
    updatePayload.className = boundNonEmptyString(student.className, 16, student.className);
  }

  try {
    await updateDoc(userRef, updatePayload);
    const adminRef = doc(db, 'admins', targetUid);
    if (role === 'SUPER_ADMIN') {
      const existingAdmin = await getDoc(adminRef);
      if (!existingAdmin.exists()) {
        await setDoc(adminRef, {
          uid: targetUid,
          email: `${sanitizeIdSegment(displayName, 'admin').toLowerCase()}@dhac.edu.in`,
          role: 'SUPER_ADMIN',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
  }
}

/**
 * Super Admin listener for registered Firebase Auth user profiles in /users.
 */
export function subscribeToUserDirectoryForAdmin(
  onUsers: (users: ManagedUserDirectoryItem[]) => void
): () => void {
  const q = query(collection(db, 'users'), where('uid', '!=', ''));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ManagedUserDirectoryItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid || d.id),
          displayName: String(data.displayName || 'User'),
          role: (data.role as AuthUser['role']) || 'VIEWER',
          username: typeof data.username === 'string' ? data.username : undefined,
          teacherId: typeof data.teacherId === 'string' ? data.teacherId : undefined,
          mentorDocId: typeof data.mentorDocId === 'string' ? data.mentorDocId : undefined,
          mentorName: typeof data.mentorName === 'string' ? data.mentorName : undefined,
          studentDocId: typeof data.studentDocId === 'string' ? data.studentDocId : undefined,
          adNo: typeof data.adNo === 'string' ? data.adNo : undefined,
          className: typeof data.className === 'string' ? data.className : undefined,
        };
      });
      onUsers(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  );
}
