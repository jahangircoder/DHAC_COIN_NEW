import React, { useState, useMemo } from 'react';
import { StudentRecord } from '../types/student';
import { Search, ArrowUpDown, Eye, FileText, AlertCircle, ShieldAlert, Sparkles, CreditCard, Trash2, User, Edit } from 'lucide-react';
import { Coin3D } from './Coin3D';

interface StudentTableProps {
  students: StudentRecord[];
  selectedClassFilter: string;
  setSelectedClassFilter: (cls: string) => void;
  selectedMentorFilter: string;
  setSelectedMentorFilter: (mentor: string) => void;
  selectedTierFilter: string;
  setSelectedTierFilter: (tier: string) => void;
  selectedCoinStatusFilter: string;
  setSelectedCoinStatusFilter: (status: string) => void;
  onSelectStudent: (student: StudentRecord) => void;
  onPrintCertificate: (student: StudentRecord) => void;
  onOpenIDCard?: (student: StudentRecord) => void;
  onDeleteStudent?: (studentId: string) => void;
  onEditStudent?: (student: StudentRecord) => void;
  isAdmin?: boolean;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  selectedClassFilter,
  setSelectedClassFilter,
  selectedMentorFilter,
  setSelectedMentorFilter,
  selectedTierFilter,
  setSelectedTierFilter,
  selectedCoinStatusFilter,
  setSelectedCoinStatusFilter,
  onSelectStudent,
  onPrintCertificate,
  onOpenIDCard,
  onDeleteStudent,
  onEditStudent,
  isAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'campusRankNum' | 'totalCoins' | 'name' | 'className' | 'adNo'>('campusRankNum');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  const classList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  const mentorList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.mentorName))).sort();
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesAd = student.adNo.toLowerCase().includes(q);
        const matchesId = student.studentId.toLowerCase().includes(q);
        const matchesClass = student.className.toLowerCase().includes(q);
        const matchesMentor = student.mentorName.toLowerCase().includes(q);
        const matchesNotes = student.notes.toLowerCase().includes(q);
        if (!matchesName && !matchesAd && !matchesId && !matchesClass && !matchesMentor && !matchesNotes) {
          return false;
        }
      }

      // Class
      if (selectedClassFilter !== 'ALL' && student.className !== selectedClassFilter) {
        return false;
      }

      // Mentor
      if (selectedMentorFilter !== 'ALL' && student.mentorName !== selectedMentorFilter) {
        return false;
      }

      // Coin Status
      if (selectedCoinStatusFilter !== 'ALL' && student.coinStatus !== selectedCoinStatusFilter) {
        return false;
      }

      // Tier
      if (selectedTierFilter !== 'ALL') {
        if (selectedTierFilter === '60+' && student.totalCoins < 60) return false;
        if (selectedTierFilter === '30-59' && (student.totalCoins < 30 || student.totalCoins >= 60)) return false;
        if (selectedTierFilter === '15-29' && (student.totalCoins < 15 || student.totalCoins >= 30)) return false;
        if (selectedTierFilter === '1-14' && (student.totalCoins < 1 || student.totalCoins >= 15)) return false;
        if (selectedTierFilter === '0' && student.totalCoins !== 0) return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClassFilter, selectedMentorFilter, selectedTierFilter, selectedCoinStatusFilter]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'campusRankNum') {
        comparison = a.campusRankNum - b.campusRankNum;
      } else if (sortField === 'totalCoins') {
        comparison = a.totalCoins - b.totalCoins;
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'className') {
        comparison = a.className.localeCompare(b.className);
      } else if (sortField === 'adNo') {
        comparison = a.adNo.localeCompare(b.adNo, undefined, { numeric: true });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, sortField, sortDirection]);

  // Pagination
  const totalPages = pageSize === -1 ? 1 : Math.ceil(sortedStudents.length / pageSize);
  const paginatedStudents = useMemo(() => {
    if (pageSize === -1) return sortedStudents;
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'totalCoins' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs mb-8 transition-colors duration-150">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, AD No, Student ID, class, mentor..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white dark:focus:bg-slate-900 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Coin Status Segmented Filter */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg scrollbar-none text-xs">
            <button
              onClick={() => {
                setSelectedCoinStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCoinStatusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Statuses ({students.length})
            </button>
            <button
              onClick={() => {
                setSelectedCoinStatusFilter('CONFIRMED');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCoinStatusFilter === 'CONFIRMED'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Confirmed Earners
            </button>
            <button
              onClick={() => {
                setSelectedCoinStatusFilter('ASSUMED_ZERO');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCoinStatusFilter === 'ASSUMED_ZERO'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Assumed Zero (S1A/S1B)
            </button>
            <button
              onClick={() => {
                setSelectedCoinStatusFilter('MISSING_OR_ZERO');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCoinStatusFilter === 'MISSING_OR_ZERO'
                  ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Baseline Zero
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          {/* Class Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Class:</span>
            <select
              value={selectedClassFilter}
              onChange={e => {
                setSelectedClassFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="ALL">All Classes ({classList.length})</option>
              {classList.map(cls => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Mentor Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Mentor:</span>
            <select
              value={selectedMentorFilter}
              onChange={e => {
                setSelectedMentorFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700 max-w-[200px] truncate"
            >
              <option value="ALL">All Mentors ({mentorList.length})</option>
              {mentorList.map(mentor => (
                <option key={mentor} value={mentor}>
                  {mentor}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Tier:</span>
            <select
              value={selectedTierFilter}
              onChange={e => {
                setSelectedTierFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="ALL">All Tiers</option>
              <option value="60+">Diamond (60+ Coins)</option>
              <option value="30-59">Gold (30–59 Coins)</option>
              <option value="15-29">Silver (15–29 Coins)</option>
              <option value="1-14">Bronze (1–14 Coins)</option>
              <option value="0">Zero Coins (0 Coins)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(selectedClassFilter !== 'ALL' || selectedMentorFilter !== 'ALL' || selectedTierFilter !== 'ALL' || selectedCoinStatusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedClassFilter('ALL');
                setSelectedMentorFilter('ALL');
                setSelectedTierFilter('ALL');
                setSelectedCoinStatusFilter('ALL');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 underline font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-slate-500 font-mono tabular-nums">
            Showing <span className="font-semibold text-slate-800">{sortedStudents.length}</span> of {students.length} students
          </div>
        </div>
      </div>

      {/* Mobile Card List (Phones & Small screens) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {paginatedStudents.length === 0 ? (
          <div className="py-10 text-center text-slate-500 dark:text-slate-400 px-4">
            <p className="font-semibold text-slate-700 dark:text-slate-300">No students found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try modifying your search or clearing active filters.</p>
          </div>
        ) : (
          paginatedStudents.map(student => {
            const isChampion = student.campusRankNum === 1;

            return (
              <div
                key={student.id}
                className={`p-3.5 space-y-2.5 transition-colors active:bg-slate-50 dark:active:bg-slate-800/60 ${
                  isChampion ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-white dark:bg-slate-900'
                }`}
                onClick={() => onSelectStudent(student)}
              >
                {/* Header: Avatar, Name, Official ID, Coin Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{student.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate flex items-center gap-1.5">
                        <span>{student.name}</span>
                        {isChampion && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {student.officialId || `DHAC/ST/2026/${student.className}/${student.adNo}`}
                      </div>
                    </div>
                  </div>

                  {/* Coin Badge */}
                  <div className="shrink-0 text-right flex items-center gap-1.5">
                    <Coin3D size="xs" tier={student.tier as any} />
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      student.totalCoins > 0 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      <span>{student.totalCoins}</span>
                    </span>
                  </div>
                </div>

                {/* Sub details: Class, Batch, Mentor, AD */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Class & Batch</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student.className}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]"> · {student.batchName}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Faculty Mentor</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block" title={student.mentorName}>
                      {student.mentorName}
                    </span>
                  </div>
                </div>

                {/* Ranks Breakdown */}
                <div className="flex items-center justify-between text-xs bg-slate-50/70 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-sans">Campus</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">#{student.campusRankNum}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">/{student.campusTotalStudents}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-750" />
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-sans">Class</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">#{student.classRankNum}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">/{student.classSize}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-750" />
                  <div className="text-center">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-sans">Mentor</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">#{student.mentorRankNum}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">/{student.mentorGroupSize}</span>
                  </div>
                </div>

                {/* Action Buttons (Touch Friendly) */}
                <div 
                  className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => onSelectStudent(student)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-lg flex items-center gap-1 touch-manipulation min-h-[36px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>

                  {onOpenIDCard && (
                    <button
                      onClick={() => onOpenIDCard(student)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1 touch-manipulation min-h-[36px]"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>ID Card</span>
                    </button>
                  )}

                  <button
                    onClick={() => onPrintCertificate(student)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-1 touch-manipulation min-h-[36px]"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Certificate</span>
                  </button>

                  {isAdmin && onEditStudent && (
                    <button
                      onClick={() => onEditStudent(student)}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Edit Student"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isAdmin && onDeleteStudent && (
                    <button
                      onClick={() => {
                        if (deletingStudentId === student.id) {
                          onDeleteStudent(student.id);
                          setDeletingStudentId(null);
                        } else {
                          setDeletingStudentId(student.id);
                          setTimeout(() => setDeletingStudentId(prev => (prev === student.id ? null : prev)), 4000);
                        }
                      }}
                      className={`p-2 rounded-lg border touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center transition ${
                        deletingStudentId === student.id
                          ? 'bg-rose-600 text-white border-rose-700 animate-pulse text-xs font-semibold px-2'
                          : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                      title={deletingStudentId === student.id ? 'Click to confirm delete' : 'Remove Student'}
                    >
                      {deletingStudentId === student.id ? (
                        <span className="text-[11px] font-bold">Confirm</span>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Multi-column Table (Tablets & Desktops) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/70 text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th
                onClick={() => handleSort('campusRankNum')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Campus Rank</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap">Student ID</th>
              <th
                onClick={() => handleSort('adNo')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>AD No</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Student Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('className')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Class</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap">Class Rank</th>
              <th className="py-3 px-3 whitespace-nowrap">Mentor Name</th>
              <th className="py-3 px-3 whitespace-nowrap">Mentor Rank</th>
              <th
                onClick={() => handleSort('totalCoins')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Coins</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 whitespace-nowrap">Status</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <div className="max-w-xs mx-auto">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No students match current filters</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try modifying your search or clearing active filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedStudents.map(student => {
                const isChampion = student.campusRankNum === 1;

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                      isChampion ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                    }`}
                    onClick={() => onSelectStudent(student)}
                  >
                    {/* Campus Rank with denominator */}
                    <td className="py-3 px-3 font-mono font-medium whitespace-nowrap tabular-nums">
                      <div className="flex items-center gap-1">
                        {isChampion ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            #{student.campusRankNum}
                          </span>
                        ) : (
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">
                            #{student.campusRankNum}
                          </span>
                        )}
                        <span className="text-slate-400 dark:text-slate-500 text-[11px]">/ {student.campusTotalStudents}</span>
                      </div>
                    </td>

                    {/* Student ID */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs tabular-nums">
                      {student.studentId}
                    </td>

                    {/* AD No with flag marker if applicable */}
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      <div className="flex items-center gap-1">
                        <span>{student.adNo}</span>
                        {student.adFlag === 'ORIGINAL_ASTERISK' && (
                          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-semibold" title="Original record had asterisk in AD">
                            *
                          </span>
                        )}
                        {student.adFlag === 'MISSING_AD' && (
                          <span className="text-rose-600 dark:text-rose-400 text-[10px] font-bold" title="Temporary canonical ID assigned">
                            [TMP]
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Student Name & Official ID */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{student.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                            <span>{student.name}</span>
                            {student.notes && student.notes.includes('Corrected') && (
                              <span className="text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-sans font-normal">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 tracking-tight mt-0.5">
                            {student.officialId || `DHAC/ST/2026/${student.className}/${student.adNo}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {student.className}
                    </td>

                    {/* Class Rank with denominator */}
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap tabular-nums">
                      #{student.classRankNum} <span className="text-slate-400 dark:text-slate-500 text-[11px]">/ {student.classSize}</span>
                    </td>

                    {/* Mentor */}
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap max-w-[170px] truncate" title={student.mentorName}>
                      {student.mentorName}
                    </td>

                    {/* Mentor Group Rank with denominator */}
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap tabular-nums">
                      #{student.mentorRankNum} <span className="text-slate-400 dark:text-slate-500 text-[11px]">/ {student.mentorGroupSize}</span>
                    </td>

                    {/* Total Coins */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono tabular-nums font-bold">
                      <div className="flex items-center justify-end gap-1.5">
                        {student.totalCoins > 0 && <Coin3D size="xs" tier={student.tier as any} />}
                        <span className={student.totalCoins >= 60 ? 'text-amber-600 dark:text-amber-400 font-black' : student.totalCoins > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600 font-normal'}>
                          {student.totalCoins}
                        </span>
                      </div>
                    </td>

                    {/* Status Badges */}
                    <td className="py-3 px-3 whitespace-nowrap text-xs">
                      {student.coinStatus === 'CONFIRMED' && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">Official</span>
                      )}
                      {student.coinStatus === 'ASSUMED_ZERO' && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">Assumed 0</span>
                      )}
                      {student.coinStatus === 'MISSING_OR_ZERO' && (
                        <span className="text-slate-500 dark:text-slate-400 font-normal">Unawarded</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3 px-3 text-center whitespace-nowrap"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectStudent(student)}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {onOpenIDCard && (
                          <button
                            onClick={() => onOpenIDCard(student)}
                            title="Official Student ID Card"
                            className="p-1.5 text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onPrintCertificate(student)}
                          title="Print Certificate"
                          className="p-1.5 text-slate-400 hover:text-amber-800 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 rounded transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && onEditStudent && (
                          <button
                            onClick={() => onEditStudent(student)}
                            title="Edit Student Info (Admin)"
                            className="p-1.5 text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && onDeleteStudent && (
                          <button
                            onClick={() => {
                              if (deletingStudentId === student.id) {
                                onDeleteStudent(student.id);
                                setDeletingStudentId(null);
                              } else {
                                setDeletingStudentId(student.id);
                                setTimeout(() => setDeletingStudentId(prev => (prev === student.id ? null : prev)), 4000);
                              }
                            }}
                            title={deletingStudentId === student.id ? 'Click to confirm permanent removal' : 'Remove Student (Admin)'}
                            className={`p-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                              deletingStudentId === student.id
                                ? 'bg-rose-600 text-white font-semibold text-[10px] px-2'
                                : 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deletingStudentId === student.id && <span>Confirm</span>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={-1}>All ({sortedStudents.length})</option>
          </select>
        </div>

        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-1 font-mono tabular-nums">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Previous
            </button>
            <span className="px-2 text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
