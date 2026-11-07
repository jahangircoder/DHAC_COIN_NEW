import React, { useState, useMemo, useEffect } from 'react';
import { X, Coins, User, Users } from 'lucide-react';
import { StudentRecord, CoinTransaction, AuthUser } from '../types/student';
import { COIN_RULES_TABLE, CoinCategory } from '../data/coinRules';
import { getBatchName } from '../data/batchNames';

interface AwardCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
  coinCategories?: CoinCategory[];
  currentUser: AuthUser | null;
  onAwardCoins: (transaction: Omit<CoinTransaction, 'id' | 'timestamp'>) => void;
  preselectedStudent?: StudentRecord | null;
}

export const AwardCoinModal: React.FC<AwardCoinModalProps> = ({
  isOpen,
  onClose,
  students,
  coinCategories = COIN_RULES_TABLE,
  currentUser,
  onAwardCoins,
  preselectedStudent,
}) => {
  const categories = coinCategories.length > 0 ? coinCategories : COIN_RULES_TABLE;
  const [targetType, setTargetType] = useState<'STUDENT' | 'CLASS'>('STUDENT');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id || students[0]?.id || ''
  );
  const [selectedClassName, setSelectedClassName] = useState<string>('S4');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0].id);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(categories[0].activities[0].id);
  const [customCoins, setCustomCoins] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');

  useEffect(() => {
    if (preselectedStudent) {
      setTargetType('STUDENT');
      setSelectedStudentId(preselectedStudent.id);
    }
  }, [preselectedStudent]);

  const classList = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className))).sort();
  }, [students]);

  // 2. FIXED: High-speed window array slicing engine (Limits options to 15 nodes max)
  const efficientFilteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) {
      return students.slice(0, 15); // Return only the first 15 records if search is empty
    }
    
    const matched: StudentRecord[] = [];
    for (let i = 0; i < students.length; i++) {
      if (matched.length >= 15) break; // Terminate loop instantly when target buffer is satisfied
      
      const s = students[i];
      if (
        s.name.toLowerCase().includes(query) ||
        s.adNo.includes(query) ||
        s.className.toLowerCase().includes(query)
      ) {
        matched.push(s);
      }
    }
    return matched;
  }, [students, studentSearch]);

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
  const currentActivity = currentCategory.activities.find(a => a.id === selectedActivityId) || currentCategory.activities[0];
  const isCustomCoin = currentActivity.coins === 'custom';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const coinsToCredit = isCustomCoin ? Math.max(1, customCoins) : (currentActivity.coins as number);
    
    if (targetType === 'STUDENT') {
      // Prioritize active selection index, fall back to window head if active index slips out of window view
      const activeId = efficientFilteredStudents.some(s => s.id === selectedStudentId)
        ? selectedStudentId
        : efficientFilteredStudents[0]?.id;

      const student = students.find(s => s.id === activeId);
      if (!student) return;

      onAwardCoins({
        targetType: 'STUDENT',
        studentId: student.id,
        studentName: student.name,
        adNo: student.adNo,
        className: student.className,
        category: currentCategory.categoryName,
        activityName: currentActivity.name,
        coins: coinsToCredit,
        awardedBy: currentUser ? `${currentUser.username} (${currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff'})` : 'Admin',
        notes: notes.trim() || undefined,
      });
    } else {
      onAwardCoins({
        targetType: 'CLASS',
        className: selectedClassName,
        category: currentCategory.categoryName,
        activityName: currentActivity.name,
        coins: coinsToCredit,
        awardedBy: currentUser ? `${currentUser.username} (${currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff'})` : 'Admin',
        notes: notes.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Official DHAC Coin Distribution Engine
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Award Merit Incentive Coins
          </h2>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Target Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Award Recipient Target:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('STUDENT')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  targetType === 'STUDENT'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4 text-emerald-700" />
                <span>Individual Student</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('CLASS')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  targetType === 'CLASS'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Entire Class Batch</span>
              </button>
            </div>
          </div>

          {/* Conditional Dropdown Windows */}
          {targetType === 'STUDENT' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Search & Select Student:
              </label>
              <input
                type="text"
                placeholder="Type name, admission number, or class to filter down..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {efficientFilteredStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    AD #{s.adNo} — {s.name} (Class {s.className} - {getBatchName(s.className)})
                  </option>
                ))}
                {efficientFilteredStudents.length === 0 && (
                  <option disabled>No students match your query</option>
                )}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Academic Class Batch:
              </label>
              <select
                value={selectedClassName}
                onChange={e => setSelectedClassName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {classList.map(cls => (
                  <option key={cls} value={cls}>
                    Class {cls} — Batch: {getBatchName(cls)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Activity Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Activity Category:
            </label>
            <select
              value={selectedCategoryId}
              onChange={e => {
                setSelectedCategoryId(e.target.value);
                const cat = categories.find(c => c.id === e.target.value);
                if (cat && cat.activities.length > 0) {
                  setSelectedActivityId(cat.activities[0].id);
                }
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Activity & Merit Criteria:
            </label>
            <select
              value={selectedActivityId}
              onChange={e => setSelectedActivityId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
            >
              {currentCategory.activities.map(act => (
                <option key={act.id} value={act.id}>
                  {act.name} ({act.coins === 'custom' ? 'Custom Amount' : `+${act.coins} Coins`})
                </option>
              ))}
            </select>
          </div>

          {/* Coin Preview / Custom Input */}
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">Credit Value:</div>
              <div className="text-2xl font-black font-mono text-amber-950 dark:text-amber-200 tabular-nums">
                {isCustomCoin ? `${customCoins} Coins` : `+${currentActivity.coins} Coins`}
              </div>
            </div>
            {isCustomCoin && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">Coins:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customCoins}
                  onChange={e => setCustomCoins(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-2 py-1 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded text-center text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          {/* Verification Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Administrative Citation & Remarks (Optional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. 1st Place in Inter-Campus Public Speech, Academic Year 2026"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow-sm cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>Confirm & Credit Coins</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
