import React, { useState } from 'react';
import {
  Award,
  Download,
  RefreshCw,
  ShieldCheck,
  LogIn,
  LogOut,
  Coins,
  UserPlus,
  History,
  Clock,
  CreditCard,
  Send,
  User,
  KeyRound,
  ShieldAlert,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  Layers,
  BarChart3,
  FileText
} from 'lucide-react';
import { AuthUser } from '../types/student';
import { Coin3D } from './Coin3D';

export type NavTabType = 'students' | 'classes' | 'mentors' | 'analytics' | 'audit' | 'certificates' | 'approvals' | 'portal';

interface NavbarProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  onExportCleanedCSV: () => void;
  onResetData: () => void;
  onUploadClick: () => void;
  totalStudents: number;
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAwardCoins: () => void;
  onOpenAddStudent: () => void;
  onOpenAddMentor: () => void;
  onOpenTransactions: () => void;
  pendingClaimsCount?: number;
  onOpenIDCard?: () => void;
  onOpenSubmitClaim?: () => void;
  onOpenChangePassword?: () => void;
  onOpenSuperAdminConsole?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onExportCleanedCSV,
  onResetData,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenAwardCoins,
  onOpenAddStudent,
  onOpenAddMentor,
  onOpenTransactions,
  pendingClaimsCount = 0,
  onOpenIDCard,
  onOpenSubmitClaim,
  onOpenChangePassword,
  onOpenSuperAdminConsole,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isTeacher = currentUser?.role === 'TEACHER_ADMIN';
  const isStudent = currentUser?.role === 'STUDENT';
  const isFaculty = isSuperAdmin || isTeacher;

  const handleTabClick = (tab: NavTabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-violet-900/40 shadow-xl relative overflow-hidden select-none">
      {/* Background Image of Assam Centre Campus Building (Pic 3) with Navy/Deep-Violet Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url('/assets/aistudio/image__1__26945546.png')` }}
      />
      {/* Rich Navy & Deep Violet Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#090d20]/95 via-[#111738]/92 to-[#191136]/95 backdrop-blur-md pointer-events-none" />

      {/* Navbar Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-2">
          
          {/* ZONE 1: Left Group (Mobile Menu Button + Dual Institutional Logos) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-xl text-violet-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-300" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Clickable Brand / Logos */}
            <div
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
              onClick={() => handleTabClick('students')}
            >
              {/* Pic 2: Institution Seal (Darul Huda Islamic University) */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/95 p-1 border-2 border-amber-300/80 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src="/assets/aistudio/image_434e52c1.png"
                  alt="Darul Huda Islamic University Seal"
                  className="w-full h-full object-contain"
                  onError={e => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Pic 1: DHAC Coin Portal App Logo */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900 border-2 border-violet-400/60 shadow-md flex items-center justify-center shrink-0 overflow-hidden hidden sm:flex">
                <img
                  src="/assets/aistudio/DHAC-COIN-PORTAL-LOGO_b7284767.jpg"
                  alt="DHAC Coin Portal Logo"
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Wordmark Titles */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-white uppercase truncate block font-['Outfit',sans-serif] drop-shadow-xs">
                    DHAC COIN PORTAL
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-400 text-slate-950">
                    LIVE
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-violet-200/90 tracking-wider uppercase block truncate">
                  DARUL HUDA ASSAM CENTRE • MERIT CORE
                </span>
              </div>
            </div>
          </div>

          {/* ZONE 2: Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {isStudent && (
              <button
                onClick={() => handleTabClick('portal')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'portal'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Portal</span>
              </button>
            )}

            {isFaculty && (
              <button
                onClick={() => handleTabClick('approvals')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'approvals'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Confirmations</span>
                {pendingClaimsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold animate-pulse">
                    {pendingClaimsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => handleTabClick('students')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-violet-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Leaderboard
            </button>

            <button
              onClick={() => handleTabClick('classes')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-violet-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Batches & Unions
            </button>

            <button
              onClick={() => handleTabClick('mentors')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'mentors'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-violet-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Mentors (20)
            </button>

            <button
              onClick={() => handleTabClick('analytics')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-violet-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Analytics
            </button>

            <button
              onClick={() => handleTabClick('audit')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-violet-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit</span>
            </button>

            <button
              onClick={() => handleTabClick('certificates')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'certificates'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-violet-100/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Certificates
            </button>
          </nav>

          {/* ZONE 3: Desktop Controls & Right Side Actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Theme Toggle: Navy Mode (Default) vs Dark Mode (Optional) */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                title={isDarkMode ? "Switch to Navy Mode (Default)" : "Switch to Dark Mode (Optional)"}
                className="p-1.5 px-3 text-xs font-bold text-violet-100 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                aria-label="Toggle theme mode"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span>Navy Mode (Default)</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-violet-300" />
                    <span>Dark Mode (Optional)</span>
                  </>
                )}
              </button>
            )}

            {/* User Session or Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {currentUser.role === 'VIEWER' && (
                  <button
                    onClick={onOpenLogin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-md cursor-pointer animate-pulse"
                    title="Link your account to your DHAC Student or Faculty Mentor profile"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Link Student/Mentor</span>
                  </button>
                )}

                {isStudent && (
                  <>
                    <button
                      onClick={onOpenIDCard}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/25 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
                      <span>ID Card</span>
                    </button>
                    <button
                      onClick={onOpenSubmitClaim}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-md cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Add Coin</span>
                    </button>
                  </>
                )}

                {isFaculty && (
                  <>
                    <button
                      onClick={onOpenAwardCoins}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl transition shadow-md cursor-pointer"
                    >
                      <Coin3D size="xs" tier="Gold" />
                      <span>Award Coins</span>
                    </button>
                    <button
                      onClick={onOpenTransactions}
                      className="px-2.5 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                      title="View Coin Crediting Ledger"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                  </>
                )}

                {isSuperAdmin && (
                  <button
                    onClick={onOpenSuperAdminConsole}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-fuchsia-600/80 hover:bg-fuchsia-500 border border-fuchsia-400/50 rounded-xl transition shadow-md cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                    <span>Admin</span>
                  </button>
                )}

                <button
                  onClick={onOpenChangePassword}
                  className="p-1.5 px-2 text-xs font-medium text-violet-200 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                  title="Account & Role Settings"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center text-xs text-white font-mono px-2.5 py-1 bg-white/10 border border-white/15 rounded-xl">
                  <span className="truncate max-w-[120px] font-semibold">
                    {currentUser.displayName}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl transition shadow-lg shadow-amber-500/25 cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Login</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              onClick={onExportCleanedCSV}
              title="Download Cleaned 16-Column CSV"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-xl transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Reset 0-base Button */}
            <button
              onClick={onResetData}
              title="Reset cohort baseline"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ZONE 4: Mobile Header Controls (Right side) */}
          <div className="flex items-center gap-2 lg:hidden">
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition touch-manipulation min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-300" />}
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-1">
                {isFaculty && (
                  <button
                    onClick={onOpenAwardCoins}
                    className="p-2 text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                    title="Award Coins"
                  >
                    <Coins className="w-4 h-4" />
                  </button>
                )}
                {isStudent && (
                  <button
                    onClick={onOpenSubmitClaim}
                    className="p-2 text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
                    title="Add Coin Claim"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl min-h-[38px] flex items-center shadow-md cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Quick Tabs */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto py-2 border-t border-white/10 text-xs scrollbar-none">
          {isStudent && (
            <button
              onClick={() => handleTabClick('portal')}
              className={`px-3 py-1.5 font-bold rounded-lg whitespace-nowrap touch-manipulation cursor-pointer ${
                activeTab === 'portal' ? 'bg-amber-400 text-slate-950' : 'text-amber-300 bg-white/10'
              }`}
            >
              My Portal
            </button>
          )}
          {isFaculty && (
            <button
              onClick={() => handleTabClick('approvals')}
              className={`px-3 py-1.5 font-bold rounded-lg whitespace-nowrap touch-manipulation cursor-pointer ${
                activeTab === 'approvals' ? 'bg-amber-400 text-slate-950' : 'text-amber-300 bg-white/10'
              }`}
            >
              Confirmations {pendingClaimsCount > 0 ? `(${pendingClaimsCount})` : ''}
            </button>
          )}
          <button
            onClick={() => handleTabClick('students')}
            className={`px-3 py-1.5 font-bold rounded-lg whitespace-nowrap touch-manipulation cursor-pointer ${
              activeTab === 'students' ? 'bg-violet-600 text-white' : 'text-violet-100 bg-white/10'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => handleTabClick('classes')}
            className={`px-3 py-1.5 font-bold rounded-lg whitespace-nowrap touch-manipulation cursor-pointer ${
              activeTab === 'classes' ? 'bg-violet-600 text-white' : 'text-violet-100 bg-white/10'
            }`}
          >
            Batches & Unions
          </button>
          <button
            onClick={() => handleTabClick('mentors')}
            className={`px-3 py-1.5 font-bold rounded-lg whitespace-nowrap touch-manipulation cursor-pointer ${
              activeTab === 'mentors' ? 'bg-violet-600 text-white' : 'text-violet-100 bg-white/10'
            }`}
          >
            Mentors
          </button>
          <button
            onClick={() => handleTabClick('analytics')}
            className={`px-3 py-1.5 font-bold rounded-lg whitespace-nowrap touch-manipulation cursor-pointer ${
              activeTab === 'analytics' ? 'bg-violet-600 text-white' : 'text-violet-100 bg-white/10'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => handleTabClick('audit')}
            className={`px-3 py-1.5 font-bold rounded-lg whitespace-nowrap touch-manipulation cursor-pointer ${
              activeTab === 'audit' ? 'bg-violet-600 text-white' : 'text-violet-100 bg-white/10'
            }`}
          >
            Audit
          </button>
          <button
            onClick={() => handleTabClick('certificates')}
            className={`px-3 py-1.5 font-bold rounded-lg whitespace-nowrap touch-manipulation cursor-pointer ${
              activeTab === 'certificates' ? 'bg-violet-600 text-white' : 'text-violet-100 bg-white/10'
            }`}
          >
            Certificates
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-violet-800/40 bg-slate-950/98 px-4 py-4 space-y-4 shadow-2xl relative z-20 backdrop-blur-2xl">
          {/* Mobile Theme Mode Card */}
          {onToggleDarkMode && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-300" />}
                <div>
                  <div className="font-bold text-white">
                    {isDarkMode ? 'Dark Mode Active' : 'Navy Mode (Default)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isDarkMode ? 'Click to switch back to Navy Mode' : 'Optional: Switch to Dark Mode'}
                  </div>
                </div>
              </div>
              <button
                onClick={onToggleDarkMode}
                className="px-3 py-1.5 font-bold rounded-xl text-slate-950 bg-amber-400 hover:bg-amber-300"
              >
                {isDarkMode ? 'Navy Mode' : 'Dark Mode'}
              </button>
            </div>
          )}

          {/* User Status Bar */}
          {currentUser ? (
            <div className="p-3 bg-violet-950/60 border border-violet-700/50 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                  {currentUser.role}
                </div>
                <div className="text-sm font-bold text-white">{currentUser.displayName}</div>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-rose-300 bg-rose-950/60 border border-rose-800/80 rounded-xl"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenLogin();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black rounded-xl text-center text-sm shadow-md"
            >
              Sign In to Institutional Portal
            </button>
          )}

          {/* Quick Actions List */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {isFaculty && (
              <>
                <button
                  onClick={() => {
                    onOpenAwardCoins();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-xl font-bold flex items-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>Award Coins</span>
                </button>
                <button
                  onClick={() => {
                    onOpenTransactions();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 bg-white/10 border border-white/15 text-white rounded-xl font-bold flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  <span>Ledger</span>
                </button>
              </>
            )}

            {isSuperAdmin && (
              <>
                <button
                  onClick={() => {
                    onOpenSuperAdminConsole?.();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 bg-fuchsia-600/30 border border-fuchsia-400/40 text-fuchsia-200 rounded-xl font-bold flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Console</span>
                </button>
                <button
                  onClick={() => {
                    onOpenAddStudent();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 bg-white/10 border border-white/15 text-white rounded-xl font-bold flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Student</span>
                </button>
              </>
            )}

            {isStudent && (
              <>
                <button
                  onClick={() => {
                    onOpenIDCard?.();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 bg-white/10 border border-white/15 text-white rounded-xl font-bold flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>My ID Card</span>
                </button>
                <button
                  onClick={() => {
                    onOpenSubmitClaim?.();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 bg-amber-400/20 border border-amber-400/40 text-amber-300 rounded-xl font-bold flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Claim</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                onExportCleanedCSV();
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={() => {
                onResetData();
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-white/10 border border-white/15 text-slate-300 rounded-xl font-bold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset 0-Base</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
