import React, { useRef } from 'react';
import { StudentRecord, CoinClaim } from '../types/student';
import { Award, Coins, Send, CheckCircle2, Clock, XCircle, CreditCard, User, Sparkles, Camera } from 'lucide-react';
import { getBatchName } from '../data/batchNames';

interface StudentPortalViewProps {
  student: StudentRecord;
  claims: CoinClaim[];
  onOpenSubmitClaim: () => void;
  onOpenIDCard: () => void;
  onUpdatePhoto?: (studentId: string, photoUrl: string) => void;
  onOpenChangePassword?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  student,
  claims,
  onOpenSubmitClaim,
  onOpenIDCard,
  onUpdatePhoto,
  onOpenChangePassword,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentClaims = claims.filter(c => c.studentId === student.id || c.adNo === student.adNo);
  const pendingCount = studentClaims.filter(c => c.status === 'PENDING').length;
  const approvedCount = studentClaims.filter(c => c.status === 'APPROVED').length;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result && onUpdatePhoto) {
        onUpdatePhoto(student.id, result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Hidden File Input for Student Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Student Profile Card Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden border border-emerald-800">
        {/* Subtle background seal */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <img
            src="/assets/aistudio/image_434e52c1.png"
            alt=""
            className="w-64 h-64 rounded-full"
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Student Photo Avatar with Upload Camera Button */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl border-2 border-amber-300 overflow-hidden bg-white/10 flex items-center justify-center shadow-md">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-amber-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload or Change Your Profile Picture"
                className="absolute -bottom-1 -right-1 p-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-full shadow-md transition flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300 mb-1">
                <span>{student.officialId}</span>
                <span>·</span>
                <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                  {student.className} ({student.batchName || getBatchName(student.className)})
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {student.name}
              </h2>

              <p className="text-xs text-slate-300 mt-1">
                Faculty Mentor: <strong className="text-white">{student.mentorName}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-600 rounded-xl transition shadow-xs cursor-pointer"
              title="Add or update your official profile picture"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>{student.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            {onOpenChangePassword && (
              <button
                type="button"
                onClick={onOpenChangePassword}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-xl transition shadow-xs cursor-pointer"
                title="View your Firebase account and role profile"
              >
                <span>Account & Role</span>
              </button>
            )}

            <button
              onClick={onOpenIDCard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition shadow-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-800" />
              <span>Digital ID Card</span>
            </button>

            <button
              onClick={onOpenSubmitClaim}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Claim</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Accumulated Balance</div>
          <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400 tabular-nums mt-1">
            {student.totalCoins} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">coins</span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
            Status: {student.coinStatus}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Campus Rank</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            #{student.campusRankNum}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            of {student.campusTotalStudents} students
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Class Rank</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            #{student.classRankNum}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Class {student.className}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mentor Group Rank</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            #{student.mentorRankNum}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            of {student.mentorGroupSize} mentees
          </div>
        </div>
      </div>

      {/* Submissions & Confirmation Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              My Merit Award Claims & Mentor Reviews
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Claims submitted by you must be confirmed by your mentor ({student.mentorName}) before coins are added.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-amber-800 dark:text-amber-400 font-semibold">{pendingCount} Pending</span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{approvedCount} Approved</span>
          </div>
        </div>

        {studentClaims.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No award claims submitted yet</p>
            <p className="text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Did you publish an essay, participate in Sibaq 2026, or achieve semester honors? Click "Submit Coin Claim" to request points from your mentor!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {studentClaims.map(claim => (
              <div key={claim.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-amber-800 dark:text-amber-400">
                      +{claim.coins} 🪙
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {claim.activityName}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      ({claim.category})
                    </span>
                  </div>

                  {claim.proofNotes && (
                    <div className="text-slate-600 dark:text-slate-300 italic mt-0.5">
                      "{claim.proofNotes}"
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
                    Submitted: {claim.submittedAt} · Mentor Assigned: {claim.mentorName}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {claim.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 font-mono font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-2.5 py-1 rounded-md text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Pending Mentor Review
                    </span>
                  )}
                  {claim.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-1 rounded-md text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Confirmed by Mentor
                    </span>
                  )}
                  {claim.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 text-rose-800 dark:text-rose-300 font-mono font-semibold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 px-2.5 py-1 rounded-md text-xs">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Claim Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
