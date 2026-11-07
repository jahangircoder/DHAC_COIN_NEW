import React, { useState, useMemo } from 'react';
import {
  X,
  UserCheck,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AuthUser, StudentRecord } from '../types/student';
import { db } from '../lib/firebase';
import { boundNonEmptyString } from '../lib/validation';
import { linkCurrentUserToStudent } from '../services/firebaseAuthService';
import { formatFirestoreErrorForUser, handleFirestoreError, OperationType } from '../lib/firestoreErrors';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  firebaseUser?: FirebaseUser | null;
  students?: StudentRecord[];
  onSuccess: (message: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  firebaseUser,
  students = [],
  onSuccess,
}) => {
  const [displayNameInput, setDisplayNameInput] = useState(currentUser.displayName);
  const [selectedClass, setSelectedClass] = useState('S4');
  const [adNoInput, setAdNoInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableClasses = useMemo(
    () => Array.from(new Set(students.map((s) => s.className))).sort(),
    [students]
  );

  const matchedStudent = useMemo(() => {
    const clean = adNoInput.trim().toUpperCase().replace('*', '');
    if (!clean) return null;
    return (
      students.find(
        (s) =>
          s.className === selectedClass &&
          s.adNo.toUpperCase().replace('*', '') === clean
      ) ||
      students.find((s) => s.adNo.toUpperCase().replace('*', '') === clean) ||
      null
    );
  }, [students, selectedClass, adNoInput]);

  if (!isOpen) return null;

  const handleUpdateDisplay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayNameInput.trim()) {
      setError('Display name cannot be empty.');
      return;
    }

    if (!firebaseUser) {
      setError('Please sign in with Google first.');
      return;
    }

    setLoading(true);
    try {
      const cleanName = boundNonEmptyString(displayNameInput.trim(), 120, currentUser.displayName);
      try {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          displayName: cleanName,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
      }
      onSuccess(`Updated profile name to "${cleanName}" in Firestore.`);
      onClose();
    } catch (err) {
      setError(formatFirestoreErrorForUser(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBindStudentProfile = async () => {
    if (!firebaseUser || !matchedStudent) return;
    setError(null);
    setLoading(true);
    try {
      await linkCurrentUserToStudent(firebaseUser, matchedStudent);
      onSuccess(`Verified and linked student profile: ${matchedStudent.name} (AD #${matchedStudent.adNo})!`);
      onClose();
    } catch (err) {
      setError(formatFirestoreErrorForUser(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 relative flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Firebase Account & Role Profile
              </h2>
              <p className="text-xs text-slate-300">
                Verified identity for {currentUser.displayName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdateDisplay} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Google Email:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {firebaseUser?.email || currentUser.email || 'Verified Session'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned RBAC Role:</span>
              <span className="px-2 py-0.5 rounded bg-violet-600 text-white font-mono font-bold text-[10px]">
                {currentUser.role}
              </span>
            </div>
            {currentUser.adNo && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Linked Student:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  AD #{currentUser.adNo} ({currentUser.className})
                </span>
              </div>
            )}
            {currentUser.mentorName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Linked Mentor:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {currentUser.mentorName}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Portal Display Name
            </label>
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="Enter display name"
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900 dark:text-white"
            />
          </div>

          {currentUser.role === 'VIEWER' && students.length > 0 && (
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2.5 text-xs">
              <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Link Student Admission Number</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                >
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={adNoInput}
                  onChange={(e) => setAdNoInput(e.target.value)}
                  placeholder="AD No (e.g. 635)"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                />
              </div>
              {matchedStudent && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {matchedStudent.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleBindStudentProfile}
                    disabled={loading}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold text-[11px] shrink-0 cursor-pointer inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Bind Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Passwords & multi-factor security are managed directly by your Google Firebase account.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Saving...' : 'Save Display Name'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
