import React, { useState } from 'react';
import { MentorStats, StudentRecord } from '../types/student';
import { Users, Award, ChevronDown, ChevronUp, Trophy, ArrowRight } from 'lucide-react';

interface MentorOverviewProps {
  mentorStats: MentorStats[];
  allStudents: StudentRecord[];
  onSelectMentor: (mentorName: string) => void;
  onSelectStudent: (student: StudentRecord) => void;
}

export const MentorOverview: React.FC<MentorOverviewProps> = ({
  mentorStats,
  allStudents,
  onSelectMentor,
  onSelectStudent,
}) => {
  const [expandedMentor, setExpandedMentor] = useState<string | null>(null);

  const toggleExpand = (mentorName: string) => {
    setExpandedMentor(prev => (prev === mentorName ? null : mentorName));
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Mentor Groups Leaderboard & Roster
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Performance comparison across all {mentorStats.length} Hudawi faculty mentors
          </p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          Ranked by: <span className="font-semibold text-slate-800 dark:text-slate-200">Total Mentee Coins</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mentorStats.map((mentor, index) => {
          const isExpanded = expandedMentor === mentor.mentorName;
          const mentees = allStudents
            .filter(s => s.mentorName === mentor.mentorName)
            .sort((a, b) => a.mentorRankNum - b.mentorRankNum);

          const activeRate = Math.round((mentor.activeStudents / mentor.studentCount) * 100);

          return (
            <div
              key={mentor.mentorName}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                        {mentor.mentorName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {mentor.studentCount} mentees
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-base text-amber-700 dark:text-amber-400 tabular-nums">
                      {mentor.totalCoins} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">coins</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {mentor.averageCoins} avg
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono tabular-nums">
                    <span>Active mentees ({mentor.activeStudents}/{mentor.studentCount})</span>
                    <span>{activeRate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${activeRate}%` }}
                    />
                  </div>
                </div>

                {/* Top Mentee */}
                {mentor.topStudent && (
                  <div
                    onClick={() => onSelectStudent(mentor.topStudent!)}
                    className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Trophy className="w-3 h-3 text-amber-500" /> Group #1 Topper
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {mentor.topStudent.totalCoins}c
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {mentor.topStudent.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono tabular-nums">
                      <span>Class {mentor.topStudent.className}</span>
                      <span>·</span>
                      <span>Campus Rank {mentor.topStudent.campusRank}</span>
                    </div>
                  </div>
                )}

                {/* Expanded Roster Accordion */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Assigned Mentees ({mentees.length}):
                    </div>
                    {mentees.map(m => (
                      <div
                        key={m.id}
                        onClick={() => onSelectStudent(m)}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px] tabular-nums shrink-0">
                            {m.mentorGroupRank}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 truncate font-medium">
                            {m.name}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] shrink-0">
                            ({m.className})
                          </span>
                        </div>
                        <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300 ml-2 shrink-0">
                          {m.totalCoins}c
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => toggleExpand(mentor.mentorName)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                >
                  <span>{isExpanded ? 'Hide Mentees' : 'View All Mentees'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onSelectMentor(mentor.mentorName)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300"
                >
                  <span>Filter Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
