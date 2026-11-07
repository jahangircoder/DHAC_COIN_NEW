import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Users,
  Award,
  KeyRound,
  Edit,
  Trash2,
  Plus,
  Search,
  Save,
  Shield,
  Layers,
  Coins,
  CloudUpload,
  CheckCircle2,
  UserCog,
} from 'lucide-react';
import {
  StudentRecord,
  TeacherRecord,
  UnionDefinition,
  AuditLogEntry,
  AuthUser,
} from '../types/student';
import { CoinCategory } from '../data/coinRules';
import {
  ManagedUserDirectoryItem,
  subscribeToUserDirectoryForAdmin,
  assignUserRoleBySuperAdmin,
} from '../services/firebaseAuthService';
import { formatFirestoreErrorForUser } from '../lib/firestoreErrors';

interface SuperAdminConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
  teachers: TeacherRecord[];
  coinCategories: CoinCategory[];
  unions: UnionDefinition[];
  auditLogs?: AuditLogEntry[];
  onAddStudent: () => void;
  onEditStudent: (student: StudentRecord) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddMentor: () => void;
  onEditMentor: (teacher: TeacherRecord) => void;
  onDeleteMentor: (teacherId: string) => void;
  onSaveRules: (updatedCategories: CoinCategory[]) => void;
  onSaveUnions: (updatedUnions: UnionDefinition[]) => void;
  onSyncCohortToFirestore?: () => Promise<void>;
  onShowNotification: (msg: string) => void;
}

