import React from 'react';
import { StudentRecord } from '../types/student';
import { Crown, Medal, Award, Sparkles } from 'lucide-react';
import { Coin3D } from './Coin3D';

interface PodiumTopThreeProps {
  students: StudentRecord[];
  onSelectStudent: (student: StudentRecord) => void;
}

export const PodiumTopThree: React.FC<PodiumTopThreeProps> = ({ students, onSelectStudent }) => {
  // Sort students by campusRankNum
  const sorted = [...students].sort((a, b) => a.campusRankNum - b.campusRankNum);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];
  const runnersUp = sorted.slice(3, 7); // Rank 4 to 7

  if (!first || !second || !third) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm transition-colors duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span>Campus Honor Roll • Top Coin Achievers</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Recognizing highest cumulative merit coin milestones across all classes
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          Cutoff for Top 3: <span className="font-semibold text-slate-800 dark:text-slate-200">60+ Coins</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mb-4 items-end">
        {/* 2nd Place */}
        <div
          onClick={() => onSelectStudent(second)}
          className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer flex flex-col justify-between order-2 md:order-1 relative shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold text-sm font-mono shadow-xs">
              2
            </div>
            <div className="flex items-center gap-1.5">
              <Coin3D size="xs" tier="Silver" />
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                Campus {second.campusRank}
              </span>
            </div>
          </div>

          <div className="my-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              {second.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Class {second.className}</span>
              <span aria-hidden="true">•</span>
              <span>AD #{second.adNo}</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate" title={second.mentorName}>
              Mentor: {second.mentorName}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Group {second.mentorGroupRank}</span>
            <div className="flex items-center gap-1.5 font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200 text-lg">
              <Coin3D size="xs" tier="Silver" />
              <span>{second.totalCoins} <span className="text-xs font-normal text-slate-400">c</span></span>
            </div>
          </div>
        </div>

        {/* 1st Place (Champion) */}
        <div
          onClick={() => onSelectStudent(first)}
          className="border-2 border-amber-400 dark:border-amber-500 rounded-2xl p-5 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 hover:border-amber-500 transition cursor-pointer flex flex-col justify-between order-1 md:order-2 shadow-lg relative transform md:-translate-y-2"
        >
          {/* Subtle Champion Glow */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-bold text-base font-mono shadow-md">
              <Crown className="w-5 h-5 text-amber-950" />
            </div>
            <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-700">
              <Coin3D size="xs" tier="Diamond" />
              <span className="text-xs font-black text-amber-900 dark:text-amber-300 font-mono">
                CAMPUS CHAMPION
              </span>
            </div>
          </div>

          <div className="my-4">
            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-snug">
              {first.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
              <span className="font-extrabold text-violet-700 dark:text-violet-300">Class {first.className} (Rank {first.classRank})</span>
              <span aria-hidden="true">•</span>
              <span className="font-mono">AD #{first.adNo}</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate" title={first.mentorName}>
              Mentor: {first.mentorName}
            </div>
          </div>

          <div className="pt-3 border-t border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
            <span className="text-xs text-amber-800 dark:text-amber-300 font-bold font-mono">Group {first.mentorGroupRank}</span>
            <div className="flex items-center gap-2">
              <Coin3D size="sm" tier="Diamond" />
              <span className="text-2xl font-black font-mono tabular-nums text-amber-900 dark:text-amber-300">
                {first.totalCoins} <span className="text-xs font-bold text-amber-700 dark:text-amber-400">coins</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3rd Place */}
        <div
          onClick={() => onSelectStudent(third)}
          className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer flex flex-col justify-between order-3 relative shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="w-8 h-8 rounded-xl bg-orange-200/80 dark:bg-orange-950/80 text-orange-900 dark:text-orange-300 flex items-center justify-center font-bold text-sm font-mono shadow-xs">
              3
            </div>
            <div className="flex items-center gap-1.5">
              <Coin3D size="xs" tier="Bronze" />
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                Campus {third.campusRank}
              </span>
            </div>
          </div>

          <div className="my-3">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              {third.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Class {third.className}</span>
              <span aria-hidden="true">•</span>
              <span>AD #{third.adNo}</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate" title={third.mentorName}>
              Mentor: {third.mentorName}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Group {third.mentorGroupRank}</span>
            <div className="flex items-center gap-1.5 font-bold font-mono tabular-nums text-amber-800 dark:text-amber-400 text-lg">
              <Coin3D size="xs" tier="Bronze" />
              <span>{third.totalCoins} <span className="text-xs font-normal text-slate-400">c</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Runners-up Bar */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Runners Up (Campus Ranks 4+ • Active Top Achievers):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {runnersUp.map(student => (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="px-3 py-2 border border-slate-200/80 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-600 rounded-xl text-left cursor-pointer bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span className="font-bold">{student.campusRank}</span>
                <div className="flex items-center gap-1">
                  <Coin3D size="xs" tier={student.tier as any} />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{student.totalCoins}c</span>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {student.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {student.className} • {student.mentorName.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
