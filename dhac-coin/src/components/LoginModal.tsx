import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Lock,
  Shield,
  User,
  CheckCircle2,
  GraduationCap,
  Award,
  Sparkles,
  LogOut,
  KeyRound,
  Mail,
  ArrowRight,
  AlertCircle,
  Hash,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthUser, StudentRecord, TeacherRecord } from '../types/student';
import {
  loginUserWithRole,
  signUpStudentUser,
  signUpTeacherUser,
  signOutFirebase,
} from '../services/firebaseAuthService';
import { BOOTSTRAP_SUPER_ADMIN_EMAIL } from '../lib/firebase';
import { formatFirestoreErrorForUser } from '../lib/firestoreErrors';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: AuthUser) => void;
  students: StudentRecord[];
  teachers?: TeacherRecord[];
  firebaseUser?: FirebaseUser | null;
  currentUser?: AuthUser | null;
}

type RoleTab = 'STUDENT' | 'TEACHER_ADMIN' | 'SUPER_ADMIN';
type AuthMode = 'login' | 'signup';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  students,
  teachers = [],
  firebaseUser,
  currentUser,
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleTab>('STUDENT');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Form input fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up fields
  const [signUpAdNo, setSignUpAdNo] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // When switching to Admin role, always lock into login mode and set default admin email
  useEffect(() => {
    if (selectedRole === 'SUPER_ADMIN') {
      setAuthMode('login');
      if (!loginIdentifier || loginIdentifier.includes('@') === false) {
        setLoginIdentifier('sidrastudentsunion@gmail.com');
      }
    }
    setError(null);
    setSuccessMessage(null);
  }, [selectedRole]);

  // Live matching student from 290 roster when typing AD number
  const matchedStudentByAd = useMemo(() => {
    const clean = signUpAdNo.trim().toUpperCase().replace('*', '');
    if (!clean) return null;
    return (
      students.find(
        (s) =>
          s.adNo.toUpperCase().replace('*', '') === clean ||
          s.studentId.toUpperCase() === clean ||
          s.id.toUpperCase() === clean
      ) || null
    );
  }, [signUpAdNo, students]);

  // Live match teacher by username or email
  const matchedTeacherSignup = useMemo(() => {
    const cleanUser = signUpUsername.trim().toLowerCase();
    const cleanMail = signUpEmail.trim().toLowerCase();
    if (!cleanUser && !cleanMail) return null;
    return (
      teachers.find(
        (t) =>
          (cleanUser && t.username.toLowerCase() === cleanUser) ||
          (cleanMail && t.assignedEmail && t.assignedEmail.toLowerCase() === cleanMail) ||
          (cleanUser && t.teacherId.toLowerCase() === cleanUser)
      ) || null
    );
  }, [signUpUsername, signUpEmail, teachers]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim()) {
      setError(
        selectedRole === 'STUDENT'
          ? 'Please enter your Admission Number (AD) or Email/Username.'
          : 'Please enter your Email or Username.'
      );
      return;
    }

    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUserWithRole({
        role: selectedRole,
        identifier: loginIdentifier.trim(),
        password: loginPassword,
        students,
        teachers,
      });
      setSuccessMessage(`Welcome back, ${user.displayName}!`);
      onLoginSuccess?.(user);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || formatFirestoreErrorForUser(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!signUpAdNo.trim()) {
      setError('Please enter your Admission Number (AD).');
      return;
    }

    if (!matchedStudentByAd) {
      setError(
        `Admission Number #${signUpAdNo.trim()} not found in the official 290-student registry. Please check your AD number.`
      );
      return;
    }

    if (!signUpUsername.trim() || signUpUsername.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await signUpStudentUser({
        adNo: signUpAdNo.trim(),
        username: signUpUsername.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        students,
      });
      setSuccessMessage(`Account created successfully! Welcome, ${user.displayName}!`);
      onLoginSuccess?.(user);
      setTimeout(() => {
        onClose();
      }, 750);
    } catch (err: any) {
      setError(err?.message || formatFirestoreErrorForUser(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!signUpUsername.trim() || signUpUsername.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await signUpTeacherUser({
        username: signUpUsername.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        teachers,
      });
      setSuccessMessage(`Teacher account created successfully! Welcome, ${user.displayName}!`);
      onLoginSuccess?.(user);
      setTimeout(() => {
        onClose();
      }, 750);
    } catch (err: any) {
      setError(err?.message || formatFirestoreErrorForUser(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOutFirebase();
      setSuccessMessage('Signed out successfully.');
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a1026] via-indigo-950 to-violet-950 text-white p-5 sm:p-6 relative border-b-2 border-amber-400">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400 text-amber-300 flex items-center justify-center shadow-xs shrink-0">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] sm:text-[11px] font-mono tracking-wider text-amber-300 uppercase font-semibold">
                DARUL HUDA ISLAMIC UNIVERSITY • ASSAM CENTRE
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentUser ? 'Active Portal Session' : 'DHAC Coin Portal Access'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-violet-200/90 mt-1">
            Choose your role to log in or create an account for students, faculty mentors, and administrators.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Active Error / Success alerts */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {currentUser ? (
            /* Current User Logged In Card */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Currently Logged In
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-violet-600 text-white">
                    {currentUser.role}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-900 text-amber-300 flex items-center justify-center font-bold text-lg border border-amber-400/40 shrink-0">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {currentUser.displayName}
                    </div>
                    {currentUser.email && (
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {currentUser.email}
                      </div>
                    )}
                    {currentUser.adNo && (
                      <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        Admission No: #{currentUser.adNo} • Class {currentUser.className}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-violet-600 hover:bg-slate-800 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Continue to Portal
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated: Role Selector & Login/Signup Forms */
            <div className="space-y-4">
              {/* 1. ROLE SELECTOR TABS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Select Your Role
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('STUDENT')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      selectedRole === 'STUDENT'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('TEACHER_ADMIN')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      selectedRole === 'TEACHER_ADMIN'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('SUPER_ADMIN')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      selectedRole === 'SUPER_ADMIN'
                        ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* 2. MODE TOGGLE: LOGIN VS SIGN UP */}
              {selectedRole !== 'SUPER_ADMIN' ? (
                <div className="flex items-center justify-center border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                    }}
                    className={`pb-2.5 transition relative cursor-pointer ${
                      authMode === 'login'
                        ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 font-extrabold'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setError(null);
                    }}
                    className={`pb-2.5 transition relative cursor-pointer ${
                      authMode === 'signup'
                        ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400 font-extrabold'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Create Account (Sign Up)
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Administrator access requires pre-authorized credentials. Registration is restricted.
                  </span>
                </div>
              )}

              {/* 3. FORMS PER ROLE & MODE */}

              {/* ==================== A. STUDENT LOGIN ==================== */}
              {selectedRole === 'STUDENT' && authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Admission Number (AD) or Email / Username
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. 635 or student_635 or email"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your student password"
                        className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{isLoading ? 'Verifying Student Access...' : 'Login as Student'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setError(null);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      New Student? Click here to Sign Up with Admission No
                    </button>
                  </div>
                </form>
              )}

              {/* ==================== B. STUDENT SIGN UP ==================== */}
              {selectedRole === 'STUDENT' && authMode === 'signup' && (
                <form onSubmit={handleStudentSignUpSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      DHAC Admission Number (AD) *
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={signUpAdNo}
                        onChange={(e) => setSignUpAdNo(e.target.value)}
                        placeholder="e.g. 635 or 272"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {matchedStudentByAd && (
                      <div className="mt-1.5 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg flex items-center justify-between text-[11px] text-emerald-900 dark:text-emerald-200">
                        <div>
                          <span className="font-bold">{matchedStudentByAd.name}</span>
                          <span className="text-emerald-700 dark:text-emerald-400 block">
                            Class {matchedStudentByAd.className} • Mentor: {matchedStudentByAd.mentorName}
                          </span>
                        </div>
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value)}
                        placeholder="e.g. mahmudul635"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="student@gmail.com"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !matchedStudentByAd}
                    className="w-full py-3 px-4 bg-indigo-700 hover:bg-indigo-600 disabled:bg-slate-400 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isLoading ? 'Creating Student Profile...' : 'Create Student Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setError(null);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Already have an account? Login here
                    </button>
                  </div>
                </form>
              )}

              {/* ==================== C. TEACHER LOGIN ==================== */}
              {selectedRole === 'TEACHER_ADMIN' && authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Teacher Username or Email
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="e.g. shuaib_a or teacher@dhac.edu.in"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your faculty password"
                        className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{isLoading ? 'Authenticating Faculty...' : 'Login as Teacher'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setError(null);
                      }}
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      New Faculty Member? Sign Up as Teacher
                    </button>
                  </div>
                </form>
              )}

              {/* ==================== D. TEACHER SIGN UP ==================== */}
              {selectedRole === 'TEACHER_ADMIN' && authMode === 'signup' && (
                <form onSubmit={handleTeacherSignUpSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Teacher Username *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value)}
                        placeholder="e.g. shuaib_a or teacher name"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    {matchedTeacherSignup && (
                      <div className="mt-1 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300">
                        ✓ Matches Faculty Mentor: <strong>{matchedTeacherSignup.name}</strong> ({matchedTeacherSignup.teacherId})
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="teacher@dhac.edu.in or personal email"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <span>{isLoading ? 'Creating Faculty Account...' : 'Create Teacher Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setError(null);
                      }}
                      className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Already registered? Login as Teacher
                    </button>
                  </div>
                </form>
              )}

              {/* ==================== E. SUPER ADMIN LOGIN (NO SIGNUP) ==================== */}
              {selectedRole === 'SUPER_ADMIN' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Administrator E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="sidrastudentsunion@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Administrator Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Shield className="w-4 h-4" />
                    <span>{isLoading ? 'Verifying Super Admin...' : 'Login as Super Admin'}</span>
                  </button>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Institutional Admin Credentials Reference:
                    </div>
                    <div>
                      Email: <code className="font-mono text-slate-900 dark:text-amber-300 font-bold">sidrastudentsunion@gmail.com</code>
                    </div>
                    <div>
                      Password: <code className="font-mono text-slate-900 dark:text-amber-300 font-bold">admin1234</code>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
