import React from 'react';
import { ClassStats, StudentRecord } from '../types/student';
import { BookOpen, Users, Coins, Trophy, ArrowRight } from 'lucide-react';

interface ClassOverviewProps {
  classStats: ClassStats[];
  onSelectClass: (className: string) => void;
  onSelectStudent: (student: StudentRecord) => void;
}

export const ClassOverview: React.FC<ClassOverviewProps> = ({
  classStats,
  onSelectClass,
  onSelectStudent,
}) => {
  const categories = ['Degree', 'Higher Secondary', 'Secondary'] as const;

  return (
    <div className="space-y-8 mb-8">
      {/* Category Sections */}
      {categories.map(category => {
        const classesInCategory = classStats.filter(c => c.category === category);
        if (classesInCategory.length === 0) return null;

        const catTotalCoins = classesInCategory.reduce((s, c) => s + c.totalCoins, 0);
        const catStudents = classesInCategory.reduce((s, c) => s + c.studentCount, 0);
        const catAvg = catStudents ? Math.round((catTotalCoins / catStudents) * 10) / 10 : 0;

        return (
          <div key={category} className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-1">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  {category} Section
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {classesInCategory.length} classes · {catStudents} students enrolled
                </p>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                Section Total: <span className="font-bold text-slate-900 dark:text-slate-100">{catTotalCoins}</span> coins · Avg: <span className="font-semibold text-emerald-800 dark:text-emerald-400">{catAvg}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classesInCategory.map(cls => {
                const earningRate = Math.round((cls.activeStudents / cls.studentCount) * 100);

                return (
                  <div
                    key={cls.className}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Class Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>Class {cls.className}</span>
                            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/80">
                              {cls.batchName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {cls.studentCount} students enrolled
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 leading-none">
                            {cls.totalCoins}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                            {cls.averageCoins} avg/student
                          </div>
                          {cls.classAwardCoins > 0 && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                              +{cls.classAwardCoins} batch award
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono tabular-nums">
                          <span>Active Earners ({cls.activeStudents})</span>
                          <span>{earningRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${earningRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Top Student in this Class */}
                      {cls.topStudent && (
                        <div
                          onClick={() => onSelectStudent(cls.topStudent!)}
                          className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <Trophy className="w-3 h-3 text-amber-500" /> Class Topper
                            </span>
                            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                              {cls.topStudent.totalCoins} coins
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {cls.topStudent.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono tabular-nums">
                            <span>AD #{cls.topStudent.adNo}</span>
                            <span>·</span>
                            <span>Campus Rank {cls.topStudent.campusRank}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {cls.zeroCoinStudents} at 0 coins
                      </span>
                      <button
                        onClick={() => onSelectClass(cls.className)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
                      >
                        <span>View Class Roster</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