export const SuperAdminConsoleModal: React.FC<SuperAdminConsoleModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  coinCategories,
  unions,
  auditLogs = [],
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onAddMentor,
  onEditMentor,
  onDeleteMentor,
  onSaveRules,
  onShowNotification,
  onSyncCohortToFirestore,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'mentors' | 'rules' | 'unions' | 'rbac'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [rbacSearch, setRbacSearch] = useState('');
  const [rulesState, setRulesState] = useState<CoinCategory[]>(coinCategories);
  const [managedUsers, setManagedUsers] = useState<ManagedUserDirectoryItem[]>([]);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AuthUser['role']>('STUDENT');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  useEffect(() => {
    setRulesState(coinCategories);
  }, [coinCategories]);

  useEffect(() => {
    if (!isOpen || activeTab !== 'rbac') return;
    const unsub = subscribeToUserDirectoryForAdmin((users) => {
      setManagedUsers(users);
    });
    return () => unsub();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleTriggerFullSync = async () => {
    if (!onSyncCohortToFirestore) return;
    setIsSyncingDb(true);
    try {
      await onSyncCohortToFirestore();
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleSaveUserRole = async (userItem: ManagedUserDirectoryItem) => {
    try {
      const chosenMentor =
        selectedRole === 'TEACHER_ADMIN'
          ? teachers.find(
              (t) => t.teacherId === selectedMentorId || t.id === selectedMentorId
            ) || null
          : null;
      const chosenStudent =
        selectedRole === 'STUDENT'
          ? students.find(
              (s) => s.id === selectedStudentId || s.adNo === selectedStudentId
            ) || null
          : null;

      await assignUserRoleBySuperAdmin({
        targetUid: userItem.uid,
        role: selectedRole,
        displayName:
          chosenMentor?.name || chosenStudent?.name || userItem.displayName,
        mentor: chosenMentor,
        student: chosenStudent,
      });

      onShowNotification(
        `Updated Firebase RBAC role for ${userItem.displayName} to ${selectedRole}.`
      );
      setEditingUid(null);
    } catch (err) {
      onShowNotification(formatFirestoreErrorForUser(err));
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.adNo.includes(searchQuery) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mentorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.assignedEmail && t.assignedEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = managedUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(rbacSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(rbacSearch.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(rbacSearch.toLowerCase())) ||
      (u.adNo && u.adNo.includes(rbacSearch))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Super Admin Management Console
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/30">
                  Firebase Cloud Sync Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage student records, faculty mentors, coin criteria, academic unions & Firebase RBAC roles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSyncCohortToFirestore && (
              <button
                type="button"
                onClick={handleTriggerFullSync}
                disabled={isSyncingDb}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition cursor-pointer disabled:opacity-60"
                title="Push & verify all 290 student records, mentors, rules, and unions in Cloud Firestore"
              >
                <CloudUpload className="w-3.5 h-3.5 text-amber-300" />
                <span>{isSyncingDb ? 'Syncing Firestore...' : 'Sync Cohort to Cloud'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'students'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students ({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'mentors'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Faculty Mentors ({teachers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Coin Rules Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('unions')}
            className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'unions'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Academic Unions ({unions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'rbac'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Firebase RBAC & Access</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TAB 1: STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by student name or AD number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  onClick={onAddStudent}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Student</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-10 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5">AD No</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Class</th>
                        <th className="p-2.5">Mentor</th>
                        <th className="p-2.5 text-right">Coins</th>
                        <th className="p-2.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredStudents.slice(0, 100).map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {s.adNo}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                            {s.name}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">
                            {s.className}
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[160px]">
                            {s.mentorName}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                            {s.totalCoins}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditStudent(s)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                                title="Edit Student Profile"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (deletingStudentId === s.id) {
                                    onDeleteStudent(s.id);
                                    setDeletingStudentId(null);
                                  } else {
                                    setDeletingStudentId(s.id);
                                    setTimeout(() => setDeletingStudentId(prev => (prev === s.id ? null : prev)), 4000);
                                  }
                                }}
                                className={`p-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                                  deletingStudentId === s.id
                                    ? 'bg-rose-600 text-white font-semibold text-[10px] px-2'
                                    : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700'
                                }`}
                                title={deletingStudentId === s.id ? 'Click to confirm delete' : 'Delete Student'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {deletingStudentId === s.id && <span>Confirm</span>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENTORS */}
          {activeTab === 'mentors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Active Faculty Mentors ({teachers.length}) — Link Google emails to pre-authorize faculty accounts
                </span>
                <button
                  onClick={onAddMentor}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Mentor</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Staff ID</th>
                      <th className="p-2.5">Faculty Name</th>
                      <th className="p-2.5">Authorized Google Email</th>
                      <th className="p-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {filteredTeachers.map((t) => (
                      <tr key={t.teacherId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 text-emerald-800 dark:text-emerald-400 font-bold">
                          {t.teacherId}
                        </td>
                        <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-slate-100">
                          {t.name}
                        </td>
                        <td className="p-2.5 text-xs">
                          {t.assignedEmail ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-semibold">
                              {t.assignedEmail}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Click edit to link Gmail</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditMentor(t)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                              title="Edit Mentor & Authorized Google Email"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (deletingTeacherId === t.teacherId) {
                                  onDeleteMentor(t.teacherId);
                                  setDeletingTeacherId(null);
                                } else {
                                  setDeletingTeacherId(t.teacherId);
                                  setTimeout(() => setDeletingTeacherId(prev => (prev === t.teacherId ? null : prev)), 4000);
                                }
                              }}
                              className={`p-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                                deletingTeacherId === t.teacherId
                                  ? 'bg-rose-600 text-white font-semibold text-[10px] px-2'
                                  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700'
                              }`}
                              title={deletingTeacherId === t.teacherId ? 'Click to confirm delete' : 'Delete Mentor'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {deletingTeacherId === t.teacherId && <span>Confirm</span>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COIN RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Merit Points & Coin Value Matrix Configuration ({rulesState.length} Categories)
                </span>
                <button
                  onClick={() => {
                    onSaveRules(rulesState);
                    onShowNotification('Saved updated coin criteria rules to Cloud Firestore.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Save Rules to Firestore</span>
                </button>
              </div>

              <div className="space-y-3">
                {rulesState.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase mb-2">
                      {cat.categoryName} ({cat.activities.length} activities)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {cat.activities.map((act) => (
                        <div
                          key={act.id}
                          className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between"
                        >
                          <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[220px]">
                            {act.name}
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 shrink-0">
                            {act.coins === 'custom' ? 'Custom' : `+${act.coins}c`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: UNIONS */}
          {activeTab === 'unions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Student Union Cohorts Configuration ({unions.length} Unions)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unions.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {u.unionName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {u.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Associated Classes:
                      </span>
                      {u.classes.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 rounded font-mono text-xs font-bold"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FIREBASE RBAC & ACCESS CONTROL */}
          {activeTab === 'rbac' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Firebase Security Rules Enforcement:</strong> All roles (<code className="font-mono">SUPER_ADMIN</code>, <code className="font-mono">TEACHER_ADMIN</code>, <code className="font-mono">STUDENT</code>) are enforced server-side in Cloud Firestore. You can promote signed-in Google accounts below or pre-link faculty emails in the Mentors tab.
                  </span>
                </div>
                {onSyncCohortToFirestore && (
                  <button
                    type="button"
                    onClick={handleTriggerFullSync}
                    disabled={isSyncingDb}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isSyncingDb ? 'Syncing...' : 'Sync 290 Cohort Now'}</span>
                  </button>
                )}
              </div>

              {/* Filter Users */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search signed-in Firebase users by name, role, or AD No..."
                  value={rbacSearch}
                  onChange={(e) => setRbacSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Registered Firebase Accounts Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[38vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 font-bold">
                      <tr>
                        <th className="p-2.5">Active Role</th>
                        <th className="p-2.5">Display Identity</th>
                        <th className="p-2.5">Linked Entity</th>
                        <th className="p-2.5 text-center">Assign Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500 font-sans">
                            No signed-in Firebase user documents match your filter yet. Users appear automatically upon Google Sign-In.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isEditing = editingUid === u.uid;
                          return (
                            <tr key={u.uid} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                    u.role === 'SUPER_ADMIN'
                                      ? 'bg-amber-400 text-slate-950'
                                      : u.role === 'TEACHER_ADMIN'
                                      ? 'bg-emerald-700 text-white'
                                      : u.role === 'STUDENT'
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-2.5 font-sans font-bold text-slate-900 dark:text-slate-100">
                                {u.displayName}
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                {u.mentorName
                                  ? `Mentor: ${u.mentorName}`
                                  : u.adNo
                                  ? `Student: AD #${u.adNo} (${u.className})`
                                  : `UID: ${u.uid.slice(0, 10)}...`}
                              </td>
                              <td className="p-2.5 text-center font-sans">
                                {!isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUid(u.uid);
                                      setSelectedRole(u.role);
                                      setSelectedMentorId(
                                        u.teacherId || teachers[0]?.teacherId || ''
                                      );
                                      setSelectedStudentId(
                                        u.studentDocId || students[0]?.id || ''
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                  >
                                    <UserCog className="w-3.5 h-3.5" />
                                    <span>Edit Role</span>
                                  </button>
                                ) : (
                                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                                    <select
                                      value={selectedRole}
                                      onChange={(e) =>
                                        setSelectedRole(e.target.value as AuthUser['role'])
                                      }
                                      className="px-2 py-1 border rounded text-xs bg-white dark:bg-slate-900"
                                    >
                                      <option value="VIEWER">VIEWER</option>
                                      <option value="STUDENT">STUDENT</option>
                                      <option value="TEACHER_ADMIN">TEACHER_ADMIN</option>
                                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                    </select>

                                    {selectedRole === 'TEACHER_ADMIN' && (
                                      <select
                                        value={selectedMentorId}
                                        onChange={(e) => setSelectedMentorId(e.target.value)}
                                        className="px-2 py-1 border rounded text-xs bg-white dark:bg-slate-900 max-w-[160px]"
                                      >
                                        {teachers.map((t) => (
                                          <option key={t.teacherId} value={t.teacherId}>
                                            {t.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    {selectedRole === 'STUDENT' && (
                                      <select
                                        value={selectedStudentId}
                                        onChange={(e) => setSelectedStudentId(e.target.value)}
                                        className="px-2 py-1 border rounded text-xs bg-white dark:bg-slate-900 max-w-[160px]"
                                      >
                                        {students.slice(0, 100).map((s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.adNo} - {s.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleSaveUserRole(u)}
                                      className="px-2.5 py-1 bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingUid(null)}
                                      className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Cloud Firestore Audit Logs */}
              {auditLogs.length > 0 && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recent Immutable Firestore Audit Entries ({auditLogs.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] font-mono">
                    {auditLogs.slice(0, 15).map((log) => (
                      <div
                        key={log.id}
                        className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <span className="text-slate-800 dark:text-slate-200 truncate">
                          <strong className="text-emerald-700 dark:text-emerald-400">
                            [{log.action}]
                          </strong>{' '}
                          {log.summary}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {log.actorName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>DHAC Central Administration Console • Firestore Security Rules Active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
