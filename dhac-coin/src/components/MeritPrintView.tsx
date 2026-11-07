import React, { useState } from 'react';
import { StudentRecord } from '../types/student';
import { Printer, ArrowLeft, Award, CheckCircle2, Star, Sparkles } from 'lucide-react';

interface MeritPrintViewProps {
  students: StudentRecord[];
  selectedStudent: StudentRecord | null;
  onSelectStudent: (student: StudentRecord) => void;
  onBack: () => void;
}

export const MeritPrintView: React.FC<MeritPrintViewProps> = ({
  students,
  selectedStudent: initialStudent,
  onSelectStudent,
  onBack,
}) => {
  // Sort students by campus rank
  const sorted = [...students].sort((a, b) => a.campusRankNum - b.campusRankNum);
  const [currentStudent, setCurrentStudent] = useState<StudentRecord>(
    initialStudent || sorted[0]
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 mb-12">
      {/* Action / Toolbar (hidden during print) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Student Merit Certificate Generator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any student to generate and print their official campus coin commendation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick student picker */}
          <select
            value={currentStudent.id}
            onChange={e => {
              const found = students.find(s => s.id === e.target.value);
              if (found) setCurrentStudent(found);
            }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 max-w-xs focus:ring-1 focus:ring-slate-900"
          >
            {sorted.slice(0, 50).map(s => (
              <option key={s.id} value={s.id}>
                {s.campusRank} · {s.name} ({s.totalCoins} coins)
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-violet-600 hover:bg-slate-800 dark:hover:bg-violet-700 rounded-lg transition shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Certificate
          </button>
        </div>
      </div>

      {/* Certificate Sheet (Printable Canvas) */}
      <div className="max-w-3xl mx-auto bg-white border-8 border-double border-emerald-900/30 rounded-2xl p-8 sm:p-12 shadow-md relative overflow-hidden text-center text-slate-800">
        {/* Subtle Decorative corner accents */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-emerald-800/40" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-emerald-800/40" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-emerald-800/40" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-emerald-800/40" />

        {/* Institution Header */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/assets/aistudio/image_434e52c1.png"
              alt="Darul Huda University Seal"
              className="w-16 h-16 rounded-full border-2 border-amber-400 shadow-sm object-contain bg-white p-1"
              onError={e => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="text-sm uppercase tracking-wider text-emerald-950 font-black">
            DARUL HUDA ISLAMIC UNIVERSITY, ASSAM CENTRE
          </div>
          <div className="text-xs text-amber-700 tracking-widest font-extrabold uppercase mt-0.5">
            STUDENTS AFFAIRS BOARD
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
            CENTRAL MERIT & COIN INCENTIVE PORTAL · ACADEMIC YEAR 2026-2027
          </div>
        </div>

        {/* Title */}
        <div className="my-5">
          <span className="text-xs font-semibold text-amber-700 tracking-widest uppercase block mb-1">
            Certificate of Student Coin Merit
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit',sans-serif] tracking-tight">
            COMMENDATION OF MERIT & ACHIEVEMENT
          </h1>
          <div className="w-24 h-0.5 bg-amber-500 mx-auto mt-2.5" />
        </div>

        {/* Recipient Details */}
        <div className="my-6 max-w-xl mx-auto space-y-3">
          <p className="text-xs text-slate-500 italic">
            This certificate is proudly awarded to
          </p>

          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 border-b-2 border-slate-200 pb-2 inline-block px-8 tracking-wide">
            {currentStudent.name}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 font-medium">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
              {currentStudent.officialId || `DHAC/ST/2026/${currentStudent.className}/${currentStudent.adNo}`}
            </span>
            <span>·</span>
            <span>Class: <strong className="text-slate-800">{currentStudent.className}</strong></span>
            <span>·</span>
            <span>Mentor: <strong className="text-slate-800">{currentStudent.mentorName}</strong></span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            In recognition of outstanding diligence, exemplary Islamic conduct, and scholastic participation,
            having earned cumulative merit standing under the official DHAC Student Coin Incentive System.
          </p>
        </div>

        {/* Performance Badges */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto my-8 p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
          <div>
            <div className="text-xs text-slate-500 font-medium">Total Balance</div>
            <div className="text-2xl font-black font-mono text-amber-700 tabular-nums mt-0.5">
              {currentStudent.totalCoins}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Coins Earned</div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">Campus Standing</div>
            <div className="text-2xl font-black font-mono text-slate-900 tabular-nums mt-0.5">
              {currentStudent.campusRank}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Campus Rank</div>
          </div>

          <div>
            <div className="text-xs text-slate-500 font-medium">Class Standing</div>
            <div className="text-2xl font-black font-mono text-slate-900 tabular-nums mt-0.5">
              {currentStudent.classRank}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Class Rank</div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-10 mt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
          <div>
            <div className="border-b border-slate-300 w-36 mx-auto mb-1.5 h-8" />
            <div className="font-bold text-slate-900 uppercase tracking-tight">{currentStudent.mentorName}</div>
            <div className="text-slate-500 text-[11px] font-medium">Faculty Mentor</div>
          </div>

          <div>
            <div className="border-b border-slate-300 w-36 mx-auto mb-1.5 h-8" />
            <div className="font-bold text-slate-900 uppercase tracking-tight">AFTAB HUDAWI</div>
            <div className="text-slate-500 text-[11px] font-medium">Academic Dean</div>
            <div className="text-slate-400 text-[10px] uppercase font-semibold">STUDENTS AFFAIRS BOARD</div>
          </div>

          <div>
            <div className="border-b border-slate-300 w-36 mx-auto mb-1.5 h-8" />
            <div className="font-bold text-slate-900 uppercase tracking-tight">SYED MUEENUDDIN THANGAL HUDAWI</div>
            <div className="text-slate-500 text-[11px] font-medium">Campus Director</div>
            <div className="text-slate-400 text-[10px]">Darul Huda Assam Centre</div>
          </div>
        </div>
      </div>
    </div>
  );
};
