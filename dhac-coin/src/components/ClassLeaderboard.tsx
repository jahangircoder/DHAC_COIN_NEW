import React, { useState } from 'react';
import { ClassStats, StudentRecord, UnionStats } from '../types/student';
import { Trophy, ArrowRight, Shield, Layers, Award, Sparkles } from 'lucide-react';
import { getBatchName } from '../data/batchNames';

interface ClassLeaderboardProps {
  classStats: ClassStats[];
  unionStats?: UnionStats[];
  onSelectClass: (className: string) => void;
  onSelectStudent: (student: StudentRecord) => void;
  onSelectUnionClasses?: (classes: string[], unionTitle: string) => void;
}

export const ClassLeaderboard: React.FC<ClassLeaderboardProps> = ({
  classStats,
  unionStats = [],
  onSelectClass,
  onSelectStudent,
  onSelectUnionClasses,
}) => {
  const [viewMode, setViewMode] = useState<'UNIONS' | 'CLASSES'>('UNIONS');

  // Sorted classes
  const sortedClasses = [...classStats].sort((a, b) => b.totalCoins - a.totalCoins || b.averageCoins - a.averageCoins);
  const maxClassCoins = Math.max(...sortedClasses.map(c => c.totalCoins), 1);

  // Sorted unions
  const sortedUnions = [...unionStats].sort((a, b) => b.totalCoins - a.totalCoins || b.averageCoins - a.averageCoins);
  const maxUnionCoins = Math.max(...sortedUnions.map(u => u.totalCoins), 1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 shadow-xs transition-colors duration-150">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {viewMode === 'UNIONS' ? 'Union Championship Standings' : 'Class Batch Standings & Rankings'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {viewMode === 'UNIONS' 
              ? 'Class points roll up to Unions: SAWRA (S2A & S2B), QUDWA (S3A & S3B), 13th Batch (S1A & S1B), etc.'
              : 'Individual class cohort rankings across 12 academic batches'}
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setViewMode('UNIONS')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              viewMode === 'UNIONS'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Unions (SAWRA, QUDWA...)</span>
          </button>
          <button
            onClick={() => setViewMode('CLASSES')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              viewMode === 'CLASSES'
                ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Classes (12 Batches)</span>
          </button>
        </div>
      </div>

      {/* UNIONS VIEW */}
      {viewMode === 'UNIONS' && (
        <div className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sortedUnions.map((u, idx) => {
              const rank = idx + 1;
              const isTop = rank === 1 && u.totalCoins > 0;

              return (
                <div
                  key={u.id || u.unionName}
                  className={`border rounded-xl p-4 transition flex flex-col justify-between ${
                    isTop
                      ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2.5">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isTop ? 'bg-amber-400 text-slate-900' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          #{rank}
                        </span>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                            <span>{u.unionName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Classes:</span>
                            {u.classes.map(cls => (
                              <span
                                key={cls}
                                className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 text-[10px] font-mono font-bold"
                              >
                                {cls}
                              </span>
                            ))}
                            <span className="text-[10px] text-slate-400">· {u.studentCount} students</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="text-lg font-black text-amber-800 dark:text-amber-400 leading-none">
                          {u.totalCoins} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">coins</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          {u.averageCoins} avg/stu
                        </div>
                        {u.classAwardCoins > 0 && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                            +{u.classAwardCoins} batch award
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3.5">
                      <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isTop ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max((u.totalCoins / maxUnionCoins) * 100, 2)}%` }}
                        />
                      </div>
                    </div>

                    {/* Top Student in Union */}
                    {u.topStudent && u.topStudent.totalCoins > 0 && (
                      <div
                        onClick={() => onSelectStudent(u.topStudent!)}
                        className="mt-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 text-xs transition"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Union Star Leader:</span>
                          <span className="font-mono tabular-nums text-amber-800 dark:text-amber-400 font-bold">
                            {u.topStudent.totalCoins} coins
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5 flex items-center justify-between">
                          <span>{u.topStudent.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {u.topStudent.className}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {u.activeStudents} of {u.studentCount} active
                    </span>
                    <button
                      onClick={() => onSelectClass(u.classes[0])}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 transition"
                    >
                      <span>View Students</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INDIVIDUAL CLASSES VIEW */}
      {viewMode === 'CLASSES' && (
        <div className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sortedClasses.map((cls, idx) => {
              const rank = idx + 1;
              const isTop = rank === 1 && cls.totalCoins > 0;
              const batchTitle = getBatchName(cls.className);

              return (
                <div
                  key={cls.className}
                  className={`border rounded-xl p-3.5 transition flex flex-col justify-between ${
                    isTop
                      ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          #{rank}
                        </span>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                            <span>Class {cls.className}</span>
                            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 font-mono">
                              [{batchTitle}]
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {cls.studentCount} students · {cls.category}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono tabular-nums">
                        <div className="text-base font-bold text-amber-800 dark:text-amber-400 leading-none">
                          {cls.totalCoins} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">coins</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {cls.averageCoins} avg
                        </div>
                        {cls.classAwardCoins > 0 && (
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                            +{cls.classAwardCoins} batch award
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isTop ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max((cls.totalCoins / maxClassCoins) * 100, 2)}%` }}
                        />
                      </div>
                    </div>

                    {/* Top student in this class if available */}
                    {cls.topStudent && cls.topStudent.totalCoins > 0 && (
                      <div
                        onClick={() => onSelectStudent(cls.topStudent!)}
                        className="mt-2.5 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Class Leader:</span>
                          <span className="font-mono tabular-nums text-amber-800 dark:text-amber-400 font-bold">
                            {cls.topStudent.totalCoins}c
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {cls.topStudent.name}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {cls.activeStudents} of {cls.studentCount} active
                    </span>
                    <button
                      onClick={() => onSelectClass(cls.className)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 transition"
                    >
                      <span>Filter Class</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

