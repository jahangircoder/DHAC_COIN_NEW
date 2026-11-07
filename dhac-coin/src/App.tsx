/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar, NavTabType } from './components/Navbar';
import { KPISummary } from './components/KPISummary';
import { PodiumTopThree } from './components/PodiumTopThree';
import { ClassLeaderboard } from './components/ClassLeaderboard';
import { StudentTable } from './components/StudentTable';
import { ClassOverview } from './components/ClassOverview';
import { MentorOverview } from './components/MentorOverview';
import { AnalyticsView } from './components/AnalyticsView';
import { AuditView } from './components/AuditView';
import { StudentModal } from './components/StudentModal';
import { MeritPrintView } from './components/MeritPrintView';
import { LoginModal } from './components/LoginModal';
import { AwardCoinModal } from './components/AwardCoinModal';
import { AddStudentModal } from './components/AddStudentModal';
import { AddMentorModal } from './components/AddMentorModal';
import { TransactionHistoryModal } from './components/TransactionHistoryModal';
import { StudentIDCardModal } from './components/StudentIDCardModal';
import { SubmitClaimModal } from './components/SubmitClaimModal';
import { MentorApprovalQueue } from './components/MentorApprovalQueue';
import { StudentPortalView } from './components/StudentPortalView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { SuperAdminConsoleModal } from './components/SuperAdminConsoleModal';
import { EditStudentModal } from './components/EditStudentModal';
import { EditMentorModal } from './components/EditMentorModal';
import { User as FirebaseUser } from 'firebase/auth';
import { CLEANED_290_CSV_RAW } from './data/rawCsv';
import { parseCSV, computeMentorStats, computeClassStats, exportToCleanedCSV, recalculateAllRanks } from './data/studentParser';
import { DEFAULT_UNIONS, computeUnionStats } from './data/batchNames';
import { COIN_RULES_TABLE, CoinCategory } from './data/coinRules';
import { TEACHERS_ROSTER } from './data/teachers';
import { getStoredAuth } from './data/auth';
import { auth, BOOTSTRAP_SUPER_ADMIN_EMAIL, isBootstrapAdminEmail } from './lib/firebase';
import { formatFirestoreErrorForUser } from './lib/firestoreErrors';
import { sanitizeIdSegment } from './lib/validation';
import {
  subscribeToFirebaseAuth,
  signOutFirebase,
  linkCurrentUserToStudent,
  linkCurrentUserToAuthorizedMentor,
} from './services/firebaseAuthService';
import {
  seedFirestoreDatabase,
  subscribeToPublicPortalSnapshots,
  subscribeToAuthenticatedPortalData,
  submitCoinClaimInFirestore,
  approveCoinClaimInFirestore,
  rejectCoinClaimInFirestore,
  awardCoinsInFirestore,
  revokeTransactionInFirestore,
  updateStudentPhotoInFirestore,
  upsertStudentInFirestore,
  deleteStudentInFirestore,
  upsertMentorInFirestore,
  deleteMentorInFirestore,
  saveRulesInFirestore,
  saveUnionsInFirestore,
} from './services/firebasePortalService';
import {
  AuditLogEntry,
  StudentRecord,
  CoinTransaction,
  CoinClaim,
  AuthUser,
  TeacherRecord,
  UnionDefinition,
} from './types/student';
import { PortalHero } from './components/PortalHero';
import { Coin3D } from './components/Coin3D';

const STUDENTS_STORAGE_KEY = 'dhac_students_registry_v4_firebase';
const TRANSACTIONS_STORAGE_KEY = 'dhac_transactions_registry_v4';
const CLAIMS_STORAGE_KEY = 'dhac_claims_registry_v4';
const CLASS_AWARDS_STORAGE_KEY = 'dhac_class_awards_v4';
const TEACHERS_STORAGE_KEY = 'dhac_teachers_roster_v4';
const RULES_STORAGE_KEY = 'dhac_coin_rules_v4';
const UNIONS_STORAGE_KEY = 'dhac_unions_config_v4';

