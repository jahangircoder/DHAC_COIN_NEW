import React, { useState } from 'react';
import {
  Coins,
  Trophy,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Send,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Smartphone,
  Laptop,
  Monitor,
  Copy,
  Check,
  Eye,
  X,
  Star
} from 'lucide-react';
import { Coin3D } from './Coin3D';
import { StudentRecord, ClassStats, AuthUser } from '../types/student';

interface PortalHeroProps {
  students: StudentRecord[];
  classStats: ClassStats[];
  currentUser: AuthUser | null;
  onOpenAwardCoins: () => void;
  onOpenLogin: () => void;
  onOpenSubmitClaim: () => void;
  onExploreLeaderboard: () => void;
}

export const PortalHero: React.FC<PortalHeroProps> = ({
  students,
  classStats,
  currentUser,
  onOpenAwardCoins,
  onOpenLogin,
  onOpenSubmitClaim,
  onExploreLeaderboard,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);

  const totalCoins = students.reduce((sum, s) => sum + s.totalCoins, 0);
  const activeStudents = students.filter(s => s.totalCoins > 0).length;
  const topStudent = [...students].sort((a, b) => b.totalCoins - a.totalCoins)[0];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText('https://dhac-coin-portal.netlify.app/');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-white dark:bg-[#0c1328] border-2 border-slate-200 dark:border-violet-900/50 shadow-xl transition-all duration-200">
      {/* Background ambient lighting effects matching poster */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-100/40 via-violet-100/30 to-transparent dark:from-violet-900/20 dark:via-blue-900/10 dark:to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-100/50 dark:bg-amber-900/10 rounded-full blur-2xl pointer-events-none" />

      {/* Floating 3D Gold Coins (Poster depth of field elements) */}
      <div className="absolute -top-6 right-16 opacity-30 sm:opacity-40 pointer-events-none blur-[1px] transform rotate-12 animate-pulse">
        <Coin3D size="xl" tier="Gold" />
      </div>
      <div className="absolute top-1/3 -right-6 opacity-35 sm:opacity-50 pointer-events-none blur-[2px] transform -rotate-12">
        <Coin3D size="2xl" tier="Gold" />
      </div>
      <div className="absolute bottom-4 left-4 opacity-30 sm:opacity-45 pointer-events-none blur-[1px] transform rotate-45">
        <Coin3D size="xl" tier="Gold" />
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-8">
        
        {/* POSTER HEADER ROW: Verified Seal (Left) + University Brand & Welfare Board + Circular Arc (Right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          
          {/* Top Left: Verified Scalloped Badge + DHIU Logo & Welfare Board Title */}
          <div className="flex items-center gap-3.5">
            {/* Scalloped Blue Verified Seal Badge (from poster top left) */}
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-11 h-11 text-blue-600 dark:text-blue-500 fill-current drop-shadow-sm" viewBox="0 0 24 24">
                <path d="M12 1l2.5 2.5 3.5-.5 1 3.5 3 2-1 3.5 2 3-2.5 2.5.5 3.5-3.5 1-2 3-3.5-1-3 2-2.5-2.5-3.5.5-1-3.5-3-2 1-3.5-2-3 2.5-2.5-.5-3.5 3.5-1 2-3 3.5 1 3-2z" />
              </svg>
              <Check className="absolute w-5 h-5 text-white stroke-[3.5]" />
            </div>

            {/* University Crest & Title */}
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/image_434e52c1.png"
                alt="Darul Huda Islamic University Seal"
                className="w-11 h-11 object-contain p-0.5 rounded-full bg-white shadow-xs border border-slate-200 dark:border-slate-700"
                onError={e => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-[#234b8c] dark:text-blue-300 tracking-wider uppercase leading-tight font-['Outfit',sans-serif]">
                  DARUL HUDA ASSAM CENTRE
                </div>
                <div className="text-[11px] sm:text-xs font-black text-[#1e3a8a] dark:text-violet-300 tracking-wide uppercase">
                  STUDENTS WELFARE BOARD
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: Poster Reference & Circular University Arc Banner */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* View Official Poster Button */}
            <button
              onClick={() => setShowPosterModal(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-700 text-[#1e3a8a] dark:text-violet-300 text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="View original official poster design"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>View Official Poster</span>
            </button>

            {/* Curved Arc Text Badge */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold text-blue-900 dark:text-blue-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>DARUL HUDA ISLAMIC UNIVERSITY ASSAM</span>
            </div>
          </div>
        </div>

        {/* MAIN BODY: Z-PATTERN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* LEFT COLUMN: Grand Title ("DHAC COIN PORTAL") + 3D Gold Coin + Value Props + Link & QR Code */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Grand Poster Title */}
            <div className="space-y-1">
              <div className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#2b5ba3] dark:text-[#60a5fa] uppercase leading-[0.9] font-['Outfit',sans-serif] select-none">
                DHAC
              </div>

              {/* "COIN" + Large Embossed 3D Gold Coin side-by-side */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#2b5ba3] dark:text-[#60a5fa] uppercase leading-[0.9] font-['Outfit',sans-serif] select-none">
                  COIN
                </span>
                {/* 3D Realistic Coin matching the poster */}
                <div className="transform -rotate-6 transition-transform duration-300 hover:rotate-0 hover:scale-110 cursor-pointer">
                  <Coin3D size="2xl" tier="Gold" symbol="$" />
                </div>
              </div>

              <div className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#2b5ba3] dark:text-[#60a5fa] uppercase leading-[0.9] font-['Outfit',sans-serif] select-none">
                PORTAL
              </div>

              {/* Subtitle */}
              <p className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight pt-2">
                Submit Activities, Earn Coins, Win Awards.
              </p>
            </div>

            {/* 3 Value Propositions with Bullet Points (from the poster) */}
            <div className="space-y-2 text-slate-700 dark:text-slate-300 text-sm sm:text-base font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                <span>Submit your Activities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                <span>Get coins</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                <span>Achieve Awards</span>
              </div>
            </div>

            {/* URL Pill Badge & Interactive QR Code Box */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
              {/* URL Pill Badge */}
              <div className="flex items-center">
                <div
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl bg-[#2b5ba3] hover:bg-[#204783] text-white font-mono text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer transition select-none"
                  title="Click to copy official portal URL"
                >
                  <span className="truncate">https://dhac-coin-portal.netlify.app/</span>
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-blue-200" />}
                </div>
              </div>

              {/* High-Tech QR Code Frame (matching poster's QR box) */}
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border-2 border-blue-400/50 dark:border-blue-600/50 shadow-sm w-fit">
                {/* SVG QR Code Illustration */}
                <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-300 flex items-center justify-center shadow-inner">
                  <svg className="w-full h-full text-blue-900" viewBox="0 0 100 100" fill="currentColor">
                    {/* Top Left Corner */}
                    <rect x="5" y="5" width="28" height="28" rx="4" fill="#1e3a8a" />
                    <rect x="11" y="11" width="16" height="16" fill="white" />
                    <rect x="15" y="15" width="8" height="8" fill="#1e3a8a" />
                    {/* Top Right Corner */}
                    <rect x="67" y="5" width="28" height="28" rx="4" fill="#1e3a8a" />
                    <rect x="73" y="11" width="16" height="16" fill="white" />
                    <rect x="77" y="15" width="8" height="8" fill="#1e3a8a" />
                    {/* Bottom Left Corner */}
                    <rect x="5" y="67" width="28" height="28" rx="4" fill="#1e3a8a" />
                    <rect x="11" y="73" width="16" height="16" fill="white" />
                    <rect x="15" y="77" width="8" height="8" fill="#1e3a8a" />
                    {/* Data matrix dots */}
                    <rect x="38" y="10" width="6" height="6" />
                    <rect x="48" y="10" width="6" height="6" />
                    <rect x="38" y="22" width="6" height="6" />
                    <rect x="48" y="22" width="6" height="6" />
                    <rect x="10" y="38" width="6" height="6" />
                    <rect x="22" y="38" width="6" height="6" />
                    <rect x="38" y="38" width="10" height="10" rx="2" fill="#2563eb" />
                    <rect x="54" y="38" width="6" height="6" />
                    <rect x="68" y="38" width="8" height="8" />
                    <rect x="82" y="38" width="6" height="6" />
                    <rect x="38" y="54" width="6" height="6" />
                    <rect x="48" y="68" width="8" height="8" />
                    <rect x="68" y="54" width="8" height="8" />
                    <rect x="80" y="68" width="10" height="10" />
                    <rect x="68" y="82" width="6" height="6" />
                    <rect x="40" y="82" width="6" height="6" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-black text-blue-900 dark:text-blue-300 font-mono uppercase">
                    SCAN TO ACCESS
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Mobile Coin Portal
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'TEACHER_ADMIN' ? (
                <button
                  onClick={onOpenAwardCoins}
                  className="px-5 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-violet-500/25 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
                >
                  <Coin3D size="xs" tier="Gold" />
                  <span>+ Award Merit Coins</span>
                </button>
              ) : currentUser?.role === 'STUDENT' ? (
                <button
                  onClick={onOpenSubmitClaim}
                  className="px-5 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-violet-500/25 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>+ Submit Coin Claim</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-violet-500/30 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
                >
                  <span>→ Sign in to the portal</span>
                </button>
              )}

              <button
                onClick={onExploreLeaderboard}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>View leaderboard ↓</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Overlapping Device Mockup (Smartphone in Hand + Laptop/Desktop) */}
          <div className="lg:col-span-5 relative flex justify-center items-center py-4">
            
            {/* Background Laptop / Desktop Frame */}
            <div className="w-full max-w-sm sm:max-w-md bg-slate-900 rounded-2xl border-2 border-slate-700 p-2 shadow-2xl relative z-10 transition-transform duration-300">
              <div className="flex items-center justify-between px-3 py-1 bg-slate-950 rounded-lg mb-2 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="font-mono text-[9px] text-slate-400">Desktop View</span>
                <span className="text-emerald-400 font-mono text-[9px]">● ONLINE</span>
              </div>

              {/* Inside Desktop Mockup */}
              <div className="bg-slate-950 rounded-xl p-3 space-y-2.5 text-xs border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="text-[11px] font-black text-white uppercase">DHAC COIN PORTAL</div>
                  <div className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                    <Coin3D size="xs" tier="Gold" />
                    <span>{totalCoins}c</span>
                  </div>
                </div>

                {/* Top Topper Card */}
                <div className="p-2.5 rounded-xl bg-violet-950/40 border border-violet-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-violet-300 font-bold uppercase">Campus Rank #1</div>
                    <div className="font-bold text-white text-xs truncate max-w-[140px]">{topStudent?.name}</div>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30">
                    {topStudent?.totalCoins} coins
                  </span>
                </div>

                {/* Class Cohorts */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
                    <div className="text-slate-400">Total Enrolled</div>
                    <div className="font-mono font-bold text-white">290 Students</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
                    <div className="text-slate-400">Batches</div>
                    <div className="font-mono font-bold text-white">12 Batches</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Foreground Smartphone Mockup (Exactly like the mobile in hand on the poster) */}
            <div className="absolute -bottom-4 right-0 sm:-right-4 w-52 sm:w-60 bg-slate-950 rounded-[28px] border-4 border-slate-800 p-2 shadow-2xl z-20 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              
              {/* Phone Speaker & Notch */}
              <div className="w-16 h-3 bg-slate-900 rounded-full mx-auto mb-1.5 flex items-center justify-center">
                <div className="w-2.5 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Phone Screen matching poster */}
              <div className="bg-gradient-to-b from-slate-900 to-[#120f2b] rounded-[20px] p-3 text-white text-[10px] space-y-2 border border-slate-800">
                {/* Mobile Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <img src="/assets/aistudio/DHAC-COIN-PORTAL-LOGO_b7284767.jpg" alt="" className="w-4 h-4 rounded-full" />
                    <span className="font-black text-[9px] tracking-tight">DHAC COIN...</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full font-bold text-[8px]">
                    Login
                  </span>
                </div>

                {/* Mobile Quick Tabs */}
                <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-400">
                  <span className="px-1.5 py-0.5 bg-violet-600 text-white rounded">Leaderboard</span>
                  <span className="px-1.5 py-0.5 bg-white/5 rounded">Batches</span>
                  <span className="px-1.5 py-0.5 bg-white/5 rounded">Mentors</span>
                </div>

                {/* Mobile Poster Card */}
                <div className="p-2.5 rounded-xl bg-gradient-to-b from-violet-100 to-white text-slate-900 space-y-1.5 shadow-sm">
                  <div className="text-[7px] font-black text-violet-700 uppercase tracking-wider">
                    ★ STUDENTS AFFAIRS BOARD
                  </div>
                  <div className="text-xs font-black text-blue-900 uppercase leading-none font-['Outfit',sans-serif]">
                    DHAC COIN PORTAL
                  </div>
                  <div className="text-[8px] font-bold text-slate-700 leading-tight">
                    Submit Activities, Earn Coins, Win Awards.
                  </div>
                  <p className="text-[7px] text-slate-500 leading-tight">
                    The official merit coin system of Darul Huda Islamic University, Assam Centre — recognising 290 students.
                  </p>
                  
                  {/* Purple Action Button */}
                  <div className="w-full py-1 bg-[#7c3aed] text-white text-center font-bold text-[8px] rounded-lg shadow-xs">
                    → Sign in to the portal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL: View Official Poster */}
      {showPosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <img src="/assets/aistudio/DHAC-COIN-PORTAL-LOGO_b7284767.jpg" alt="" className="w-6 h-6 rounded-lg" />
                <span className="font-bold text-xs sm:text-sm">Official DHAC Coin Portal Poster</span>
              </div>
              <button
                onClick={() => setShowPosterModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster Image Canvas */}
            <div className="p-4 overflow-y-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950">
              <img
                src="/assets/aistudio/dhac-portal-coin-1_ba734cc9.jpg"
                alt="DHAC Coin Portal Official Poster"
                className="max-h-[75vh] w-auto object-contain rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Darul Huda Assam Centre • Students Welfare Board</span>
              <button
                onClick={() => setShowPosterModal(false)}
                className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
