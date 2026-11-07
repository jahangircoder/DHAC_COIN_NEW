import React from 'react';
import { StudentRecord, MentorStats, ClassStats } from '../types/student';
import { Users, Trophy, AlertCircle, TrendingUp, Sparkles, Award } from 'lucide-react';
import { Coin3D } from './Coin3D';

interface KPISummaryProps {
  students: StudentRecord[];
  mentorStats: MentorStats[];
  classStats: ClassStats[];
  onSelectStudent: (student: StudentRecord) => void;
  onFilterZeroCoins: () => void;
}

export const KPISummary: React.FC<KPISummaryProps> = ({
  students,
  mentorStats,
  classStats,
  onSelectStudent,
  onFilterZeroCoins,
}) => {
  const totalCoins = students.reduce((sum, s) => sum + s.totalCoins, 0);
  const activeCount = students.filter(s => s.totalCoins > 0).length;
  const zeroCount = students.filter(s => s.totalCoins === 0).length;
  const avgCoins = students.length ? Math.round((totalCoins / students.length) * 10) / 10 : 0;

  // Campus topper
  const topper = [...students].sort((a, b) => b.totalCoins - a.totalCoins || a.campusRankNum - b.campusRankNum)[0];
  const topMentor = mentorStats[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Students */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-violet-300 dark:hover:border-violet-700 transition">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold">Total Students</span>
          <Users className="w-4 h-4 text-violet-500 dark:text-violet-400" />
        </div>
        <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-slate-100 leading-tight">
          {students.length}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono">
          <span>{classStats.length} Classes</span>
          <span>•</span>
          <span>{mentorStats.length} Mentors</span>
        </div>
      </div>

      {/* 2. Total Coins */}
      <div className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold">Total Coins Issued</span>
          <Coin3D size="xs" tier="Gold" />
        </div>
        <div className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 leading-tight flex items-center gap-1.5">
          <span>{totalCoins.toLocaleString()}</span>
        </div>
        <div className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 font-medium">
          Live Merit Balance
        </div>
      </div>

      {/* 3. Average Coins */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold">Avg per Student</span>
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-slate-100 leading-tight">
          {avgCoins} <span className="text-xs font-normal text-slate-400">coins</span>
        </div>
        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
          {Math.round((activeCount / (students.length || 1)) * 100)}% earning rate
        </div>
      </div>

      {/* 4. Campus Champion */}
      <div 
        onClick={() => topper && onSelectStudent(topper)}
        className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600/80 rounded-2xl p-4 shadow-sm cursor-pointer hover:border-amber-500 transition-all hover:scale-[1.02] relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 mb-1.5">
          <span className="text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Campus #1
          </span>
          <Coin3D size="xs" tier="Diamond" />
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={topper?.name}>
          {topper?.name || 'N/A'}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono tabular-nums">
          <span className="font-extrabold text-amber-600 dark:text-amber-400">{topper?.totalCoins || 0} coins</span>
          <span>•</span>
          <span className="font-semibold">{topper?.className}</span>
        </div>
      </div>

      {/* 5. Leading Mentor Group */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold">Top Mentor Group</span>
          <Award className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={topMentor?.mentorName}>
          {topMentor ? topMentor.mentorName.replace(' HUDAWI', '') : 'N/A'}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
          {topMentor?.totalCoins} coins ({topMentor?.averageCoins} avg)
        </div>
      </div>

      {/* 6. Zero Coins (Intervention Needed) */}
      <div 
        onClick={onFilterZeroCoins}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold">0 Coins (Needs Focus)</span>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-2xl font-black font-mono tabular-nums text-rose-600 dark:text-rose-400 leading-tight">
          {zeroCount}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
          Click to inspect list →
        </div>
      </div>
    </div>
  );
};