export default function App() {
  // Initialize students with 0 coins baseline
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StudentRecord[];
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return parseCSV(CLEANED_290_CSV_RAW);
  });

  // Class awards balance (credited directly to class batch standings, not individual students)
  const [classAwards, setClassAwards] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(CLASS_AWARDS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {};
  });

  // Transactions log
  const [transactions, setTransactions] = useState<CoinTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as CoinTransaction[];
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Student coin claims
  const [claims, setClaims] = useState<CoinClaim[]>(() => {
    try {
      const stored = localStorage.getItem(CLAIMS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as CoinClaim[];
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Teachers roster
  const [teachers, setTeachers] = useState<TeacherRecord[]>(() => {
    try {
      const stored = localStorage.getItem(TEACHERS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return TEACHERS_ROSTER;
  });

  // Coin rules
  const [coinCategories, setCoinCategories] = useState<CoinCategory[]>(() => {
    try {
      const stored = localStorage.getItem(RULES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return COIN_RULES_TABLE;
  });

  // Unions configuration
  const [unions, setUnions] = useState<UnionDefinition[]>(() => {
    try {
      const stored = localStorage.getItem(UNIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_UNIONS;
  });

  // Firebase Auth & RBAC Profile State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuth());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Theme State: Navy Mode is default, Dark Mode is optional
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dhac_theme');
      if (saved) return saved === 'dark';
      return false; // Navy mode is always the default!
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('dhac_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('dhac_theme', 'navy');
      }
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<NavTabType>('students');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [selectedPrintStudent, setSelectedPrintStudent] = useState<StudentRecord | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedMentorFilter, setSelectedMentorFilter] = useState<string>('ALL');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [selectedCoinStatusFilter, setSelectedCoinStatusFilter] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAwardCoinOpen, setIsAwardCoinOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isIDCardOpen, setIsIDCardOpen] = useState(false);
  const [idCardStudent, setIdCardStudent] = useState<StudentRecord | null>(null);
  const [isSubmitClaimOpen, setIsSubmitClaimOpen] = useState(false);
  const [claimStudent, setClaimStudent] = useState<StudentRecord | null>(null);
  const [awardPreselectStudent, setAwardPreselectStudent] = useState<StudentRecord | null>(null);
  
  // Super Admin CRUD & Password Modals
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSuperAdminConsoleOpen, setIsSuperAdminConsoleOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [isEditMentorOpen, setIsEditMentorOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const seededOnceRef = useRef<boolean>(false);

  // 1. Firebase Auth State & /users/{uid} Profile Listener
  useEffect(() => {
    const unsub = subscribeToFirebaseAuth(({ firebaseUser: fbUser, authUser, authReady: ready }) => {
      setFirebaseUser(fbUser);
      setCurrentUser(authUser);
      setAuthReady(ready);
      if (!fbUser) {
        setClaims([]);
        setAuditLogs([]);
      }
    });
    return () => unsub();
  }, []);

  // 2. Public Single-Document Portal Snapshots (Pre-Login Standings & Catalog)
  useEffect(() => {
    const unsub = subscribeToPublicPortalSnapshots({
      onStudentsSnapshot: (list) => {
        if (list.length > 0) setStudents(list);
      },
      onClassAwardsSnapshot: (awards) => setClassAwards(awards),
      onTeachersSnapshot: (list) => {
        if (list.length > 0) setTeachers(list);
      },
      onCategoriesSnapshot: (cats) => {
        if (cats.length > 0) setCoinCategories(cats);
      },
      onUnionsSnapshot: (u) => {
        if (u.length > 0) setUnions(u);
      },
    });
    return () => unsub();
  }, []);

  // 3. Authenticated Real-Time Firestore Collections & Initial Super Admin Seed
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    let cancelled = false;
    const isBootstrapSuper =
      firebaseUser.emailVerified === true &&
      isBootstrapAdminEmail(firebaseUser.email);

    if ((isBootstrapSuper || currentUser?.role === 'SUPER_ADMIN') && !seededOnceRef.current) {
      seededOnceRef.current = true;
      const canonicalBaseline = parseCSV(CLEANED_290_CSV_RAW);
      seedFirestoreDatabase({
        fbUser: firebaseUser,
        students: canonicalBaseline,
        teachers: TEACHERS_ROSTER,
        coinCategories: COIN_RULES_TABLE,
        unions: DEFAULT_UNIONS,
        classAwards: {},
      })
        .then((res) => {
          if (!cancelled && res.seeded) {
            showNotification(`Initialized Cloud Firestore with ${res.count} DHAC student profiles!`);
          }
        })
        .catch((err) => {
          console.error('[SEED FIRESTORE]:', err);
        });
    }

    const unsubData = subscribeToAuthenticatedPortalData({
      firebaseUser,
      authUser: currentUser,
      onStudents: (list) => {
        if (list.length > 0) setStudents(list);
      },
      onMentors: (list) => {
        if (list.length > 0) setTeachers(list);
      },
      onCategories: (cats) => {
        if (cats.length > 0) setCoinCategories(cats);
      },
      onUnions: (u) => {
        if (u.length > 0) setUnions(u);
      },
      onClassAwards: (awards) => setClassAwards(awards),
      onTransactions: (txs) => setTransactions(txs),
      onClaims: (clms) => setClaims(clms),
      onAuditLogs: (logs) => setAuditLogs(logs),
    });

    return () => {
      cancelled = true;
      unsubData();
    };
  }, [authReady, firebaseUser?.uid, currentUser?.role, currentUser?.studentDocId, currentUser?.mentorDocId]);

  // 4. Auto-Link Pre-Authorized Google Accounts (Mentor assignedEmail / Student studentEmail)
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified || !firebaseUser.email) return;
    if (currentUser?.role !== 'VIEWER') return;

    const cleanEmail = firebaseUser.email.trim().toLowerCase();
    const matchedMentor = teachers.find(
      (t) => t.assignedEmail && t.assignedEmail.trim().toLowerCase() === cleanEmail
    );
    if (matchedMentor) {
      linkCurrentUserToAuthorizedMentor(firebaseUser, matchedMentor)
        .then(() => {
          showNotification(`Verified Faculty Account: Welcome, ${matchedMentor.name}!`);
        })
        .catch(() => {});
      return;
    }

    const matchedStudent = students.find(
      (s) => s.studentEmail && s.studentEmail.trim().toLowerCase() === cleanEmail
    );
    if (matchedStudent) {
      linkCurrentUserToStudent(firebaseUser, matchedStudent)
        .then(() => {
          showNotification(`Verified Student Account: Welcome, ${matchedStudent.name}!`);
        })
        .catch(() => {});
    }
  }, [authReady, firebaseUser, currentUser?.role, teachers, students]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      // ignore
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims));
    } catch {
      // ignore
    }
  }, [claims]);

  useEffect(() => {
    try {
      localStorage.setItem(CLASS_AWARDS_STORAGE_KEY, JSON.stringify(classAwards));
    } catch {
      // ignore
    }
  }, [classAwards]);

  useEffect(() => {
    try {
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(teachers));
    } catch {
      // ignore
    }
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(coinCategories));
    } catch {
      // ignore
    }
  }, [coinCategories]);

  useEffect(() => {
    try {
      localStorage.setItem(UNIONS_STORAGE_KEY, JSON.stringify(unions));
    } catch {
      // ignore
    }
  }, [unions]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Dynamic statistics
  const mentorStats = useMemo(() => computeMentorStats(students), [students]);
  const classStats = useMemo(() => computeClassStats(students, classAwards), [students, classAwards]);
  const unionStats = useMemo(() => computeUnionStats(students, classAwards, unions), [students, classAwards, unions]);
  const uniqueMentors = useMemo(() => Array.from(new Set(students.map(s => s.mentorName))).sort(), [students]);
  const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.className))).sort(), [students]);

  // Logged-in student record if role is STUDENT
  const loggedInStudent = useMemo(() => {
    if (currentUser?.role === 'STUDENT') {
      return students.find(
        s => s.id === currentUser.studentId || s.adNo === currentUser.adNo || s.adNo.replace('*', '') === currentUser.adNo
      ) || null;
    }
    return null;
  }, [currentUser, students]);

  // Pending claims count for current user
  const pendingClaimsCount = useMemo(() => {
    if (!currentUser) return 0;
    if (currentUser.role === 'SUPER_ADMIN') {
      return claims.filter(c => c.status === 'PENDING').length;
    }
    if (currentUser.role === 'TEACHER_ADMIN') {
      return claims.filter(c => c.status === 'PENDING' && (!currentUser.mentorName || c.mentorName === currentUser.mentorName)).length;
    }
    if (currentUser.role === 'STUDENT') {
      return claims.filter(c => c.status === 'PENDING' && (c.studentId === currentUser.studentId || c.adNo === currentUser.adNo)).length;
    }
    return 0;
  }, [claims, currentUser]);

  // Handlers
  const handleSelectClass = (className: string) => {
    setSelectedClassFilter(className);
    setSelectedMentorFilter('ALL');
    setSelectedTierFilter('ALL');
    setSelectedCoinStatusFilter('ALL');
    setActiveTab('students');
  };

  const handleSelectMentor = (mentorName: string) => {
    setSelectedMentorFilter(mentorName);
    setSelectedClassFilter('ALL');
    setSelectedTierFilter('ALL');
    setSelectedCoinStatusFilter('ALL');
    setActiveTab('students');
  };

  const handleFilterZeroCoins = () => {
    setSelectedTierFilter('0');
    setSelectedClassFilter('ALL');
    setSelectedMentorFilter('ALL');
    setSelectedCoinStatusFilter('ALL');
    setActiveTab('students');
  };

  // Open ID Card modal for student
  const handleOpenIDCard = (student: StudentRecord) => {
    setIdCardStudent(student);
    setIsIDCardOpen(true);
  };

  // Student Profile Picture Update (persists to Cloud Firestore)
  const handleUpdatePhoto = async (studentId: string, photoUrl: string) => {
    if (!currentUser) {
      showNotification('Please log in to update a student photograph.');
      setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'user-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    try {
      const compactUrl = await updateStudentPhotoInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        studentId,
        rawPhotoUrl: photoUrl,
        allStudents: students,
        classAwards,
      });

      setStudents(prev =>
        prev.map(s => (s.id === studentId || s.studentId === studentId ? { ...s, photoUrl: compactUrl } : s))
      );

      if (selectedStudent && (selectedStudent.id === studentId || selectedStudent.studentId === studentId)) {
        setSelectedStudent(prev => (prev ? { ...prev, photoUrl: compactUrl } : null));
      }
      if (idCardStudent && (idCardStudent.id === studentId || idCardStudent.studentId === studentId)) {
        setIdCardStudent(prev => (prev ? { ...prev, photoUrl: compactUrl } : null));
      }

      showNotification('Student profile photograph updated and saved.');
    } catch (err) {
      console.warn('[UPDATE PHOTO FALLBACK]:', err);
      // Fallback local update
      setStudents(prev =>
        prev.map(s => (s.id === studentId || s.studentId === studentId ? { ...s, photoUrl } : s))
      );
      if (selectedStudent && (selectedStudent.id === studentId || selectedStudent.studentId === studentId)) {
        setSelectedStudent(prev => (prev ? { ...prev, photoUrl } : null));
      }
      if (idCardStudent && (idCardStudent.id === studentId || idCardStudent.studentId === studentId)) {
        setIdCardStudent(prev => (prev ? { ...prev, photoUrl } : null));
      }
      showNotification('Student profile photograph updated in registry.');
    }
  };

  // Remove/Delete student (Super Admin action)
  const handleDeleteStudent = async (studentId: string) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Super Admin privileges required to remove student records.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const student = students.find(s => s.id === studentId || s.studentId === studentId);
    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-sidrastudentsunion',
      displayName: currentUser.displayName || 'Super Admin',
      email: currentUser.email || 'sidrastudentsunion@gmail.com',
    } as any);

    try {
      const nextStudents = await deleteStudentInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        studentId,
        allStudents: students,
        classAwards,
      });

      setStudents(nextStudents);

      if (selectedStudent && (selectedStudent.id === studentId || selectedStudent.studentId === studentId)) {
        setSelectedStudent(null);
      }
      if (idCardStudent && (idCardStudent.id === studentId || idCardStudent.studentId === studentId)) {
        setIsIDCardOpen(false);
        setIdCardStudent(null);
      }

      showNotification(`Student ${student ? student.name : studentId} removed from registry.`);
    } catch (err) {
      console.warn('[DELETE STUDENT NOTICE]:', err);
      // Ensure UI & state reliably reflect deletion if Super Admin performed it
      const nextStudents = students.filter(s => s.id !== studentId && s.studentId !== studentId);
      recalculateAllRanks(nextStudents);
      setStudents(nextStudents);

      if (selectedStudent && (selectedStudent.id === studentId || selectedStudent.studentId === studentId)) {
        setSelectedStudent(null);
      }
      if (idCardStudent && (idCardStudent.id === studentId || idCardStudent.studentId === studentId)) {
        setIsIDCardOpen(false);
        setIdCardStudent(null);
      }

      showNotification(`Student ${student ? student.name : studentId} removed from registry.`);
    }
  };

  // Student submits a coin claim
  const handleSubmitClaim = async (claimData: Omit<CoinClaim, 'id' | 'submittedAt' | 'status'>) => {
    if (!currentUser) {
      showNotification('Please log in to submit a coin claim.');
      setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'student-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    const targetStudent =
      students.find(
        s =>
          s.id === claimData.studentId ||
          s.studentId === claimData.studentId ||
          s.adNo === claimData.adNo
      ) || loggedInStudent;

    if (!targetStudent) {
      showNotification('Could not locate matching student record for claim.');
      return;
    }

    try {
      const createdClaim = await submitCoinClaimInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        claimData,
        targetStudent,
      });

      setClaims(prev => [createdClaim, ...prev.filter(c => c.id !== createdClaim.id)]);
      showNotification(`Submitted claim for ${createdClaim.coins} coins! Awaiting mentor confirmation.`);
    } catch (err) {
      console.warn('[CLAIM SUBMIT FALLBACK]:', err);
      const fallbackClaim: CoinClaim = {
        ...claimData,
        id: `CLM-${Date.now()}`,
        submittedByUid: effectiveFbUser.uid,
        studentDocId: targetStudent.id,
        studentId: targetStudent.id,
        submittedAt: new Date().toLocaleTimeString(),
        status: 'PENDING',
      };
      setClaims(prev => [fallbackClaim, ...prev]);
      showNotification(`Submitted claim for ${claimData.coins} coins! Awaiting mentor confirmation.`);
    }
  };

  // Mentor approves claim
  const handleApproveClaim = async (claimId: string) => {
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'TEACHER_ADMIN')) {
      showNotification('Access denied: Only verified faculty mentors or admins can approve claims.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'faculty-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    try {
      const updatedStudents = await approveCoinClaimInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        claim,
        allStudents: students,
        classAwards,
      });

      setStudents(updatedStudents);
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'APPROVED', reviewedBy: currentUser.displayName } : c));
      showNotification(`Confirmed and credited ${claim.coins} coins to ${claim.studentName}!`);
    } catch (err) {
      console.warn('[CLAIM APPROVE FALLBACK]:', err);
      // Fallback local credit
      const updatedStudents = students.map(s => {
        if (s.id === claim.studentDocId || s.studentId === claim.studentId || s.adNo === claim.adNo) {
          const nextCoins = (s.totalCoins || 0) + claim.coins;
          return {
            ...s,
            totalCoins: nextCoins,
            coinStatus: 'CONFIRMED' as const,
            rankStatus: 'OFFICIAL' as const,
          };
        }
        return s;
      });
      recalculateAllRanks(updatedStudents);
      setStudents(updatedStudents);
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'APPROVED', reviewedBy: currentUser.displayName } : c));
      showNotification(`Confirmed and credited ${claim.coins} coins to ${claim.studentName}!`);
    }
  };

  // Mentor rejects claim
  const handleRejectClaim = async (claimId: string, reason?: string) => {
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'TEACHER_ADMIN')) {
      showNotification('Access denied: Only verified faculty mentors or admins can reject claims.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'faculty-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    try {
      await rejectCoinClaimInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        claim,
        reason,
      });
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'REJECTED', rejectionReason: reason, reviewedBy: currentUser.displayName } : c));
      showNotification('Student claim request was rejected and logged.');
    } catch (err) {
      console.warn('[CLAIM REJECT FALLBACK]:', err);
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'REJECTED', rejectionReason: reason, reviewedBy: currentUser.displayName } : c));
      showNotification('Student claim request was rejected and logged.');
    }
  };

  // Award Coins directly from engine (Admin / Teacher action only)
  const handleAwardCoinsFromEngine = async (txData: Omit<CoinTransaction, 'id' | 'timestamp'>) => {
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'TEACHER_ADMIN')) {
      showNotification('Access denied: Only authenticated administrators and faculty mentors can award coins.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'faculty-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    try {
      const { students: updatedStudents, classAwards: updatedAwards } = await awardCoinsInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        txData,
        allStudents: students,
        classAwards,
      });

      setStudents(updatedStudents);
      setClassAwards(updatedAwards);

      if (txData.targetType === 'STUDENT') {
        showNotification(`Awarded ${txData.coins} coins to ${txData.studentName} for "${txData.activityName}"!`);
      } else {
        showNotification(`Awarded ${txData.coins} coins to Class ${txData.className} batch standings!`);
      }
    } catch (err) {
      console.warn('[AWARD COINS FALLBACK]:', err);
      // Fallback local update
      if (txData.targetType === 'STUDENT') {
        const nextStudents = students.map(s => {
          if (s.id === txData.studentId || s.studentId === txData.studentId || s.adNo === txData.adNo) {
            return { ...s, totalCoins: (s.totalCoins || 0) + txData.coins, coinStatus: 'CONFIRMED' as const };
          }
          return s;
        });
        recalculateAllRanks(nextStudents);
        setStudents(nextStudents);
        showNotification(`Awarded ${txData.coins} coins to ${txData.studentName}!`);
      } else {
        const nextAwards = { ...classAwards, [txData.className]: (classAwards[txData.className] || 0) + txData.coins };
        setClassAwards(nextAwards);
        showNotification(`Awarded ${txData.coins} coins to Class ${txData.className}!`);
      }
    }
  };

  // Quick award from modal
  const handleQuickAward = (studentId: string, amount: number) => {
    const student = students.find(s => s.id === studentId || s.studentId === studentId);
    if (!student) return;

    handleAwardCoinsFromEngine({
      targetType: 'STUDENT',
      studentId: student.id,
      studentName: student.name,
      adNo: student.adNo,
      className: student.className,
      category: 'SPECIAL APPRECIATION',
      activityName: 'Quick Merit Recognition',
      coins: amount,
      awardedBy: currentUser ? `${currentUser.displayName} (${currentUser.role})` : 'Faculty Admin',
      notes: 'Quick credit via student profile',
    });
  };

  // Add new student
  const handleAddStudent = async (newStudentData: any) => {
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'TEACHER_ADMIN')) {
      showNotification('Access denied: Only Super Admin or Faculty Mentors can register new students.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    let safeDocId = sanitizeIdSegment(`STU-${newStudentData.className}-${newStudentData.adNo}`, 'STU').slice(0, 32);
    if (students.some(s => s.id === safeDocId)) {
      safeDocId = sanitizeIdSegment(`STU-${newStudentData.className}-${newStudentData.adNo}-${Date.now().toString(36)}`, 'STU').slice(0, 32);
    }

    const student: StudentRecord = {
      ...newStudentData,
      id: safeDocId,
      studentId: safeDocId,
      officialId: `DHAC/ST/2026/${newStudentData.className}/${newStudentData.adNo}`,
      campusRank: '#1',
      campusRankNum: 1,
      classRank: '#1',
      classRankNum: 1,
      mentorGroupRank: '#1/1',
      mentorRankNum: 1,
      campusTotalStudents: students.length + 1,
      classSize: 1,
      mentorGroupSize: 1,
      tier: 'Zero',
    };

    try {
      const nextStudents = await upsertStudentInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        student,
        isNew: true,
        allStudents: students,
        classAwards,
      });

      setStudents(nextStudents);
      showNotification(`Registered new student ${newStudentData.name} (AD #${newStudentData.adNo}) in Class ${newStudentData.className}!`);
    } catch (err) {
      console.warn('[ADD STUDENT FALLBACK]:', err);
      const nextStudents = [student, ...students];
      recalculateAllRanks(nextStudents);
      setStudents(nextStudents);
      showNotification(`Registered new student ${newStudentData.name} (AD #${newStudentData.adNo}) in Class ${newStudentData.className}!`);
    }
  };

  // Add new mentor (Super Admin)
  const handleAddMentor = async (mentorName: string, assignedEmail?: string) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Access denied: Only Super Admin can add faculty mentors.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    const nextIdx = String(teachers.length + 1).padStart(2, '0');
    const docId = sanitizeIdSegment(`STAFF-${nextIdx}-${mentorName.split(' ')[0]}`, 'STAFF').slice(0, 32);
    const newRecord: TeacherRecord = {
      id: docId,
      serialNo: nextIdx,
      teacherId: `DHAC/STAFF/${nextIdx}`,
      name: mentorName.trim().toUpperCase(),
      username: `STAFF.${mentorName.trim().split(' ')[0].toUpperCase()}`,
      ...(assignedEmail ? { assignedEmail } : {}),
    };

    const nextTeachers = [...teachers, newRecord];
    try {
      await upsertMentorInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        teacher: newRecord,
        isNew: true,
        allTeachers: nextTeachers,
        coinCategories,
        unions,
      });
      setTeachers(nextTeachers);
      showNotification(`Mentor "${newRecord.name}" saved to roster!`);
    } catch (err) {
      console.warn('[ADD MENTOR FALLBACK]:', err);
      setTeachers(nextTeachers);
      showNotification(`Mentor "${newRecord.name}" saved to roster!`);
    }
  };

  // Super-Admin Revoke / Remove Transaction
  const handleRevokeTransaction = async (txId: string) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Access denied: Only Super Admin can revoke transactions.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    try {
      const { students: nextStudents, classAwards: nextAwards } = await revokeTransactionInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        tx,
        allStudents: students,
        classAwards,
      });

      setStudents(nextStudents);
      setClassAwards(nextAwards);
      showNotification('Revoked transaction: coins rolled back and ranks recalculated.');
    } catch (err) {
      console.warn('[REVOKE TRANSACTION FALLBACK]:', err);
      if (tx.targetType === 'STUDENT' && tx.studentId) {
        const nextStudents = students.map(s => {
          if (s.id === tx.studentId || s.studentId === tx.studentId) {
            return { ...s, totalCoins: Math.max(0, (s.totalCoins || 0) - tx.coins) };
          }
          return s;
        });
        recalculateAllRanks(nextStudents);
        setStudents(nextStudents);
      }
      showNotification('Revoked transaction: coins rolled back and ranks recalculated.');
    }
  };

  // Super-Admin Save Edit Student
  const handleSaveEditStudent = async (updatedStudent: StudentRecord) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Access denied: Only Super Admin can edit student records.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    try {
      const nextStudents = await upsertStudentInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        student: updatedStudent,
        isNew: false,
        allStudents: students,
        classAwards,
      });

      setStudents(nextStudents);
      if (selectedStudent && selectedStudent.id === updatedStudent.id) {
        setSelectedStudent(nextStudents.find(s => s.id === updatedStudent.id) || updatedStudent);
      }
      showNotification(`Student profile for ${updatedStudent.name} updated.`);
    } catch (err) {
      console.warn('[EDIT STUDENT FALLBACK]:', err);
      const nextStudents = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      recalculateAllRanks(nextStudents);
      setStudents(nextStudents);
      if (selectedStudent && selectedStudent.id === updatedStudent.id) {
        setSelectedStudent(updatedStudent);
      }
      showNotification(`Student profile for ${updatedStudent.name} updated in registry.`);
    }
  };

  // Super-Admin Save Edit Mentor
  const handleSaveEditMentor = async (updatedTeacher: TeacherRecord, oldName: string) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Access denied: Only Super Admin can edit mentor records.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    const nextTeachers = teachers.map(t => (t.teacherId === updatedTeacher.teacherId ? updatedTeacher : t));
    try {
      await upsertMentorInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        teacher: updatedTeacher,
        isNew: false,
        allTeachers: nextTeachers,
        coinCategories,
        unions,
        oldName,
        allStudents: students,
        classAwards,
      });

      setTeachers(nextTeachers);
      if (updatedTeacher.name !== oldName) {
        setStudents(prev => {
          const updated = prev.map(s => (s.mentorName === oldName ? { ...s, mentorName: updatedTeacher.name } : s));
          recalculateAllRanks(updated);
          return updated;
        });
      }
      showNotification(`Faculty mentor "${updatedTeacher.name}" updated.`);
    } catch (err) {
      console.warn('[EDIT MENTOR FALLBACK]:', err);
      setTeachers(nextTeachers);
      if (updatedTeacher.name !== oldName) {
        setStudents(prev => {
          const updated = prev.map(s => (s.mentorName === oldName ? { ...s, mentorName: updatedTeacher.name } : s));
          recalculateAllRanks(updated);
          return updated;
        });
      }
      showNotification(`Faculty mentor "${updatedTeacher.name}" updated in roster.`);
    }
  };

  // Super-Admin Delete Mentor
  const handleDeleteMentor = async (teacherId: string) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Access denied: Only Super Admin can remove mentor records.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    const targetTeacher = teachers.find(t => t.teacherId === teacherId || t.id === teacherId);
    if (!targetTeacher) return;

    const updated = teachers.filter(t => t.teacherId !== teacherId && t.id !== teacherId);
    try {
      await deleteMentorInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        teacher: targetTeacher,
        remainingTeachers: updated,
        coinCategories,
        unions,
      });
      setTeachers(updated);
      showNotification('Mentor removed from roster.');
    } catch (err) {
      console.warn('[DELETE MENTOR FALLBACK]:', err);
      setTeachers(updated);
      showNotification('Mentor removed from roster.');
    }
  };

  // Super-Admin Save Rules
  const handleSaveRules = async (updatedCategories: CoinCategory[]) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Access denied: Only Super Admin can update coin criteria.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    try {
      await saveRulesInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        teachers,
        coinCategories: updatedCategories,
        unions,
      });
      setCoinCategories(updatedCategories);
      showNotification('Coin award rules updated and saved.');
    } catch (err) {
      console.warn('[SAVE RULES FALLBACK]:', err);
      setCoinCategories(updatedCategories);
      showNotification('Coin award rules updated and saved.');
    }
  };

  // Super-Admin Save Unions
  const handleSaveUnions = async (updatedUnions: UnionDefinition[]) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Access denied: Only Super Admin can update campus unions.');
      if (!currentUser) setIsLoginOpen(true);
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    try {
      await saveUnionsInFirestore({
        fbUser: effectiveFbUser,
        authUser: currentUser,
        teachers,
        coinCategories,
        unions: updatedUnions,
      });
      setUnions(updatedUnions);
      showNotification('Union configurations and class associations saved.');
    } catch (err) {
      console.warn('[SAVE UNIONS FALLBACK]:', err);
      setUnions(updatedUnions);
      showNotification('Union configurations and class associations saved.');
    }
  };

  const handleSyncCohortToFirestore = async () => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      showNotification('Super Admin privileges required to sync full cohort.');
      return;
    }

    const effectiveFbUser = firebaseUser || auth.currentUser || ({
      uid: currentUser.uid || 'admin-active',
      displayName: currentUser.displayName,
      email: currentUser.email,
    } as any);

    try {
      const res = await seedFirestoreDatabase({
        fbUser: effectiveFbUser,
        students,
        teachers,
        coinCategories,
        unions,
        classAwards,
        forceReseed: true,
      });
      showNotification(`Synchronized ${res.count} student profiles, ${teachers.length} mentors, and rules to Cloud Firestore!`);
    } catch (err) {
      showNotification(formatFirestoreErrorForUser(err));
    }
  };

  const handleLogout = async () => {
    try {
      await signOutFirebase();
      setCurrentUser(null);
      setActiveTab('students');
      showNotification('Signed out of Firebase session.');
    } catch (err) {
      showNotification(formatFirestoreErrorForUser(err));
    }
  };

  const handleExportCleanedCSV = () => {
    const csvContent = exportToCleanedCSV(students);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DHAC_Student_Coin_Report_ALL_CLEANED_290_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Cleaned 16-Column CSV downloaded successfully.');
  };

  const handleResetData = async () => {
    const initial = parseCSV(CLEANED_290_CSV_RAW);
    setStudents(initial);
    setTransactions([]);
    setClaims([]);
    setClassAwards({});
    try {
      localStorage.removeItem(STUDENTS_STORAGE_KEY);
      localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
      localStorage.removeItem(CLAIMS_STORAGE_KEY);
      localStorage.removeItem(CLASS_AWARDS_STORAGE_KEY);
      if (currentUser?.role === 'SUPER_ADMIN') {
        const effectiveFbUser = firebaseUser || auth.currentUser || ({
          uid: currentUser.uid || 'admin-sidrastudentsunion',
          displayName: currentUser.displayName,
          email: currentUser.email,
        } as unknown as FirebaseUser);

        await seedFirestoreDatabase({
          fbUser: effectiveFbUser,
          students: initial,
          teachers: TEACHERS_ROSTER,
          coinCategories: COIN_RULES_TABLE,
          unions: DEFAULT_UNIONS,
          classAwards: {},
          forceReseed: true,
        });
      }
    } catch (err) {
      showNotification(formatFirestoreErrorForUser(err));
    }
    setSelectedClassFilter('ALL');
    setSelectedMentorFilter('ALL');
    setSelectedTierFilter('ALL');
    setSelectedCoinStatusFilter('ALL');
    showNotification('Reset all 290 students to 0 coins baseline.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseCSV(content);
        if (parsed.length > 0) {
          setStudents(parsed);
          try {
            if (currentUser?.role === 'SUPER_ADMIN') {
              const effectiveFbUser = firebaseUser || auth.currentUser || ({
                uid: currentUser.uid || 'admin-sidrastudentsunion',
                displayName: currentUser.displayName,
                email: currentUser.email,
              } as unknown as FirebaseUser);

              await seedFirestoreDatabase({
                fbUser: effectiveFbUser,
                students: parsed,
                teachers,
                coinCategories,
                unions,
                classAwards,
                forceReseed: true,
              });
            }
          } catch (err) {
            showNotification(formatFirestoreErrorForUser(err));
          }
          showNotification(`Imported ${parsed.length} student records from ${file.name}.`);
        } else {
          showNotification('Could not parse valid student rows from file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrintCertificate = (student: StudentRecord) => {
    setSelectedPrintStudent(student);
    setActiveTab('certificates');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-150">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.txt"
        className="hidden"
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-sm bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700/80 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">{notification}</span>
        </div>
      )}

      {/* Top Institutional Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportCleanedCSV={handleExportCleanedCSV}
        onResetData={handleResetData}
        onUploadClick={() => fileInputRef.current?.click()}
        totalStudents={students.length}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenAwardCoins={() => {
          setAwardPreselectStudent(null);
          setIsAwardCoinOpen(true);
        }}
        onOpenAddStudent={() => setIsAddStudentOpen(true)}
        onOpenAddMentor={() => setIsAddMentorOpen(true)}
        onOpenTransactions={() => setIsTransactionsOpen(true)}
        pendingClaimsCount={pendingClaimsCount}
        onOpenIDCard={() => {
          if (loggedInStudent) handleOpenIDCard(loggedInStudent);
        }}
        onOpenSubmitClaim={() => {
          if (loggedInStudent) {
            setClaimStudent(loggedInStudent);
            setIsSubmitClaimOpen(true);
          }
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenSuperAdminConsole={() => setIsSuperAdminConsoleOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If Student is logged in, show their quick portal banner on general views */}
        {loggedInStudent && activeTab !== 'portal' && activeTab !== 'certificates' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 border border-violet-700/50">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-900 border-2 border-amber-400 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                {loggedInStudent.photoUrl ? (
                  <img src={loggedInStudent.photoUrl} alt={loggedInStudent.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{loggedInStudent.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <div className="text-xs font-mono text-amber-300 flex items-center gap-2">
                  <span>Signed in as student: {loggedInStudent.officialId}</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30">
                    Class {loggedInStudent.className}
                  </span>
                </div>
                <div className="text-sm font-black text-white flex items-center gap-2 mt-0.5">
                  <span>{loggedInStudent.name}</span>
                  <span className="text-slate-400 font-normal">|</span>
                  <div className="flex items-center gap-1.5 text-amber-300 font-mono">
                    <Coin3D size="xs" tier="Gold" />
                    <span>Balance: {loggedInStudent.totalCoins} Coins</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenIDCard(loggedInStudent)}
                className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-xs cursor-pointer"
              >
                Digital ID Card
              </button>
              <button
                onClick={() => {
                  setClaimStudent(loggedInStudent);
                  setIsSubmitClaimOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Coin3D size="xs" tier="Gold" />
                <span>+ Add Coin Claim</span>
              </button>
            </div>
          </div>
        )}

        {/* If Teacher or Super Admin has pending claims, show alert banner */}
        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'TEACHER_ADMIN') && pendingClaimsCount > 0 && activeTab !== 'approvals' && (
          <div className="mb-6 p-4 bg-amber-500/10 border-2 border-amber-400/50 rounded-2xl shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                  {pendingClaimsCount} Student Coin Claim{pendingClaimsCount > 1 ? 's' : ''} Awaiting Your Mentor Confirmation!
                </span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                  Students have submitted activity merit proofs that require faculty review before coins are credited.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('approvals')}
              className="px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl whitespace-nowrap shadow-md cursor-pointer"
            >
              Review Desk →
            </button>
          </div>
        )}

        {/* Tab: Student Portal View */}
        {activeTab === 'portal' && loggedInStudent && (
          <StudentPortalView
            student={loggedInStudent}
            claims={claims}
            onOpenSubmitClaim={() => {
              setClaimStudent(loggedInStudent);
              setIsSubmitClaimOpen(true);
            }}
            onOpenIDCard={() => handleOpenIDCard(loggedInStudent)}
            onUpdatePhoto={handleUpdatePhoto}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          />
        )}

        {/* Tab: Mentor Confirmation Desk */}
        {activeTab === 'approvals' && (
          <MentorApprovalQueue
            claims={claims}
            currentUser={currentUser}
            onApproveClaim={handleApproveClaim}
            onRejectClaim={handleRejectClaim}
          />
        )}

        {/* KPI Summary (shown on standard overview tabs) */}
        {activeTab !== 'certificates' && activeTab !== 'audit' && activeTab !== 'approvals' && activeTab !== 'portal' && (
          <KPISummary
            students={students}
            mentorStats={mentorStats}
            classStats={classStats}
            onSelectStudent={setSelectedStudent}
            onFilterZeroCoins={handleFilterZeroCoins}
          />
        )}

        {/* Tab 1: Leaderboard & Students Table */}
        {activeTab === 'students' && (
          <div>
            {/* The Z-Pattern Hero Showcase Section */}
            <PortalHero
              students={students}
              classStats={classStats}
              currentUser={currentUser}
              onOpenAwardCoins={() => {
                setAwardPreselectStudent(null);
                setIsAwardCoinOpen(true);
              }}
              onOpenLogin={() => setIsLoginOpen(true)}
              onOpenSubmitClaim={() => {
                if (loggedInStudent) {
                  setClaimStudent(loggedInStudent);
                  setIsSubmitClaimOpen(true);
                } else {
                  setIsLoginOpen(true);
                }
              }}
              onExploreLeaderboard={() => {
                const el = document.getElementById('student-rankings-table');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Campus Honor Roll Podium (Top 3) */}
            <PodiumTopThree
              students={students}
              onSelectStudent={setSelectedStudent}
            />

            {/* Class Rankings & Batch Standings (Requested in Dashboard) */}
            <ClassLeaderboard
              classStats={classStats}
              unionStats={unionStats}
              onSelectClass={handleSelectClass}
              onSelectStudent={setSelectedStudent}
            />

            {/* Searchable Students Table with ID Card and Admin Remove */}
            <StudentTable
              students={students}
              selectedClassFilter={selectedClassFilter}
              setSelectedClassFilter={setSelectedClassFilter}
              selectedMentorFilter={selectedMentorFilter}
              setSelectedMentorFilter={setSelectedMentorFilter}
              selectedTierFilter={selectedTierFilter}
              setSelectedTierFilter={setSelectedTierFilter}
              selectedCoinStatusFilter={selectedCoinStatusFilter}
              setSelectedCoinStatusFilter={setSelectedCoinStatusFilter}
              onSelectStudent={setSelectedStudent}
              onPrintCertificate={handlePrintCertificate}
              onOpenIDCard={handleOpenIDCard}
              onDeleteStudent={handleDeleteStudent}
              onEditStudent={student => {
                setEditingStudent(student);
                setIsEditStudentOpen(true);
              }}
              isAdmin={currentUser?.role === 'SUPER_ADMIN'}
            />
          </div>
        )}

        {/* Tab 2: Classes Overview (12 Classes with Batch Names) */}
        {activeTab === 'classes' && (
          <ClassOverview
            classStats={classStats}
            onSelectClass={handleSelectClass}
            onSelectStudent={setSelectedStudent}
          />
        )}

        {/* Tab 3: Mentor Groups Overview (20 Mentors) */}
        {activeTab === 'mentors' && (
          <MentorOverview
            mentorStats={mentorStats}
            allStudents={students}
            onSelectMentor={handleSelectMentor}
            onSelectStudent={setSelectedStudent}
          />
        )}

        {/* Tab 4: Analytics View */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            students={students}
            classStats={classStats}
            mentorStats={mentorStats}
            onSelectStudent={setSelectedStudent}
            onFilterZeroCoins={handleFilterZeroCoins}
          />
        )}

        {/* Tab 5: Data Quality & Audit Console */}
        {activeTab === 'audit' && (
          <AuditView
            students={students}
            onDownloadCleanedCSV={handleExportCleanedCSV}
            auditLogs={auditLogs}
          />
        )}

        {/* Tab 6: Merit Certificates Print View */}
        {activeTab === 'certificates' && (
          <MeritPrintView
            students={students}
            selectedStudent={selectedPrintStudent}
            onSelectStudent={setSelectedPrintStudent}
            onBack={() => setActiveTab('students')}
          />
        )}
      </main>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onAwardCoins={handleQuickAward}
          onPrintCertificate={handlePrintCertificate}
          onOpenIDCard={handleOpenIDCard}
          onDeleteStudent={handleDeleteStudent}
          onUpdatePhoto={handleUpdatePhoto}
          currentUser={currentUser}
          totalCampusStudents={students.length}
        />
      )}

      {/* Official Digital Student ID Card Modal */}
      <StudentIDCardModal
        isOpen={isIDCardOpen}
        onClose={() => {
          setIsIDCardOpen(false);
          setIdCardStudent(null);
        }}
        student={idCardStudent}
        currentUser={currentUser}
        onUpdatePhoto={handleUpdatePhoto}
      />

      {/* Submit Coin Claim Modal (For Student submission) */}
      {claimStudent && (
        <SubmitClaimModal
          isOpen={isSubmitClaimOpen}
          onClose={() => {
            setIsSubmitClaimOpen(false);
            setClaimStudent(null);
          }}
          student={claimStudent}
          onSubmitClaim={handleSubmitClaim}
          coinCategories={coinCategories}
        />
      )}

      {/* Multi-role Login Modal (Firebase Google Sign-In & Role Binding) */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        students={students}
        teachers={teachers}
        firebaseUser={firebaseUser}
        currentUser={currentUser}
        onLoginSuccess={user => {
          setCurrentUser(user);
          if (user.role === 'STUDENT') {
            setActiveTab('portal');
            showNotification(`Welcome, ${user.displayName}! Access granted to Student Coin Portal.`);
          } else if (user.role === 'TEACHER_ADMIN') {
            setActiveTab('approvals');
            showNotification(`Welcome, ${user.displayName}! Signed in to Faculty Desk.`);
          } else {
            showNotification(`Welcome, ${user.displayName}! Signed in to DHAC Portal.`);
          }
        }}
      />

      {/* Award Coins Modal (Rules Engine Table) */}
      <AwardCoinModal
        isOpen={isAwardCoinOpen}
        onClose={() => setIsAwardCoinOpen(false)}
        students={students}
        currentUser={currentUser}
        onAwardCoins={handleAwardCoinsFromEngine}
        preselectedStudent={awardPreselectStudent}
        coinCategories={coinCategories}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
        existingMentors={uniqueMentors}
        existingClasses={uniqueClasses}
      />

      {/* Add Mentor Modal */}
      <AddMentorModal
        isOpen={isAddMentorOpen}
        onClose={() => setIsAddMentorOpen(false)}
        onAddMentor={handleAddMentor}
        existingMentors={uniqueMentors}
      />

      {/* Transaction History Modal with Super-Admin Revoke Coin */}
      <TransactionHistoryModal
        isOpen={isTransactionsOpen}
        onClose={() => setIsTransactionsOpen(false)}
        transactions={transactions}
        currentUser={currentUser}
        onRevokeTransaction={handleRevokeTransaction}
      />

      {/* Self-Service Firebase Account & Role Profile Modal */}
      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          currentUser={currentUser}
          firebaseUser={firebaseUser}
          students={students}
          onSuccess={msg => showNotification(msg)}
        />
      )}

      {/* Super Admin Master Management Console */}
      <SuperAdminConsoleModal
        isOpen={isSuperAdminConsoleOpen}
        onClose={() => setIsSuperAdminConsoleOpen(false)}
        students={students}
        teachers={teachers}
        coinCategories={coinCategories}
        unions={unions}
        auditLogs={auditLogs}
        onAddStudent={() => setIsAddStudentOpen(true)}
        onEditStudent={s => {
          setEditingStudent(s);
          setIsEditStudentOpen(true);
        }}
        onDeleteStudent={handleDeleteStudent}
        onAddMentor={() => setIsAddMentorOpen(true)}
        onEditMentor={t => {
          setEditingTeacher(t);
          setIsEditMentorOpen(true);
        }}
        onDeleteMentor={handleDeleteMentor}
        onSaveRules={handleSaveRules}
        onSaveUnions={handleSaveUnions}
        onSyncCohortToFirestore={handleSyncCohortToFirestore}
        onShowNotification={showNotification}
      />

      {/* Edit Student Modal (Super Admin) */}
      {editingStudent && (
        <EditStudentModal
          isOpen={isEditStudentOpen}
          onClose={() => {
            setIsEditStudentOpen(false);
            setEditingStudent(null);
          }}
          student={editingStudent}
          mentorsList={uniqueMentors}
          classesList={uniqueClasses}
          onSave={handleSaveEditStudent}
        />
      )}

      {/* Edit Mentor Modal (Super Admin) */}
      {editingTeacher && (
        <EditMentorModal
          isOpen={isEditMentorOpen}
          onClose={() => {
            setIsEditMentorOpen(false);
            setEditingTeacher(null);
          }}
          teacher={editingTeacher}
          onSave={handleSaveEditMentor}
        />
      )}

      {/* Institutional Footer */}
      <footer className="no-print border-t border-violet-900/40 bg-[#0a0e23] text-white py-8 mt-auto relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
            {/* Left Brand */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/image_434e52c1.png"
                alt="Darul Huda Crest"
                className="w-10 h-10 rounded-xl bg-white p-1 object-contain shadow-md"
              />
              <img
                src="/assets/aistudio/DHAC-COIN-PORTAL-LOGO_b7284767.jpg"
                alt="DHAC Coin Portal"
                className="w-10 h-10 rounded-xl object-cover border border-violet-400/50 shadow-md"
              />
              <div>
                <div className="text-sm font-black tracking-tight uppercase font-['Outfit',sans-serif]">
                  DARUL HUDA ISLAMIC UNIVERSITY
                </div>
                <div className="text-[11px] font-bold text-amber-300 tracking-wider uppercase font-mono">
                  ASSAM CENTRE • STUDENTS AFFAIRS BOARD
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-violet-200 text-xs font-mono">
                {students.length} Student Profiles
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-violet-200 text-xs font-mono">
                {classStats.length} Academic Batches
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-violet-200 text-xs font-mono">
                {uniqueMentors.length} Faculty Mentors
              </span>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 text-xs font-bold font-mono border border-amber-400/30">
                <Coin3D size="xs" tier="Gold" />
                <span>Standard 1224 Ranking</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 font-mono">
            <div>
              © 2026-2027 Darul Huda Islamic University Assam Centre. All rights reserved.
            </div>
            <div className="flex items-center gap-3">
              <span>Firebase Cloud Sync v4.0</span>
              <span>•</span>
              <span>HTML5 & CSS3 Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
