import React from 'react';
import { StudentRecord, ClassStats, MentorStats } from '../types/student';
import { BarChart3, PieChart, Users, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';

interface AnalyticsViewProps {
  students: StudentRecord[];
  classStats: ClassStats[];
  mentorStats: MentorStats[];
  onSelectStudent: (student: StudentRecord) => void;
  onFilterZeroCoins: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  classStats,
  mentorStats,
  onSelectStudent,
  onFilterZeroCoins,
}) => {
  // Coin distribution counts
  const coinDistributionMap: Record<number, number> = {};
  students.forEach(s => {
    coinDistributionMap[s.totalCoins] = (coinDistributionMap[s.totalCoins] || 0) + 1;
  });

  const sortedCoinValues = Object.keys(coinDistributionMap)
    .map(Number)
    .sort((a, b) => b - a);

  const totalStudents = students.length || 1;
  const activeStudents = students.filter(s => s.totalCoins > 0);
  const zeroCoinStudents = students.filter(s => s.totalCoins === 0);

  // Class comparison (sorted by total coins)
  const sortedClasses = [...classStats].sort((a, b) => b.totalCoins - a.totalCoins);
  const maxClassCoins = Math.max(...sortedClasses.map(c => c.totalCoins), 1);

  // Top 5 mentors
  const topMentors = [...mentorStats].slice(0, 8);
  const maxMentorCoins = Math.max(...topMentors.map(m => m.totalCoins), 1);

  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-1">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Campus Merit & Coin Distribution Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Statistical breakdown of coin allocations, batch performance, and student engagement
          </p>
        </div>
      </div>

      {/* Grid: Distribution Bars + Earner Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Exact Coin Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center justify-between">
            <span>Coin Value Distribution</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {sortedCoinValues.length} distinct tiers
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Number of students holding each specific coin balance
          </p>

          <div className="space-y-2.5">
            {sortedCoinValues.map(coinVal => {
              const count = coinDistributionMap[coinVal];
              const pct = Math.round((count / totalStudents) * 100);
              const isZero = coinVal === 0;

              return (
                <div key={coinVal} className="text-xs">
                  <div className="flex items-center justify-between mb-1 font-mono tabular-nums">
                    <span className={`font-semibold ${isZero ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {coinVal} Coins
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {count} {count === 1 ? 'student' : 'students'} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        coinVal >= 60
                          ? 'bg-amber-500'
                          : coinVal >= 30
                          ? 'bg-emerald-600'
                          : coinVal >= 15
                          ? 'bg-blue-600'
                          : isZero
                          ? 'bg-slate-300 dark:bg-slate-700'
                          : 'bg-indigo-400'
                      }`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Earner vs Non-Earner & Section Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center justify-between">
              <span>Engagement Ratio</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Active vs Inactive
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Overview of active coin achievers requiring continuation vs intervention
            </p>

            {/* Split Visual */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  Active Earners ({activeStudents.length})
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Zero Coins ({zeroCoinStudents.length})
                </span>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full transition-all"
                  style={{ width: `${(activeStudents.length / totalStudents) * 100}%` }}
                />
                <div
                  className="bg-rose-400 h-full transition-all"
                  style={{ width: `${(zeroCoinStudents.length / totalStudents) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                <span>{Math.round((activeStudents.length / totalStudents) * 100)}% earning rate</span>
                <span>{Math.round((zeroCoinStudents.length / totalStudents) * 100)}% unawarded</span>
              </div>
            </div>

            {/* Section Level Coin Totals */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Departmental Coin Accumulation:
              </div>
              {['Degree', 'Higher Secondary', 'Secondary'].map(dept => {
                const deptClasses = classStats.filter(c => c.category === dept);
                const deptCoins = deptClasses.reduce((s, c) => s + c.totalCoins, 0);
                const deptStudents = deptClasses.reduce((s, c) => s + c.studentCount, 0);
                const deptAvg = deptStudents ? Math.round((deptCoins / deptStudents) * 10) / 10 : 0;

                return (
                  <div key={dept} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{dept}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {deptStudents} students in {deptClasses.length} classes
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{deptCoins} coins</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">{deptAvg} avg/student</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Need to see who hasn't earned coins yet?
            </span>
            <button
              onClick={onFilterZeroCoins}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
            >
              Filter 130 Zero-Coin Students →
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Class Totals + Mentor Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Coins Horizontal Bars */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Class Total Coins Comparison
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Aggregated coins earned by each class batch
          </p>
          <div className="space-y-3">
            {sortedClasses.map(cls => {
              const pct = Math.round((cls.totalCoins / maxClassCoins) * 100);
              return (
                <div key={cls.className} className="text-xs">
                  <div className="flex items-center justify-between mb-1 font-mono tabular-nums">
                    <span className="font-medium text-slate-800 dark:text-slate-200">Class {cls.className}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      {cls.totalCoins}c ({cls.averageCoins} avg)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-700 rounded-full"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Mentors Horizontal Bars */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Leading Mentors by Mentee Coins
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Top performing faculty mentor groups across all departments
          </p>
          <div className="space-y-3">
            {topMentors.map(m => {
              const pct = Math.round((m.totalCoins / maxMentorCoins) * 100);
              return (
                <div key={m.mentorName} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={m.mentorName}>
                      {m.mentorName}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono font-semibold tabular-nums">
                      {m.totalCoins}c ({m.averageCoins} avg)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
