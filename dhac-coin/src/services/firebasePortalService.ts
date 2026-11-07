import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  WriteBatch,
} from 'firebase/firestore';
import {
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  isBootstrapAdminEmail,
  uploadImageToFirebaseStorage,
  db,
} from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import {
  boundInt,
  boundNonEmptyString,
  boundOptionalString,
  boundString,
  compressImageToCompactDataUrl,
  computeTierForCoins,
  isValidFirestoreId,
  VALIDATION_LIMITS,
} from '../lib/validation';
import {
  AuditLogEntry,
  AuthUser,
  CoinClaim,
  CoinTransaction,
  StudentRecord,
  TeacherRecord,
  UnionDefinition,
} from '../types/student';
import { CoinCategory } from '../data/coinRules';
import { getBatchName } from '../data/batchNames';
import { getMentorDocId } from '../data/teachers';
import { recalculateAllRanks } from '../data/studentParser';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function formatNowLabel(): string {
  return new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'medium' });
}

function buildStudentFirestoreCreateDoc(s: StudentRecord): Record<string, unknown> {
  const coins = boundInt(s.totalCoins, 0, 100000, 0);
  const tier = computeTierForCoins(coins);
  const adFlag = VALIDATION_LIMITS.student.adFlags.includes(s.adFlag) ? s.adFlag : 'VALID';
  const coinStatus =
    coins > 0
      ? 'CONFIRMED'
      : VALIDATION_LIMITS.student.coinStatuses.includes(s.coinStatus)
      ? s.coinStatus
      : 'ZERO';
  const rankStatus = VALIDATION_LIMITS.student.rankStatuses.includes(s.rankStatus)
    ? s.rankStatus
    : coins > 0
    ? 'OFFICIAL'
    : 'OFFICIAL';

  const payload: Record<string, unknown> = {
    id: s.id,
    studentId: s.id,
    officialId: boundNonEmptyString(
      s.officialId,
      VALIDATION_LIMITS.student.officialIdMax,
      `DHAC/ST/2026/${s.className}/${s.adNo}`
    ),
    adNo: boundNonEmptyString(s.adNo, VALIDATION_LIMITS.student.adNoMax, '000'),
    adFlag,
    name: boundNonEmptyString(s.name, VALIDATION_LIMITS.student.nameMax, 'STUDENT'),
    className: boundNonEmptyString(s.className, VALIDATION_LIMITS.student.classNameMax, 'S1A'),
    batchName: boundString(
      s.batchName || getBatchName(s.className),
      VALIDATION_LIMITS.student.batchNameMax
    ),
    mentorName: boundNonEmptyString(
      s.mentorName,
      VALIDATION_LIMITS.student.mentorNameMax,
      'FACULTY MENTOR'
    ),
    totalCoins: coins,
    coinStatus,
    mentorGroupRank: boundNonEmptyString(
      s.mentorGroupRank,
      VALIDATION_LIMITS.student.mentorGroupRankMax,
      '#1/1'
    ),
    mentorRankNum: boundInt(s.mentorRankNum, 1, 10000, 1),
    mentorGroupSize: boundInt(s.mentorGroupSize, 1, 10000, 1),
    classRank: boundNonEmptyString(s.classRank, VALIDATION_LIMITS.student.classRankMax, '#1'),
    classRankNum: boundInt(s.classRankNum, 1, 10000, 1),
    classSize: boundInt(s.classSize, 1, 10000, 1),
    campusRank: boundNonEmptyString(s.campusRank, VALIDATION_LIMITS.student.campusRankMax, '#1'),
    campusRankNum: boundInt(s.campusRankNum, 1, 10000, 1),
    campusTotalStudents: boundInt(s.campusTotalStudents, 1, 50000, 290),
    rankStatus,
    notes: boundString(s.notes || '', VALIDATION_LIMITS.student.notesMax),
    tier,
    isPublicCohort: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (s.photoUrl && s.photoUrl.trim().length > 0) {
    payload.photoUrl = boundString(s.photoUrl, VALIDATION_LIMITS.student.photoUrlMax);
  }
  if (s.linkedUid && isValidFirestoreId(s.linkedUid)) {
    payload.linkedUid = s.linkedUid;
  }
  if (s.studentEmail && s.studentEmail.trim().length > 0) {
    payload.studentEmail = boundString(s.studentEmail, VALIDATION_LIMITS.student.emailMax);
  }

  return payload;
}

function buildMentorFirestoreCreateDoc(t: TeacherRecord): Record<string, unknown> {
  const docId = getMentorDocId(t);
  const payload: Record<string, unknown> = {
    id: docId,
    serialNo: boundNonEmptyString(t.serialNo, VALIDATION_LIMITS.mentor.serialNoMax, '01'),
    teacherId: boundNonEmptyString(
      t.teacherId,
      VALIDATION_LIMITS.mentor.teacherIdMax,
      `DHAC/STAFF/${t.serialNo || '01'}`
    ),
    name: boundNonEmptyString(t.name, VALIDATION_LIMITS.mentor.nameMax, 'FACULTY MENTOR'),
    username: boundNonEmptyString(t.username, VALIDATION_LIMITS.mentor.usernameMax, 'STAFF.MENTOR'),
    isPublicDirectory: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (t.assignedEmail && t.assignedEmail.trim().length > 0) {
    payload.assignedEmail = boundString(
      t.assignedEmail.trim().toLowerCase(),
      VALIDATION_LIMITS.mentor.emailMax
    );
  }
  return payload;
}

function buildCompactPublicStudentSnapshot(s: StudentRecord): Record<string, unknown> {
  const coins = boundInt(s.totalCoins, 0, 100000, 0);
  return {
    id: s.id,
    studentId: s.id,
    officialId: boundNonEmptyString(s.officialId, 64, `DHAC/ST/2026/${s.className}/${s.adNo}`),
    adNo: boundNonEmptyString(s.adNo, 20, '000'),
    adFlag: s.adFlag,
    name: boundNonEmptyString(s.name, 120, 'STUDENT'),
    className: boundNonEmptyString(s.className, 16, 'S1A'),
    batchName: boundString(s.batchName || getBatchName(s.className), 48),
    mentorName: boundNonEmptyString(s.mentorName, 100, 'MENTOR'),
    totalCoins: coins,
    coinStatus: coins > 0 ? 'CONFIRMED' : s.coinStatus,
    mentorGroupRank: boundNonEmptyString(s.mentorGroupRank, 24, '#1/1'),
    mentorRankNum: boundInt(s.mentorRankNum, 1, 10000, 1),
    mentorGroupSize: boundInt(s.mentorGroupSize, 1, 10000, 1),
    classRank: boundNonEmptyString(s.classRank, 16, '#1'),
    classRankNum: boundInt(s.classRankNum, 1, 10000, 1),
    classSize: boundInt(s.classSize, 1, 10000, 1),
    campusRank: boundNonEmptyString(s.campusRank, 16, '#1'),
    campusRankNum: boundInt(s.campusRankNum, 1, 10000, 1),
    campusTotalStudents: boundInt(s.campusTotalStudents, 1, 50000, 290),
    rankStatus: s.rankStatus,
    notes: boundString(s.notes || '', 500),
    tier: computeTierForCoins(coins),
  };
}

function buildQueueItemMap(claim: CoinClaim, uid: string): Record<string, unknown> {
  const item: Record<string, unknown> = {
    id: claim.id,
    submittedByUid: claim.submittedByUid || uid,
    studentDocId: claim.studentDocId || claim.studentId,
    studentId: claim.studentId,
    studentName: boundNonEmptyString(claim.studentName, 120, 'STUDENT'),
    adNo: boundNonEmptyString(claim.adNo, 20, '000'),
    className: boundNonEmptyString(claim.className, 16, 'S1A'),
    mentorName: boundNonEmptyString(claim.mentorName, 100, 'MENTOR'),
    category: boundNonEmptyString(claim.category, 120, 'MERIT'),
    activityName: boundNonEmptyString(claim.activityName, 160, 'ACTIVITY'),
    coins: boundInt(claim.coins, 1, 500, 1),
    submittedAt: boundNonEmptyString(claim.submittedAt, 64, formatNowLabel()),
    status: claim.status,
  };
  if (claim.proofNotes) {
    item.proofNotes = boundString(claim.proofNotes, 1000);
  }
  if (claim.reviewedBy) {
    item.reviewedBy = boundString(claim.reviewedBy, 120);
  }
  if (claim.reviewedAt) {
    item.reviewedAt = boundString(claim.reviewedAt, 64);
  }
  if (claim.rejectionReason) {
    item.rejectionReason = boundString(claim.rejectionReason, 500);
  }
  return item;
}

function mapClaimDoc(id: string, data: Record<string, unknown>): CoinClaim {
  return {
    id: String(data.id || id),
    submittedByUid: boundOptionalString(data.submittedByUid, 128),
    studentDocId: boundOptionalString(data.studentDocId, 32),
    studentId: String(data.studentId || data.studentDocId || ''),
    studentName: String(data.studentName || ''),
    adNo: String(data.adNo || ''),
    className: String(data.className || ''),
    mentorName: String(data.mentorName || ''),
    category: String(data.category || ''),
    activityName: String(data.activityName || ''),
    coins: Number(data.coins || 0),
    proofNotes: boundOptionalString(data.proofNotes, 1000),
    submittedAt: String(data.submittedAt || ''),
    status: (data.status as CoinClaim['status']) || 'PENDING',
    reviewedBy: boundOptionalString(data.reviewedBy, 120),
    reviewedByUid: boundOptionalString(data.reviewedByUid, 128),
    reviewedAt: boundOptionalString(data.reviewedAt, 64),
    rejectionReason: boundOptionalString(data.rejectionReason, 500),
  };
}

function mapStudentDoc(id: string, data: Record<string, unknown>): StudentRecord {
  const totalCoins = Number(data.totalCoins || 0);
  return {
    id: String(data.id || id),
    studentId: String(data.studentId || id),
    officialId: String(data.officialId || `DHAC/ST/2026/${data.className}/${data.adNo}`),
    adNo: String(data.adNo || ''),
    adFlag: (data.adFlag as StudentRecord['adFlag']) || 'VALID',
    name: String(data.name || ''),
    className: String(data.className || ''),
    batchName: boundOptionalString(data.batchName, 48),
    mentorName: String(data.mentorName || ''),
    totalCoins,
    coinStatus: (data.coinStatus as StudentRecord['coinStatus']) || 'ZERO',
    mentorGroupRank: String(data.mentorGroupRank || '#1/1'),
    mentorRankNum: Number(data.mentorRankNum || 1),
    mentorGroupSize: Number(data.mentorGroupSize || 1),
    classRank: String(data.classRank || '#1'),
    classRankNum: Number(data.classRankNum || 1),
    classSize: Number(data.classSize || 1),
    campusRank: String(data.campusRank || '#1'),
    campusRankNum: Number(data.campusRankNum || 1),
    campusTotalStudents: Number(data.campusTotalStudents || 290),
    rankStatus: (data.rankStatus as StudentRecord['rankStatus']) || 'OFFICIAL',
    notes: String(data.notes || ''),
    tier: (data.tier as StudentRecord['tier']) || computeTierForCoins(totalCoins),
    photoUrl: boundOptionalString(data.photoUrl, 50000),
    linkedUid: boundOptionalString(data.linkedUid, 128),
    studentEmail: boundOptionalString(data.studentEmail, 160),
  };
}

async function addAuditEntryToBatch(
  batch: WriteBatch,
  params: {
    auditDocId: string;
    action: string;
    actorUid: string;
    actorName: string;
    targetPath: string;
    summary: string;
  }
) {
  batch.set(doc(db, 'audit_logs', params.auditDocId), {
    id: params.auditDocId,
    action: boundNonEmptyString(params.action, VALIDATION_LIMITS.audit.actionMax, 'PORTAL_EVENT'),
    actorUid: params.actorUid,
    actorName: boundNonEmptyString(params.actorName, VALIDATION_LIMITS.audit.actorNameMax, 'Actor'),
    targetPath: boundNonEmptyString(
      params.targetPath,
      VALIDATION_LIMITS.audit.targetPathMax,
      'portal'
    ),
    summary: boundNonEmptyString(
      params.summary,
      VALIDATION_LIMITS.audit.summaryMax,
      'Verified Firestore mutation'
    ),
    isAuditEntry: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function upsertPublicLeaderboardSummary(
  batch: WriteBatch,
  students: StudentRecord[],
  classAwards: Record<string, number>,
  actorUid: string,
  lastTxId: string,
  summaryNote: string
) {
  const ref = doc(db, 'public_views', 'leaderboard_summary');
  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
  } catch {
    exists = false;
  }

  const compactStudents = students.slice(0, 350).map(buildCompactPublicStudentSnapshot);
  const cleanClassAwards: Record<string, number> = {};
  for (const [k, v] of Object.entries(classAwards)) {
    if (isValidFirestoreId(k)) {
      cleanClassAwards[k] = boundInt(v, 0, 100000, 0);
    }
  }

  if (exists) {
    batch.update(ref, {
      classAwards: cleanClassAwards,
      topStudents: compactStudents,
      lastTxId: boundString(lastTxId, 64),
      summaryNote: boundString(summaryNote, 200),
      updatedByUid: actorUid,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(ref, {
      id: 'leaderboard_summary',
      isPublicView: true,
      classAwards: cleanClassAwards,
      topStudents: compactStudents,
      lastTxId: boundString(lastTxId, 64),
      summaryNote: boundString(summaryNote, 200),
      updatedByUid: actorUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

async function upsertPublicCatalogConfig(
  batch: WriteBatch,
  teachers: TeacherRecord[],
  coinCategories: CoinCategory[],
  unions: UnionDefinition[],
  actorUid: string,
  summaryNote: string
) {
  const ref = doc(db, 'public_views', 'catalog_config');
  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
  } catch {
    exists = false;
  }

  const cleanTeachers = teachers.slice(0, 100).map((t) => ({
    id: getMentorDocId(t),
    serialNo: t.serialNo,
    teacherId: t.teacherId,
    name: t.name,
    username: t.username,
  }));
  const cleanCategories = coinCategories.slice(0, 50).map((c) => ({
    id: c.id,
    categoryName: c.categoryName,
    ...(c.description ? { description: c.description } : {}),
    activities: c.activities.slice(0, 50),
  }));
  const cleanUnions = unions.slice(0, 30).map((u) => ({
    id: u.id,
    unionName: u.unionName,
    classes: u.classes.slice(0, 12),
    category: u.category || 'Secondary',
    ...(typeof u.isNoUnionBatch === 'boolean' ? { isNoUnionBatch: u.isNoUnionBatch } : {}),
  }));

  if (exists) {
    batch.update(ref, {
      teachers: cleanTeachers,
      coinCategories: cleanCategories,
      unions: cleanUnions,
      summaryNote: boundString(summaryNote, 200),
      updatedByUid: actorUid,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(ref, {
      id: 'catalog_config',
      isPublicView: true,
      teachers: cleanTeachers,
      coinCategories: cleanCategories,
      unions: cleanUnions,
      summaryNote: boundString(summaryNote, 200),
      updatedByUid: actorUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Idempotent one-time database seeding when an authorized Super Admin connects
 * and Firestore collections have not yet been initialized.
 */
export async function seedFirestoreDatabase(params: {
  fbUser?: FirebaseUser | null;
  students: StudentRecord[];
  teachers: TeacherRecord[];
  coinCategories: CoinCategory[];
  unions: UnionDefinition[];
  classAwards: Record<string, number>;
  forceReseed?: boolean;
}): Promise<{ seeded: boolean; count: number }> {
  const { fbUser, students, teachers, coinCategories, unions, classAwards, forceReseed } = params;

  if (!forceReseed) {
    try {
      const snap = await getDocFromServer(doc(db, 'public_views', 'leaderboard_summary'));
      if (snap.exists()) {
        return { seeded: false, count: 0 };
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'public_views/leaderboard_summary');
    }
  }

  const uid = fbUser?.uid || 'admin-sidrastudentsunion';
  const normalizedStudents = [...students];
  recalculateAllRanks(normalizedStudents);

  try {
    // 1. Seed students in chunks of 200
    const CHUNK = 200;
    for (let i = 0; i < normalizedStudents.length; i += CHUNK) {
      const slice = normalizedStudents.slice(i, i + CHUNK);
      const batch = writeBatch(db);
      for (const s of slice) {
        if (!isValidFirestoreId(s.id)) continue;
        batch.set(doc(db, 'students', s.id), buildStudentFirestoreCreateDoc(s));
      }
      await batch.commit();
    }

    // 2. Seed mentors, coin_categories, unions, class_awards, portal_queues, public_views & audit_log
    const metaBatch = writeBatch(db);

    for (const t of teachers) {
      const docId = getMentorDocId(t);
      if (!isValidFirestoreId(docId)) continue;
      metaBatch.set(doc(db, 'mentors', docId), buildMentorFirestoreCreateDoc(t));
    }

    coinCategories.forEach((cat, idx) => {
      if (!isValidFirestoreId(cat.id)) return;
      metaBatch.set(doc(db, 'coin_categories', cat.id), {
        id: cat.id,
        categoryName: boundNonEmptyString(cat.categoryName, 120, 'CATEGORY'),
        ...(cat.description ? { description: boundString(cat.description, 300) } : {}),
        sortOrder: idx,
        activities: cat.activities.slice(0, 50),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    for (const u of unions) {
      if (!isValidFirestoreId(u.id)) continue;
      metaBatch.set(doc(db, 'unions', u.id), {
        id: u.id,
        unionName: boundNonEmptyString(u.unionName, 80, 'UNION'),
        classes: u.classes.slice(0, 12),
        category: u.category || 'Secondary',
        ...(typeof u.isNoUnionBatch === 'boolean' ? { isNoUnionBatch: u.isNoUnionBatch } : {}),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const allClassNames = Array.from(
      new Set([
        'S1A', 'S1B', 'S2A', 'S2B', 'S3A', 'S3B', 'S4', 'S5', 'HS1', 'HS2', 'D1', 'D2',
        ...normalizedStudents.map((s) => s.className),
      ])
    );
    for (const cls of allClassNames) {
      if (!isValidFirestoreId(cls)) continue;
      metaBatch.set(doc(db, 'class_awards', cls), {
        className: cls,
        awardCoins: boundInt(classAwards[cls] || 0, 0, 100000, 0),
        isPublicStanding: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Seed empty pending_claims queue if not present
    const queueSnap = await getDoc(doc(db, 'portal_queues', 'pending_claims'));
    if (!queueSnap.exists()) {
      metaBatch.set(doc(db, 'portal_queues', 'pending_claims'), {
        id: 'pending_claims',
        items: [],
        lastClaimId: 'INIT-SEED-2026',
        totalCount: 0,
        updatedByUid: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await upsertPublicLeaderboardSummary(
      metaBatch,
      normalizedStudents,
      classAwards,
      uid,
      'INIT-SEED-2026',
      `Seeded ${normalizedStudents.length} DHAC student profiles`
    );

    await upsertPublicCatalogConfig(
      metaBatch,
      teachers,
      coinCategories,
      unions,
      uid,
      `Seeded ${teachers.length} mentors, ${coinCategories.length} categories, ${unions.length} unions`
    );

    await addAuditEntryToBatch(metaBatch, {
      auditDocId: makeId('AUD'),
      action: forceReseed ? 'COHORT_RESYNC' : 'INITIAL_FIRESTORE_SEED',
      actorUid: uid,
      actorName: boundNonEmptyString(fbUser?.displayName || 'Super Admin', 120, 'Super Admin'),
      targetPath: 'students',
      summary: `Initialized Firestore database with ${normalizedStudents.length} students and ${teachers.length} mentors.`,
    });

    await metaBatch.commit();
    return { seeded: true, count: normalizedStudents.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'students');
  }
}

/**
 * Attaches single-document public listeners (/public_views/leaderboard_summary & catalog_config)
 * for instant pre-login campus standings & rules rendering without open collection queries.
 */
export function subscribeToPublicPortalSnapshots(callbacks: {
  onStudentsSnapshot?: (students: StudentRecord[]) => void;
  onClassAwardsSnapshot?: (awards: Record<string, number>) => void;
  onTeachersSnapshot?: (teachers: TeacherRecord[]) => void;
  onCategoriesSnapshot?: (categories: CoinCategory[]) => void;
  onUnionsSnapshot?: (unions: UnionDefinition[]) => void;
}): () => void {
  const unsubSummary = onSnapshot(
    doc(db, 'public_views', 'leaderboard_summary'),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (Array.isArray(data.topStudents) && data.topStudents.length > 0 && callbacks.onStudentsSnapshot) {
        const mapped = data.topStudents.map((raw: any) =>
          mapStudentDoc(String(raw.id || raw.studentId), raw)
        );
        recalculateAllRanks(mapped);
        callbacks.onStudentsSnapshot(mapped);
      }
      if (data.classAwards && typeof data.classAwards === 'object' && callbacks.onClassAwardsSnapshot) {
        callbacks.onClassAwardsSnapshot(data.classAwards as Record<string, number>);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'public_views/leaderboard_summary');
    }
  );

  const unsubCatalog = onSnapshot(
    doc(db, 'public_views', 'catalog_config'),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (Array.isArray(data.teachers) && data.teachers.length > 0 && callbacks.onTeachersSnapshot) {
        callbacks.onTeachersSnapshot(data.teachers as TeacherRecord[]);
      }
      if (
        Array.isArray(data.coinCategories) &&
        data.coinCategories.length > 0 &&
        callbacks.onCategoriesSnapshot
      ) {
        callbacks.onCategoriesSnapshot(data.coinCategories as CoinCategory[]);
      }
      if (Array.isArray(data.unions) && data.unions.length > 0 && callbacks.onUnionsSnapshot) {
        callbacks.onUnionsSnapshot(data.unions as UnionDefinition[]);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'public_views/catalog_config');
    }
  );

  return () => {
    unsubSummary();
    unsubCatalog();
  };
}

/**
 * Attaches real-time Firestore collection & role-scoped queue listeners ONLY after auth is ready.
 */
export function subscribeToAuthenticatedPortalData(params: {
  firebaseUser: FirebaseUser;
  authUser: AuthUser | null;
  onStudents: (students: StudentRecord[]) => void;
  onMentors: (teachers: TeacherRecord[]) => void;
  onCategories: (categories: CoinCategory[]) => void;
  onUnions: (unions: UnionDefinition[]) => void;
  onClassAwards: (awards: Record<string, number>) => void;
  onTransactions: (txs: CoinTransaction[]) => void;
  onClaims: (claims: CoinClaim[]) => void;
  onAuditLogs?: (logs: AuditLogEntry[]) => void;
}): () => void {
  const {
    firebaseUser,
    authUser,
    onStudents,
    onMentors,
    onCategories,
    onUnions,
    onClassAwards,
    onTransactions,
    onClaims,
    onAuditLogs,
  } = params;

  const unsubs: Array<() => void> = [];

  // 1. Students cohort
  unsubs.push(
    onSnapshot(
      query(collection(db, 'students'), where('isPublicCohort', '==', true)),
      (snapshot) => {
        if (snapshot.empty) return;
        const list = snapshot.docs.map((d) => mapStudentDoc(d.id, d.data()));
        recalculateAllRanks(list);
        onStudents(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'students')
    )
  );

  // 2. Mentors directory
  unsubs.push(
    onSnapshot(
      query(collection(db, 'mentors'), where('isPublicDirectory', '==', true)),
      (snapshot) => {
        if (snapshot.empty) return;
        const list: TeacherRecord[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              serialNo: String(data.serialNo || '01'),
              teacherId: String(data.teacherId || 'DHAC/STAFF/01'),
              name: String(data.name || ''),
              username: String(data.username || ''),
              assignedEmail: boundOptionalString(data.assignedEmail, 160),
            };
          })
          .sort((a, b) => a.serialNo.localeCompare(b.serialNo));
        onMentors(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'mentors')
    )
  );

  // 3. Coin categories
  unsubs.push(
    onSnapshot(
      query(collection(db, 'coin_categories'), where('isActive', '==', true)),
      (snapshot) => {
        if (snapshot.empty) return;
        const list = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              categoryName: String(data.categoryName || ''),
              description: boundOptionalString(data.description, 300),
              activities: Array.isArray(data.activities) ? data.activities : [],
              sortOrder: Number(data.sortOrder || 0),
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(({ sortOrder: _so, ...rest }) => rest as CoinCategory);
        onCategories(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'coin_categories')
    )
  );

  // 4. Unions
  unsubs.push(
    onSnapshot(
      query(collection(db, 'unions'), where('isActive', '==', true)),
      (snapshot) => {
        if (snapshot.empty) return;
        const list: UnionDefinition[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            unionName: String(data.unionName || ''),
            classes: Array.isArray(data.classes) ? (data.classes as string[]) : [],
            category:
              (data.category as UnionDefinition['category']) || 'Secondary',
            isNoUnionBatch:
              typeof data.isNoUnionBatch === 'boolean' ? data.isNoUnionBatch : undefined,
          };
        });
        onUnions(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'unions')
    )
  );

  // 5. Class awards
  unsubs.push(
    onSnapshot(
      query(collection(db, 'class_awards'), where('isPublicStanding', '==', true)),
      (snapshot) => {
        if (snapshot.empty) return;
        const map: Record<string, number> = {};
        for (const d of snapshot.docs) {
          const data = d.data();
          map[String(data.className || d.id)] = Number(data.awardCoins || 0);
        }
        onClassAwards(map);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'class_awards')
    )
  );

  // 6. Official coin transactions ledger
  unsubs.push(
    onSnapshot(
      query(collection(db, 'coin_transactions'), where('isPublicLedger', '==', true)),
      (snapshot) => {
        const list: CoinTransaction[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            return {
              id: String(data.id || d.id),
              timestamp: String(data.timestamp || ''),
              targetType: (data.targetType as CoinTransaction['targetType']) || 'STUDENT',
              studentDocId: boundOptionalString(data.studentDocId, 32),
              studentId: boundOptionalString(data.studentId, 32),
              studentName: boundOptionalString(data.studentName, 120),
              adNo: boundOptionalString(data.adNo, 20),
              className: String(data.className || ''),
              category: String(data.category || ''),
              activityName: String(data.activityName || ''),
              coins: Number(data.coins || 0),
              awardedBy: String(data.awardedBy || ''),
              awardedByUid: boundOptionalString(data.awardedByUid, 128),
              notes: boundOptionalString(data.notes, 1000),
              createdAtMs:
                data.createdAt && typeof (data.createdAt as any).toMillis === 'function'
                  ? (data.createdAt as any).toMillis()
                  : 0,
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs || b.id.localeCompare(a.id))
          .map(({ createdAtMs: _ms, ...rest }) => rest);
        onTransactions(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'coin_transactions')
    )
  );

  // 7. Role-scoped Coin Claims listener
  const isBootstrapSuper =
    firebaseUser.emailVerified === true &&
    isBootstrapAdminEmail(firebaseUser.email);

  if (isBootstrapSuper) {
    unsubs.push(
      onSnapshot(
        query(collection(db, 'coin_claims'), where('facultyVisible', '==', true)),
        (snapshot) => {
          const list = snapshot.docs
            .map((d) => ({
              claim: mapClaimDoc(d.id, d.data()),
              ms:
                d.data().createdAt && typeof d.data().createdAt.toMillis === 'function'
                  ? d.data().createdAt.toMillis()
                  : 0,
            }))
            .sort((a, b) => b.ms - a.ms || b.claim.id.localeCompare(a.claim.id))
            .map((x) => x.claim);
          onClaims(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'coin_claims')
      )
    );

    if (onAuditLogs) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'audit_logs'), where('isAuditEntry', '==', true)),
          (snapshot) => {
            const logs: AuditLogEntry[] = snapshot.docs
              .map((d) => {
                const data = d.data();
                const ms =
                  data.createdAt && typeof data.createdAt.toMillis === 'function'
                    ? data.createdAt.toMillis()
                    : 0;
                return {
                  ms,
                  entry: {
                    id: String(data.id || d.id),
                    action: String(data.action || ''),
                    actorUid: String(data.actorUid || ''),
                    actorName: String(data.actorName || ''),
                    targetPath: String(data.targetPath || ''),
                    summary: String(data.summary || ''),
                    createdAtLabel: ms
                      ? new Date(ms).toLocaleString('en-US', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })
                      : undefined,
                  },
                };
              })
              .sort((a, b) => b.ms - a.ms)
              .map((x) => x.entry);
            onAuditLogs(logs);
          },
          (error) => handleFirestoreError(error, OperationType.LIST, 'audit_logs')
        )
      );
    }
  } else if (authUser?.role === 'TEACHER_ADMIN' || authUser?.role === 'SUPER_ADMIN') {
    // Faculty mentors read bounded queue document via single-doc get
    unsubs.push(
      onSnapshot(
        doc(db, 'portal_queues', 'pending_claims'),
        (snap) => {
          if (!snap.exists()) {
            onClaims([]);
            return;
          }
          const data = snap.data();
          const rawItems = Array.isArray(data.items) ? data.items : [];
          const list = rawItems.map((raw: any) => mapClaimDoc(String(raw.id || ''), raw));
          onClaims(list);
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'portal_queues/pending_claims')
      )
    );
  } else {
    // Students & Viewers list strictly their own submitted claims
    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'coin_claims'),
          where('submittedByUid', '==', firebaseUser.uid)
        ),
        (snapshot) => {
          const list = snapshot.docs
            .map((d) => ({
              claim: mapClaimDoc(d.id, d.data()),
              ms:
                d.data().createdAt && typeof d.data().createdAt.toMillis === 'function'
                  ? d.data().createdAt.toMillis()
                  : 0,
            }))
            .sort((a, b) => b.ms - a.ms || b.claim.id.localeCompare(a.claim.id))
            .map((x) => x.claim);
          onClaims(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'coin_claims')
      )
    );
  }

  return () => {
    for (const u of unsubs) {
      try {
        u();
      } catch {
        // ignore unsubscribe error
      }
    }
  };
}

/**
 * Atomic multi-document coin claim submission (/coin_claims + /portal_queues/pending_claims + /audit_logs).
 */
export async function submitCoinClaimInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  claimData: Omit<CoinClaim, 'id' | 'submittedAt' | 'status'>;
  targetStudent: StudentRecord;
}): Promise<CoinClaim> {
  const { fbUser, authUser, claimData, targetStudent } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'student-active';
  const actorName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    targetStudent.name
  );
  const claimId = makeId('CLM');
  const auditDocId = makeId('AUD');
  const submittedAt = formatNowLabel();
  const coins = boundInt(
    claimData.coins,
    VALIDATION_LIMITS.claim.minCoins,
    VALIDATION_LIMITS.claim.maxCoins,
    5
  );

  const newClaim: CoinClaim = {
    ...claimData,
    id: claimId,
    submittedByUid: actorUid,
    studentDocId: targetStudent.id,
    studentId: targetStudent.id,
    coins,
    submittedAt,
    status: 'PENDING',
  };

  try {
    const queueRef = doc(db, 'portal_queues', 'pending_claims');
    const queueSnap = await getDoc(queueRef);
    const existingItems: Record<string, unknown>[] =
      queueSnap.exists() && Array.isArray(queueSnap.data().items)
        ? (queueSnap.data().items as Record<string, unknown>[])
        : [];
    const existingPendingCount: number =
      queueSnap.exists() && typeof queueSnap.data().totalCount === 'number'
        ? Number(queueSnap.data().totalCount)
        : existingItems.filter((i) => i.status === 'PENDING').length;

    const newItemMap = buildQueueItemMap(newClaim, actorUid);
    const updatedItems = [...existingItems.slice(-99), newItemMap];
    const updatedPendingCount = Math.min(100, existingPendingCount + 1);

    const batch = writeBatch(db);

    const claimPayload: Record<string, unknown> = {
      id: claimId,
      submittedByUid: actorUid,
      studentDocId: targetStudent.id,
      studentId: targetStudent.id,
      studentName: boundNonEmptyString(targetStudent.name, 120, 'STUDENT'),
      adNo: boundNonEmptyString(targetStudent.adNo, 20, '000'),
      className: boundNonEmptyString(targetStudent.className, 16, 'S1A'),
      mentorName: boundNonEmptyString(targetStudent.mentorName, 100, 'MENTOR'),
      category: boundNonEmptyString(claimData.category, 120, 'MERIT'),
      activityName: boundNonEmptyString(claimData.activityName, 160, 'ACTIVITY'),
      coins,
      ...(claimData.proofNotes && claimData.proofNotes.trim()
        ? { proofNotes: boundString(claimData.proofNotes.trim(), 1000) }
        : {}),
      submittedAt,
      status: 'PENDING',
      auditDocId,
      facultyVisible: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    batch.set(doc(db, 'coin_claims', claimId), claimPayload);

    if (queueSnap.exists()) {
      batch.update(queueRef, {
        items: updatedItems,
        lastClaimId: claimId,
        totalCount: updatedPendingCount,
        updatedByUid: actorUid,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(queueRef, {
        id: 'pending_claims',
        items: updatedItems,
        lastClaimId: claimId,
        totalCount: updatedPendingCount,
        updatedByUid: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: 'CLAIM_SUBMITTED',
      actorUid,
      actorName,
      targetPath: `coin_claims/${claimId}`,
      summary: `Submitted +${coins} coins claim for ${targetStudent.name} (${claimData.activityName}).`,
    });

    await batch.commit();
    return newClaim;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `coin_claims/${claimId}`);
  }
}

/**
 * Atomic multi-document claim approval: transitions claim -> APPROVED, credits student balance & ranks,
 * records immutable transaction, updates faculty queue + public leaderboard summary, and writes audit log.
 */
export async function approveCoinClaimInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  claim: CoinClaim;
  allStudents: StudentRecord[];
  classAwards: Record<string, number>;
}): Promise<StudentRecord[]> {
  const { fbUser, authUser, claim, allStudents, classAwards } = params;
  const reviewerUid = fbUser?.uid || authUser?.uid || 'faculty-mentor';
  const reviewerName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Faculty Mentor'
  );
  const reviewedAt = formatNowLabel();
  const auditDocId = makeId('AUD');
  const txId = makeId('TX');
  const targetDocId = claim.studentDocId || claim.studentId;

  const updatedStudents = allStudents.map((s) => {
    if (s.id === targetDocId || s.studentId === claim.studentId || s.adNo === claim.adNo) {
      const nextCoins = boundInt((s.totalCoins || 0) + claim.coins, 0, 100000, claim.coins);
      return {
        ...s,
        totalCoins: nextCoins,
        coinStatus: 'CONFIRMED' as const,
        rankStatus: 'OFFICIAL' as const,
        tier: computeTierForCoins(nextCoins),
      };
    }
    return { ...s };
  });

  recalculateAllRanks(updatedStudents);
  const targetStudent =
    updatedStudents.find((s) => s.id === targetDocId || s.studentId === claim.studentId) ||
    updatedStudents[0];

  try {
    const queueRef = doc(db, 'portal_queues', 'pending_claims');
    const queueSnap = await getDoc(queueRef);
    const existingItems: Record<string, unknown>[] =
      queueSnap.exists() && Array.isArray(queueSnap.data().items)
        ? (queueSnap.data().items as Record<string, unknown>[])
        : [];

    let foundInQueue = false;
    const nextQueueItems = existingItems
      .map((item) => {
        if (item.id === claim.id) {
          foundInQueue = true;
          return {
            ...item,
            status: 'APPROVED',
            reviewedBy: reviewerName,
            reviewedAt,
          };
        }
        return item;
      })
      .slice(-85);

    if (!foundInQueue) {
      nextQueueItems.push(
        buildQueueItemMap(
          {
            ...claim,
            status: 'APPROVED',
            reviewedBy: reviewerName,
            reviewedAt,
          },
          reviewerUid
        )
      );
    }

    const pendingCount = Math.min(
      100,
      nextQueueItems.filter((item) => item.status === 'PENDING').length
    );

    const primaryBatch = writeBatch(db);

    // 1. Update claim status
    primaryBatch.update(doc(db, 'coin_claims', claim.id), {
      status: 'APPROVED',
      reviewedBy: reviewerName,
      reviewedByUid: reviewerUid,
      reviewedAt,
      auditDocId,
      updatedAt: serverTimestamp(),
    });

    // 2. Update target student
    primaryBatch.update(doc(db, 'students', targetStudent.id), {
      totalCoins: targetStudent.totalCoins,
      coinStatus: 'CONFIRMED',
      rankStatus: 'OFFICIAL',
      tier: computeTierForCoins(targetStudent.totalCoins),
      mentorGroupRank: targetStudent.mentorGroupRank,
      mentorRankNum: targetStudent.mentorRankNum,
      mentorGroupSize: targetStudent.mentorGroupSize,
      classRank: targetStudent.classRank,
      classRankNum: targetStudent.classRankNum,
      classSize: targetStudent.classSize,
      campusRank: targetStudent.campusRank,
      campusRankNum: targetStudent.campusRankNum,
      campusTotalStudents: targetStudent.campusTotalStudents,
      notes: boundString(targetStudent.notes || '', 500),
      updatedAt: serverTimestamp(),
    });

    // 3. Create immutable ledger transaction
    primaryBatch.set(doc(db, 'coin_transactions', txId), {
      id: txId,
      timestamp: reviewedAt,
      targetType: 'STUDENT',
      studentDocId: targetStudent.id,
      studentId: targetStudent.id,
      studentName: boundNonEmptyString(targetStudent.name, 120, 'STUDENT'),
      adNo: boundNonEmptyString(targetStudent.adNo, 20, '000'),
      className: boundNonEmptyString(targetStudent.className, 16, 'S1A'),
      category: boundNonEmptyString(claim.category, 120, 'MERIT'),
      activityName: boundNonEmptyString(claim.activityName, 160, 'ACTIVITY'),
      coins: boundInt(claim.coins, 1, 500, 1),
      awardedBy: boundNonEmptyString(`Confirmed by Mentor: ${reviewerName}`, 140, reviewerName),
      awardedByUid: reviewerUid,
      ...(claim.proofNotes ? { notes: boundString(claim.proofNotes, 1000) } : {}),
      auditDocId,
      isPublicLedger: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 4. Update faculty confirmation queue
    if (queueSnap.exists()) {
      primaryBatch.update(queueRef, {
        items: nextQueueItems.slice(-100),
        lastClaimId: claim.id,
        totalCount: pendingCount,
        updatedByUid: reviewerUid,
        updatedAt: serverTimestamp(),
      });
    } else {
      primaryBatch.set(queueRef, {
        id: 'pending_claims',
        items: nextQueueItems.slice(-100),
        lastClaimId: claim.id,
        totalCount: pendingCount,
        updatedByUid: reviewerUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Update public leaderboard summary
    await upsertPublicLeaderboardSummary(
      primaryBatch,
      updatedStudents,
      classAwards,
      reviewerUid,
      txId,
      `Credited +${claim.coins} coins to ${targetStudent.name}`
    );

    // 6. Append audit log
    await addAuditEntryToBatch(primaryBatch, {
      auditDocId,
      action: 'CLAIM_APPROVED',
      actorUid: reviewerUid,
      actorName: reviewerName,
      targetPath: `coin_claims/${claim.id}`,
      summary: `Approved claim ${claim.id}: +${claim.coins} coins credited to ${targetStudent.name}.`,
    });

    // Include up to 289 changed peer student rank updates in the same batch (well under 500 ops!)
    const prevById = new Map(allStudents.map((s) => [s.id, s]));
    const changedPeers = updatedStudents.filter((s) => {
      if (s.id === targetStudent.id) return false;
      const old = prevById.get(s.id);
      return (
        !old ||
        old.campusRankNum !== s.campusRankNum ||
        old.classRankNum !== s.classRankNum ||
        old.mentorRankNum !== s.mentorRankNum
      );
    });

    const firstSlice = changedPeers.slice(0, 290);
    for (const peer of firstSlice) {
      primaryBatch.update(doc(db, 'students', peer.id), {
        mentorGroupRank: peer.mentorGroupRank,
        mentorRankNum: peer.mentorRankNum,
        mentorGroupSize: peer.mentorGroupSize,
        classRank: peer.classRank,
        classRankNum: peer.classRankNum,
        classSize: peer.classSize,
        campusRank: peer.campusRank,
        campusRankNum: peer.campusRankNum,
        campusTotalStudents: peer.campusTotalStudents,
        updatedAt: serverTimestamp(),
      });
    }

    await primaryBatch.commit();

    // If campus ever exceeds 300 students, sync any overflow peer rank updates
    for (let i = 290; i < changedPeers.length; i += 250) {
      const overflowBatch = writeBatch(db);
      for (const peer of changedPeers.slice(i, i + 250)) {
        overflowBatch.update(doc(db, 'students', peer.id), {
          mentorGroupRank: peer.mentorGroupRank,
          mentorRankNum: peer.mentorRankNum,
          mentorGroupSize: peer.mentorGroupSize,
          classRank: peer.classRank,
          classRankNum: peer.classRankNum,
          classSize: peer.classSize,
          campusRank: peer.campusRank,
          campusRankNum: peer.campusRankNum,
          campusTotalStudents: peer.campusTotalStudents,
          updatedAt: serverTimestamp(),
        });
      }
      await overflowBatch.commit();
    }

    return updatedStudents;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `coin_claims/${claim.id}`);
  }
}

/**
 * Atomic claim rejection (/coin_claims + /portal_queues/pending_claims + /audit_logs).
 */
export async function rejectCoinClaimInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  claim: CoinClaim;
  reason?: string;
}): Promise<void> {
  const { fbUser, authUser, claim, reason } = params;
  const reviewerUid = fbUser?.uid || authUser?.uid || 'faculty-mentor';
  const reviewerName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Faculty Mentor'
  );
  const reviewedAt = formatNowLabel();
  const auditDocId = makeId('AUD');

  try {
    const queueRef = doc(db, 'portal_queues', 'pending_claims');
    const queueSnap = await getDoc(queueRef);
    const existingItems: Record<string, unknown>[] =
      queueSnap.exists() && Array.isArray(queueSnap.data().items)
        ? (queueSnap.data().items as Record<string, unknown>[])
        : [];

    let found = false;
    const nextQueueItems = existingItems
      .map((item) => {
        if (item.id === claim.id) {
          found = true;
          return {
            ...item,
            status: 'REJECTED',
            reviewedBy: reviewerName,
            reviewedAt,
            ...(reason ? { rejectionReason: boundString(reason, 500) } : {}),
          };
        }
        return item;
      })
      .slice(-85);

    if (!found) {
      nextQueueItems.push(
        buildQueueItemMap(
          {
            ...claim,
            status: 'REJECTED',
            reviewedBy: reviewerName,
            reviewedAt,
            rejectionReason: reason,
          },
          reviewerUid
        )
      );
    }

    const pendingCount = Math.min(
      100,
      nextQueueItems.filter((item) => item.status === 'PENDING').length
    );

    const batch = writeBatch(db);
    batch.update(doc(db, 'coin_claims', claim.id), {
      status: 'REJECTED',
      reviewedBy: reviewerName,
      reviewedByUid: reviewerUid,
      reviewedAt,
      ...(reason && reason.trim() ? { rejectionReason: boundString(reason.trim(), 500) } : {}),
      auditDocId,
      updatedAt: serverTimestamp(),
    });

    if (queueSnap.exists()) {
      batch.update(queueRef, {
        items: nextQueueItems.slice(-100),
        lastClaimId: claim.id,
        totalCount: pendingCount,
        updatedByUid: reviewerUid,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(queueRef, {
        id: 'pending_claims',
        items: nextQueueItems.slice(-100),
        lastClaimId: claim.id,
        totalCount: pendingCount,
        updatedByUid: reviewerUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: 'CLAIM_REJECTED',
      actorUid: reviewerUid,
      actorName: reviewerName,
      targetPath: `coin_claims/${claim.id}`,
      summary: `Rejected claim ${claim.id} for ${claim.studentName}.`,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `coin_claims/${claim.id}`);
  }
}

/**
 * Direct coin award by Admin or Faculty Mentor to an individual student OR an entire class batch.
 */
export async function awardCoinsInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  txData: Omit<CoinTransaction, 'id' | 'timestamp'>;
  allStudents: StudentRecord[];
  classAwards: Record<string, number>;
}): Promise<{ students: StudentRecord[]; classAwards: Record<string, number> }> {
  const { fbUser, authUser, txData, allStudents, classAwards } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'faculty-admin';
  const txId = makeId('TX');
  const auditDocId = makeId('AUD');
  const timestamp = formatNowLabel();
  const coins = boundInt(
    txData.coins,
    VALIDATION_LIMITS.tx.minCoins,
    VALIDATION_LIMITS.tx.maxCoins,
    5
  );
  const actorName = boundNonEmptyString(
    txData.awardedBy || authUser?.displayName || fbUser?.displayName,
    140,
    'Faculty Admin'
  );

  try {
    const primaryBatch = writeBatch(db);
    let nextStudents = [...allStudents];
    let nextClassAwards = { ...classAwards };
    let targetDocIdForTx: string | undefined = undefined;

    if (txData.targetType === 'STUDENT') {
      nextStudents = allStudents.map((s) => {
        if (s.id === txData.studentId || s.studentId === txData.studentId || s.adNo === txData.adNo) {
          const newTotal = boundInt((s.totalCoins || 0) + coins, 0, 100000, coins);
          return {
            ...s,
            totalCoins: newTotal,
            coinStatus: 'CONFIRMED' as const,
            rankStatus: 'OFFICIAL' as const,
            tier: computeTierForCoins(newTotal),
          };
        }
        return { ...s };
      });
      recalculateAllRanks(nextStudents);

      const targetStu = nextStudents.find(
        (s) => s.id === txData.studentId || s.studentId === txData.studentId || s.adNo === txData.adNo
      );
      if (!targetStu) {
        throw new Error('Target student not found.');
      }
      targetDocIdForTx = targetStu.id;

      primaryBatch.update(doc(db, 'students', targetStu.id), {
        totalCoins: targetStu.totalCoins,
        coinStatus: 'CONFIRMED',
        rankStatus: 'OFFICIAL',
        tier: computeTierForCoins(targetStu.totalCoins),
        mentorGroupRank: targetStu.mentorGroupRank,
        mentorRankNum: targetStu.mentorRankNum,
        mentorGroupSize: targetStu.mentorGroupSize,
        classRank: targetStu.classRank,
        classRankNum: targetStu.classRankNum,
        classSize: targetStu.classSize,
        campusRank: targetStu.campusRank,
        campusRankNum: targetStu.campusRankNum,
        campusTotalStudents: targetStu.campusTotalStudents,
        notes: boundString(targetStu.notes || '', 500),
        updatedAt: serverTimestamp(),
      });

      const prevById = new Map(allStudents.map((s) => [s.id, s]));
      const changedPeers = nextStudents.filter((peer) => {
        if (peer.id === targetStu.id) return false;
        const old = prevById.get(peer.id);
        return (
          !old ||
          old.campusRankNum !== peer.campusRankNum ||
          old.classRankNum !== peer.classRankNum ||
          old.mentorRankNum !== peer.mentorRankNum
        );
      });

      for (const peer of changedPeers.slice(0, 285)) {
        primaryBatch.update(doc(db, 'students', peer.id), {
          mentorGroupRank: peer.mentorGroupRank,
          mentorRankNum: peer.mentorRankNum,
          mentorGroupSize: peer.mentorGroupSize,
          classRank: peer.classRank,
          classRankNum: peer.classRankNum,
          classSize: peer.classSize,
          campusRank: peer.campusRank,
          campusRankNum: peer.campusRankNum,
          campusTotalStudents: peer.campusTotalStudents,
          updatedAt: serverTimestamp(),
        });
      }

      if (changedPeers.length > 285) {
        (primaryBatch as any).__overflowPeers = changedPeers.slice(285);
      }
    } else {
      const clsKey = boundNonEmptyString(txData.className, 16, 'S1A');
      const newAwardTotal = boundInt((classAwards[clsKey] || 0) + coins, 0, 100000, coins);
      nextClassAwards = { ...classAwards, [clsKey]: newAwardTotal };

      const classRef = doc(db, 'class_awards', clsKey);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        primaryBatch.update(classRef, {
          awardCoins: newAwardTotal,
          updatedAt: serverTimestamp(),
        });
      } else {
        primaryBatch.set(classRef, {
          className: clsKey,
          awardCoins: newAwardTotal,
          isPublicStanding: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    const txPayload: Record<string, unknown> = {
      id: txId,
      timestamp,
      targetType: txData.targetType,
      ...(targetDocIdForTx ? { studentDocId: targetDocIdForTx, studentId: targetDocIdForTx } : {}),
      ...(txData.studentName ? { studentName: boundString(txData.studentName, 120) } : {}),
      ...(txData.adNo ? { adNo: boundString(txData.adNo, 20) } : {}),
      className: boundNonEmptyString(txData.className, 16, 'S1A'),
      category: boundNonEmptyString(txData.category, 120, 'SPECIAL APPRECIATION'),
      activityName: boundNonEmptyString(txData.activityName, 160, 'Merit Award'),
      coins,
      awardedBy: actorName,
      awardedByUid: actorUid,
      ...(txData.notes && txData.notes.trim()
        ? { notes: boundString(txData.notes.trim(), 1000) }
        : {}),
      auditDocId,
      isPublicLedger: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    primaryBatch.set(doc(db, 'coin_transactions', txId), txPayload);

    await upsertPublicLeaderboardSummary(
      primaryBatch,
      nextStudents,
      nextClassAwards,
      actorUid,
      txId,
      txData.targetType === 'STUDENT'
        ? `Awarded +${coins} coins to ${txData.studentName}`
        : `Awarded +${coins} coins to Class ${txData.className}`
    );

    await addAuditEntryToBatch(primaryBatch, {
      auditDocId,
      action: txData.targetType === 'STUDENT' ? 'AWARD_STUDENT_COINS' : 'AWARD_CLASS_COINS',
      actorUid: actorUid,
      actorName,
      targetPath: `coin_transactions/${txId}`,
      summary:
        txData.targetType === 'STUDENT'
          ? `Credited +${coins} coins to ${txData.studentName} (${txData.activityName}).`
          : `Credited +${coins} coins to Class ${txData.className} (${txData.activityName}).`,
    });

    await primaryBatch.commit();

    const overflowPeers = ((primaryBatch as any).__overflowPeers as StudentRecord[] | undefined) || [];
    for (let i = 0; i < overflowPeers.length; i += 250) {
      const overflowBatch = writeBatch(db);
      for (const peer of overflowPeers.slice(i, i + 250)) {
        overflowBatch.update(doc(db, 'students', peer.id), {
          mentorGroupRank: peer.mentorGroupRank,
          mentorRankNum: peer.mentorRankNum,
          mentorGroupSize: peer.mentorGroupSize,
          classRank: peer.classRank,
          classRankNum: peer.classRankNum,
          classSize: peer.classSize,
          campusRank: peer.campusRank,
          campusRankNum: peer.campusRankNum,
          campusTotalStudents: peer.campusTotalStudents,
          updatedAt: serverTimestamp(),
        });
      }
      await overflowBatch.commit();
    }

    return { students: nextStudents, classAwards: nextClassAwards };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `coin_transactions/${txId}`);
  }
}

/**
 * Super Admin revokes a transaction and rolls back student/class coins atomically.
 */
export async function revokeTransactionInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  tx: CoinTransaction;
  allStudents: StudentRecord[];
  classAwards: Record<string, number>;
}): Promise<{ students: StudentRecord[]; classAwards: Record<string, number> }> {
  const { fbUser, authUser, tx, allStudents, classAwards } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'admin-user';
  const auditDocId = makeId('AUD');
  const actorName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Super Admin'
  );

  try {
    const batch = writeBatch(db);
    let nextStudents = [...allStudents];
    let nextClassAwards = { ...classAwards };
    let overflowPeers: StudentRecord[] = [];

    batch.delete(doc(db, 'coin_transactions', tx.id));

    if (tx.targetType === 'STUDENT') {
      const targetId = tx.studentDocId || tx.studentId;
      nextStudents = allStudents.map((s) => {
        if (s.id === targetId || s.studentId === tx.studentId || s.adNo === tx.adNo) {
          const nextCoins = Math.max(0, (s.totalCoins || 0) - tx.coins);
          return {
            ...s,
            totalCoins: nextCoins,
            tier: computeTierForCoins(nextCoins),
            coinStatus: nextCoins === 0 ? ('ZERO' as const) : s.coinStatus,
          };
        }
        return { ...s };
      });
      recalculateAllRanks(nextStudents);

      const targetStu = nextStudents.find(
        (s) => s.id === targetId || s.studentId === tx.studentId || s.adNo === tx.adNo
      );
      if (targetStu) {
        batch.update(doc(db, 'students', targetStu.id), {
          totalCoins: targetStu.totalCoins,
          coinStatus: targetStu.coinStatus,
          tier: targetStu.tier,
          mentorGroupRank: targetStu.mentorGroupRank,
          mentorRankNum: targetStu.mentorRankNum,
          mentorGroupSize: targetStu.mentorGroupSize,
          classRank: targetStu.classRank,
          classRankNum: targetStu.classRankNum,
          classSize: targetStu.classSize,
          campusRank: targetStu.campusRank,
          campusRankNum: targetStu.campusRankNum,
          campusTotalStudents: targetStu.campusTotalStudents,
          updatedAt: serverTimestamp(),
        });
      }

      const prevById = new Map(allStudents.map((s) => [s.id, s]));
      const changedPeers = nextStudents.filter((peer) => {
        if (targetStu && peer.id === targetStu.id) return false;
        const old = prevById.get(peer.id);
        return (
          !old ||
          old.campusRankNum !== peer.campusRankNum ||
          old.classRankNum !== peer.classRankNum ||
          old.mentorRankNum !== peer.mentorRankNum
        );
      });

      for (const peer of changedPeers.slice(0, 285)) {
        batch.update(doc(db, 'students', peer.id), {
          mentorGroupRank: peer.mentorGroupRank,
          mentorRankNum: peer.mentorRankNum,
          mentorGroupSize: peer.mentorGroupSize,
          classRank: peer.classRank,
          classRankNum: peer.classRankNum,
          classSize: peer.classSize,
          campusRank: peer.campusRank,
          campusRankNum: peer.campusRankNum,
          campusTotalStudents: peer.campusTotalStudents,
          updatedAt: serverTimestamp(),
        });
      }
      overflowPeers = changedPeers.slice(285);
    } else if (tx.targetType === 'CLASS' && tx.className) {
      const nextAmt = Math.max(0, (classAwards[tx.className] || 0) - tx.coins);
      nextClassAwards = { ...classAwards, [tx.className]: nextAmt };
      const classRef = doc(db, 'class_awards', tx.className);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        batch.update(classRef, {
          awardCoins: nextAmt,
          updatedAt: serverTimestamp(),
        });
      }
    }

    await upsertPublicLeaderboardSummary(
      batch,
      nextStudents,
      nextClassAwards,
      actorUid,
      tx.id,
      `Revoked transaction ${tx.id} (-${tx.coins} coins)`
    );

    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: 'TRANSACTION_REVOKED',
      actorUid,
      actorName,
      targetPath: `coin_transactions/${tx.id}`,
      summary: `Revoked ${tx.coins} coins transaction (${tx.activityName}).`,
    });

    await batch.commit();
    for (let i = 0; i < overflowPeers.length; i += 250) {
      const overflowBatch = writeBatch(db);
      for (const peer of overflowPeers.slice(i, i + 250)) {
        overflowBatch.update(doc(db, 'students', peer.id), {
          mentorGroupRank: peer.mentorGroupRank,
          mentorRankNum: peer.mentorRankNum,
          mentorGroupSize: peer.mentorGroupSize,
          classRank: peer.classRank,
          classRankNum: peer.classRankNum,
          classSize: peer.classSize,
          campusRank: peer.campusRank,
          campusRankNum: peer.campusRankNum,
          campusTotalStudents: peer.campusTotalStudents,
          updatedAt: serverTimestamp(),
        });
      }
      await overflowBatch.commit();
    }
    return { students: nextStudents, classAwards: nextClassAwards };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `coin_transactions/${tx.id}`);
  }
}

/**
 * Updates a student portrait photo in Firestore (compacts image under 50KB limit automatically).
 */
export async function updateStudentPhotoInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  studentId: string;
  rawPhotoUrl: string;
  allStudents: StudentRecord[];
  classAwards: Record<string, number>;
}): Promise<string> {
  const { fbUser, authUser, studentId, rawPhotoUrl, allStudents, classAwards } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'user-active';
  const compactPhoto = await compressImageToCompactDataUrl(rawPhotoUrl);
  const photoUrlToSave = await uploadImageToFirebaseStorage(
    `students/${studentId}/portrait_${Date.now()}.jpg`,
    compactPhoto
  );

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'students', studentId), {
      photoUrl: photoUrlToSave,
      updatedAt: serverTimestamp(),
    });

    const isFaculty =
      authUser?.role === 'SUPER_ADMIN' ||
      authUser?.role === 'TEACHER_ADMIN' ||
      isBootstrapAdminEmail(fbUser?.email || authUser?.email || '');

    if (isFaculty) {
      const updatedStudents = allStudents.map((s) =>
        s.id === studentId || s.studentId === studentId ? { ...s, photoUrl: compactPhoto } : s
      );
      await upsertPublicLeaderboardSummary(
        batch,
        updatedStudents,
        classAwards,
        actorUid,
        'PHOTO-UPDATE',
        `Updated photo for ${studentId}`
      );
    }

    await batch.commit();
    return compactPhoto;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
  }
}

/**
 * Super Admin creates or edits a student profile in Firestore.
 */
export async function upsertStudentInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  student: StudentRecord;
  isNew: boolean;
  allStudents: StudentRecord[];
  classAwards: Record<string, number>;
}): Promise<StudentRecord[]> {
  const { fbUser, authUser, student, isNew, allStudents, classAwards } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'admin-user';
  const auditDocId = makeId('AUD');
  const actorName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Super Admin'
  );

  const nextStudents = isNew
    ? [{ ...student }, ...allStudents.map((s) => ({ ...s }))]
    : allStudents.map((s) => (s.id === student.id ? { ...student } : { ...s }));
  recalculateAllRanks(nextStudents);

  const savedStudent = nextStudents.find((s) => s.id === student.id)!;

  try {
    const batch = writeBatch(db);
    if (isNew) {
      batch.set(doc(db, 'students', savedStudent.id), buildStudentFirestoreCreateDoc(savedStudent));
    } else {
      const updateFields: Record<string, unknown> = {
        officialId: boundNonEmptyString(
          savedStudent.officialId,
          64,
          `DHAC/ST/2026/${savedStudent.className}/${savedStudent.adNo}`
        ),
        adNo: boundNonEmptyString(savedStudent.adNo, 20, '000'),
        adFlag: savedStudent.adFlag,
        name: boundNonEmptyString(savedStudent.name, 120, 'STUDENT'),
        className: boundNonEmptyString(savedStudent.className, 16, 'S1A'),
        batchName: boundString(savedStudent.batchName || getBatchName(savedStudent.className), 48),
        mentorName: boundNonEmptyString(savedStudent.mentorName, 100, 'MENTOR'),
        totalCoins: boundInt(savedStudent.totalCoins, 0, 100000, 0),
        coinStatus: savedStudent.coinStatus,
        mentorGroupRank: savedStudent.mentorGroupRank,
        mentorRankNum: savedStudent.mentorRankNum,
        mentorGroupSize: savedStudent.mentorGroupSize,
        classRank: savedStudent.classRank,
        classRankNum: savedStudent.classRankNum,
        classSize: savedStudent.classSize,
        campusRank: savedStudent.campusRank,
        campusRankNum: savedStudent.campusRankNum,
        campusTotalStudents: savedStudent.campusTotalStudents,
        rankStatus: savedStudent.rankStatus,
        notes: boundString(savedStudent.notes || '', 500),
        tier: computeTierForCoins(savedStudent.totalCoins),
        isPublicCohort: true,
        updatedAt: serverTimestamp(),
      };
      if (savedStudent.photoUrl) {
        updateFields.photoUrl = boundString(
          savedStudent.photoUrl,
          VALIDATION_LIMITS.student.photoUrlMax
        );
      }
      if (savedStudent.studentEmail !== undefined) {
        updateFields.studentEmail = boundString(
          savedStudent.studentEmail.trim().toLowerCase(),
          160
        );
      }
      batch.update(doc(db, 'students', savedStudent.id), updateFields);
    }

    await upsertPublicLeaderboardSummary(
      batch,
      nextStudents,
      classAwards,
      actorUid,
      savedStudent.id,
      `${isNew ? 'Registered' : 'Updated'} student ${savedStudent.name}`
    );

    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: isNew ? 'STUDENT_CREATED' : 'STUDENT_UPDATED',
      actorUid,
      actorName,
      targetPath: `students/${savedStudent.id}`,
      summary: `${isNew ? 'Added' : 'Updated'} student ${savedStudent.name} (AD #${savedStudent.adNo}).`,
    });

    await batch.commit();
    return nextStudents;
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      `students/${student.id}`
    );
  }
}

/**
 * Super Admin deletes a student record from Firestore.
 */
export async function deleteStudentInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  studentId: string;
  allStudents: StudentRecord[];
  classAwards: Record<string, number>;
}): Promise<StudentRecord[]> {
  const { fbUser, authUser, studentId, allStudents, classAwards } = params;
  const auditDocId = makeId('AUD');
  const actorName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Super Admin'
  );
  const actorUid = fbUser?.uid || authUser?.uid || 'admin-sidrastudentsunion';
  const removed = allStudents.find((s) => s.id === studentId || s.studentId === studentId);
  const nextStudents = allStudents.filter((s) => s.id !== studentId && s.studentId !== studentId);
  recalculateAllRanks(nextStudents);

  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'students', studentId));

    await upsertPublicLeaderboardSummary(
      batch,
      nextStudents,
      classAwards,
      actorUid,
      studentId,
      `Removed student ${removed?.name || studentId}`
    );

    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: 'STUDENT_DELETED',
      actorUid,
      actorName,
      targetPath: `students/${studentId}`,
      summary: `Removed student ${removed?.name || studentId} from registry.`,
    });

    await batch.commit();
    return nextStudents;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${studentId}`);
  }
}

/**
 * Super Admin creates or updates a mentor in /mentors and syncs catalog snapshot.
 */
export async function upsertMentorInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  teacher: TeacherRecord;
  isNew: boolean;
  allTeachers: TeacherRecord[];
  coinCategories: CoinCategory[];
  unions: UnionDefinition[];
  oldName?: string;
  allStudents?: StudentRecord[];
  classAwards?: Record<string, number>;
}): Promise<void> {
  const {
    fbUser,
    authUser,
    teacher,
    isNew,
    allTeachers,
    coinCategories,
    unions,
    oldName,
    allStudents,
    classAwards,
  } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'admin-user';
  const docId = getMentorDocId(teacher);
  const auditDocId = makeId('AUD');
  const actorName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Super Admin'
  );

  try {
    const batch = writeBatch(db);
    const ref = doc(db, 'mentors', docId);
    if (isNew) {
      batch.set(ref, buildMentorFirestoreCreateDoc({ ...teacher, id: docId }));
    } else {
      batch.update(ref, {
        serialNo: boundNonEmptyString(teacher.serialNo, 8, '01'),
        teacherId: boundNonEmptyString(teacher.teacherId, 32, 'DHAC/STAFF/01'),
        name: boundNonEmptyString(teacher.name, 100, 'MENTOR'),
        username: boundNonEmptyString(teacher.username, 64, 'STAFF'),
        assignedEmail: boundString((teacher.assignedEmail || '').trim().toLowerCase(), 160),
        isPublicDirectory: true,
        updatedAt: serverTimestamp(),
      });
    }

    // Propagate mentor rename to mentees if needed
    if (!isNew && oldName && oldName !== teacher.name && allStudents) {
      for (const s of allStudents) {
        if (s.mentorName === oldName) {
          batch.update(doc(db, 'students', s.id), {
            mentorName: boundNonEmptyString(teacher.name, 100, teacher.name),
            updatedAt: serverTimestamp(),
          });
        }
      }
      if (classAwards) {
        const updatedStus = allStudents.map((s) =>
          s.mentorName === oldName ? { ...s, mentorName: teacher.name } : s
        );
        await upsertPublicLeaderboardSummary(
          batch,
          updatedStus,
          classAwards,
          actorUid,
          docId,
          `Updated mentor name to ${teacher.name}`
        );
      }
    }

    await upsertPublicCatalogConfig(
      batch,
      allTeachers,
      coinCategories,
      unions,
      actorUid,
      `${isNew ? 'Added' : 'Updated'} mentor ${teacher.name}`
    );

    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: isNew ? 'MENTOR_CREATED' : 'MENTOR_UPDATED',
      actorUid,
      actorName,
      targetPath: `mentors/${docId}`,
      summary: `${isNew ? 'Added' : 'Updated'} faculty mentor ${teacher.name}.`,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      isNew ? OperationType.CREATE : OperationType.UPDATE,
      `mentors/${docId}`
    );
  }
}

export async function deleteMentorInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  teacher: TeacherRecord;
  remainingTeachers: TeacherRecord[];
  coinCategories: CoinCategory[];
  unions: UnionDefinition[];
}): Promise<void> {
  const { fbUser, authUser, teacher, remainingTeachers, coinCategories, unions } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'admin-user';
  const docId = getMentorDocId(teacher);
  const auditDocId = makeId('AUD');
  const actorName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Super Admin'
  );

  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'mentors', docId));
    await upsertPublicCatalogConfig(
      batch,
      remainingTeachers,
      coinCategories,
      unions,
      actorUid,
      `Removed mentor ${teacher.name}`
    );
    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: 'MENTOR_DELETED',
      actorUid,
      actorName,
      targetPath: `mentors/${docId}`,
      summary: `Removed faculty mentor ${teacher.name}.`,
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `mentors/${docId}`);
  }
}

export async function saveRulesInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  teachers: TeacherRecord[];
  coinCategories: CoinCategory[];
  unions: UnionDefinition[];
}): Promise<void> {
  const { fbUser, authUser, teachers, coinCategories, unions } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'admin-user';
  const auditDocId = makeId('AUD');
  const actorName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Super Admin'
  );

  try {
    const batch = writeBatch(db);
    for (let i = 0; i < coinCategories.length; i++) {
      const cat = coinCategories[i];
      if (!isValidFirestoreId(cat.id)) continue;
      const ref = doc(db, 'coin_categories', cat.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        batch.update(ref, {
          categoryName: boundNonEmptyString(cat.categoryName, 120, 'CATEGORY'),
          description: boundString(cat.description || '', 300),
          sortOrder: i,
          activities: cat.activities.slice(0, 50),
          isActive: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(ref, {
          id: cat.id,
          categoryName: boundNonEmptyString(cat.categoryName, 120, 'CATEGORY'),
          ...(cat.description ? { description: boundString(cat.description, 300) } : {}),
          sortOrder: i,
          activities: cat.activities.slice(0, 50),
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    await upsertPublicCatalogConfig(
      batch,
      teachers,
      coinCategories,
      unions,
      actorUid,
      'Updated Coin Rules Engine'
    );

    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: 'COIN_RULES_UPDATED',
      actorUid,
      actorName,
      targetPath: 'coin_categories',
      summary: `Saved ${coinCategories.length} coin rule categories.`,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'coin_categories');
  }
}

export async function saveUnionsInFirestore(params: {
  fbUser?: FirebaseUser | null;
  authUser: AuthUser | null;
  teachers: TeacherRecord[];
  coinCategories: CoinCategory[];
  unions: UnionDefinition[];
}): Promise<void> {
  const { fbUser, authUser, teachers, coinCategories, unions } = params;
  const actorUid = fbUser?.uid || authUser?.uid || 'admin-user';
  const auditDocId = makeId('AUD');
  const actorName = boundNonEmptyString(
    authUser?.displayName || fbUser?.displayName,
    120,
    'Super Admin'
  );

  try {
    const batch = writeBatch(db);
    for (const u of unions) {
      if (!isValidFirestoreId(u.id)) continue;
      const ref = doc(db, 'unions', u.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        batch.update(ref, {
          unionName: boundNonEmptyString(u.unionName, 80, 'UNION'),
          classes: u.classes.slice(0, 12),
          category: u.category || 'Secondary',
          isNoUnionBatch: Boolean(u.isNoUnionBatch),
          isActive: true,
          updatedAt: serverTimestamp(),
        });
      } else {
        batch.set(ref, {
          id: u.id,
          unionName: boundNonEmptyString(u.unionName, 80, 'UNION'),
          classes: u.classes.slice(0, 12),
          category: u.category || 'Secondary',
          ...(typeof u.isNoUnionBatch === 'boolean' ? { isNoUnionBatch: u.isNoUnionBatch } : {}),
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    await upsertPublicCatalogConfig(
      batch,
      teachers,
      coinCategories,
      unions,
      actorUid,
      'Updated Campus Unions'
    );

    await addAuditEntryToBatch(batch, {
      auditDocId,
      action: 'UNIONS_UPDATED',
      actorUid,
      actorName,
      targetPath: 'unions',
      summary: `Saved ${unions.length} campus student unions.`,
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'unions');
  }
}
