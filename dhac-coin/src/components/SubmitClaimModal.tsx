import React, { useState } from 'react';
import { X, Send, Coins } from 'lucide-react';
import { StudentRecord, CoinClaim } from '../types/student';
import { COIN_RULES_TABLE, CoinCategory } from '../data/coinRules';

interface SubmitClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  coinCategories?: CoinCategory[];
  onSubmitClaim: (claim: Omit<CoinClaim, 'id' | 'submittedAt' | 'status'>) => void;
}

export const SubmitClaimModal: React.FC<SubmitClaimModalProps> = ({
  isOpen,
  onClose,
  student,
  coinCategories = COIN_RULES_TABLE,
  onSubmitClaim,
}) => {
  const categories = coinCategories.length > 0 ? coinCategories : COIN_RULES_TABLE;
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0].id);
  const [selectedActivityId, setSelectedActivityId] = useState(categories[0].activities[0].id);
  const [customCoins, setCustomCoins] = useState(5);
  const [proofNotes, setProofNotes] = useState('');

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
  const currentActivity = currentCategory.activities.find(a => a.id === selectedActivityId) || currentCategory.activities[0];
  const isCustomCoin = currentActivity.coins === 'custom';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const coinsToClaim = isCustomCoin ? Math.max(1, customCoins) : (currentActivity.coins as number);

    onSubmitClaim({
      studentId: student.id,
      studentName: student.name,
      adNo: student.adNo,
      className: student.className,
      mentorName: student.mentorName,
      category: currentCategory.categoryName,
      activityName: currentActivity.name,
      coins: coinsToClaim,
      proofNotes: proofNotes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Student Merit Claim Request
            </span>
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight">
            Submit Award Coin for Mentor Confirmation
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Your mentor ({student.mentorName}) will review and confirm this claim before coins are credited.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex justify-between">
            <span className="text-slate-600 dark:text-slate-300">Applicant: <strong>{student.name}</strong></span>
            <span className="font-mono text-slate-700 dark:text-slate-200">AD #{student.adNo} · Class {student.className}</span>
          </div>

          {/* Category Dropdown */}
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
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Activity / Achievement Level:
            </label>
            <select
              value={selectedActivityId}
              onChange={e => setSelectedActivityId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium text-slate-900 dark:text-white"
            >
              {currentCategory.activities.map(act => (
                <option key={act.id} value={act.id}>
                  {act.name} — {act.coins === 'custom' ? 'Custom Amount' : `${act.coins} 🪙`}
                </option>
              ))}
            </select>
          </div>

          {/* Coin Preview */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-800 font-medium">Claim Value:</div>
              <div className="text-2xl font-black font-mono text-amber-950 tabular-nums">
                {isCustomCoin ? `${customCoins} 🪙` : `${currentActivity.coins} 🪙`}
              </div>
            </div>

            {isCustomCoin && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-800 font-medium">Specify:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={customCoins}
                  onChange={e => setCustomCoins(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 px-2 py-1 text-sm font-mono font-bold bg-white border border-amber-300 rounded text-center"
                />
              </div>
            )}
          </div>

          {/* Proof / Description Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Achievement Details & Proof Description:
            </label>
            <textarea
              required
              rows={3}
              value={proofNotes}
              onChange={e => setProofNotes(e.target.value)}
              placeholder="e.g. Published article titled 'Ethics of Science' in Campus Monthly; recitation grade card signed..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit for Mentor Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
