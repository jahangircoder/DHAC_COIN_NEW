import React, { useState, useRef, useEffect } from 'react';
import { StudentRecord, AuthUser } from '../types/student';
import { X, BookOpen, User, Printer, Coins, Check, AlertCircle, ShieldCheck, CreditCard, Trash2, Camera } from 'lucide-react';
import { getBatchName } from '../data/batchNames';
import { Coin3D } from './Coin3D';

interface StudentModalProps {
  student: StudentRecord | null;
  onClose: () => void;
  onAwardCoins: (studentId: string, amount: number) => void;
  onPrintCertificate: (student: StudentRecord) => void;
  onOpenIDCard: (student: StudentRecord) => void;
  onDeleteStudent?: (studentId: string) => void;
  onUpdatePhoto?: (studentId: string, photoUrl: string) => void;
  currentUser: AuthUser | null;
  totalCampusStudents: number;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  student,
  onClose,
  onAwardCoins,
  onPrintCertificate,
  onOpenIDCard,
  onDeleteStudent,
  onUpdatePhoto,
  currentUser,
  totalCampusStudents,
}) => {
  const [awardSuccess, setAwardSuccess] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowDeleteConfirm(false);
    setIsDeleting(false);
  }, [student?.id]);

  if (!student) return null;

  const handleAward = (amount: number) => {
    onAwardCoins(student.id, amount);
    setAwardSuccess(amount);
    setTimeout(() => {
      setAwardSuccess(null);
    }, 2000);
  };

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
  };

  const percentile = Math.max(
    1,
    Math.round(((totalCampusStudents - student.campusRankNum + 1) / totalCampusStudents) * 100)
  );

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = isSuperAdmin || currentUser?.role === 'TEACHER_ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-between text-xs text-amber-400 font-mono mb-1">
            <span>OFFICIAL ID: {student.officialId}</span>
            <span className="bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded text-[10px]">
              {student.rankStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {/* Student Photo */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {student.photoUrl ? (
                  <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload / Change Photo"
                  className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-slate-950 rounded-full hover:bg-amber-300 transition cursor-pointer"
                >
                  <Camera className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {student.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Class {student.className} ({student.batchName || getBatchName(student.className)})
                </span>
                <span>·</span>
                <span>AD #{student.adNo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Institutional Crest Stamp */}
          <div className="flex items-center justify-between p-3 bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-800/80 rounded-xl">
            <div className="flex items-center gap-2.5">
              <img
                src="/assets/aistudio/image_434e52c1.png"
                alt="Darul Huda Crest"
                className="w-9 h-9 rounded-full border border-violet-300 dark:border-violet-700 object-contain bg-white p-0.5 shadow-xs"
                onError={e => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <div className="text-[10px] font-black uppercase text-violet-950 dark:text-violet-200 leading-tight">
                  DARUL HUDA ISLAMIC UNIVERSITY, ASSAM CENTRE
                </div>
                <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                  STUDENTS AFFAIRS BOARD • OFFICIAL RECORD
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenIDCard(student)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-violet-100/50 dark:hover:bg-slate-700 border border-violet-300 dark:border-violet-700 rounded-lg transition shadow-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-violet-800 dark:text-violet-400" />
              <span>View ID Card</span>
            </button>
          </div>

          {/* Coin Balance & Status */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50/50 dark:from-amber-950/40 dark:to-slate-900 border border-amber-300 dark:border-amber-700/80 rounded-xl shadow-xs">
            <div className="flex items-center gap-3">
              <Coin3D size="lg" tier={student.tier as any} />
              <div>
                <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold">Accumulated Balance</div>
                <div className="text-3xl font-black font-mono text-amber-950 dark:text-amber-200 tabular-nums">
                  {student.totalCoins} <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">Coins</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-amber-800 dark:text-amber-400 font-medium">Campus Standing</div>
              <div className="text-sm font-bold font-mono text-amber-950 dark:text-amber-200 tabular-nums">
                Top {100 - percentile < 1 ? 1 : 100 - percentile}%
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Status: {student.coinStatus}
              </div>
            </div>
          </div>

          {/* Tri-Rank Cards with Denominators */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Campus Rank</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                #{student.campusRankNum}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">of {student.campusTotalStudents}</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Class Rank</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                #{student.classRankNum}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">of {student.classSize}</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1">Mentor Group</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                #{student.mentorRankNum}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">of {student.mentorGroupSize}</div>
            </div>
          </div>

          {/* Quick Coin Award (Admin only) */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  Quick Award Coins
                </span>
                {awardSuccess && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> +{awardSuccess} coins credited!
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleAward(5)}
                  className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  +5 (Activity)
                </button>
                <button
                  onClick={() => handleAward(10)}
                  className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  +10 (Article)
                </button>
                <button
                  onClick={() => handleAward(20)}
                  className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  +20 (Exam 95%+)
                </button>
              </div>
            </div>
          )}

          {/* Admin Remove Option */}
          {isSuperAdmin && onDeleteStudent && (
            <div className="pt-3 border-t border-rose-100 dark:border-rose-900/40">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 px-3 border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Student from Registry</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/70 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-950 dark:text-rose-200">
                      <span className="font-bold block">Confirm Student Removal</span>
                      Are you sure you want to remove <span className="font-semibold text-rose-800 dark:text-rose-300">{student.name}</span> (AD #{student.adNo}) from the campus registry?
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={async () => {
                        setIsDeleting(true);
                        try {
                          await onDeleteStudent(student.id);
                          onClose();
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                      className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'Removing...' : 'Yes, Remove Student'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => onPrintCertificate(student)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Merit Slip
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition border border-transparent dark:border-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
