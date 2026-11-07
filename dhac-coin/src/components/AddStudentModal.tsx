import React, { useState } from 'react';
import { X, UserPlus, BookOpen, User, Check } from 'lucide-react';
import { StudentRecord } from '../types/student';
import { getBatchName } from '../data/batchNames';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: Omit<StudentRecord, 'campusRank' | 'campusRankNum' | 'classRank' | 'classRankNum' | 'mentorGroupRank' | 'mentorRankNum' | 'campusTotalStudents' | 'classSize' | 'mentorGroupSize' | 'tier'>) => void;
  existingMentors: string[];
  existingClasses: string[];
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
  existingMentors,
  existingClasses,
}) => {
  const [adNo, setAdNo] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState(existingClasses[0] || 'S1A');
  const [mentorName, setMentorName] = useState(existingMentors[0] || 'FARIDUL ISLAM HUDAWI');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanAd = adNo.trim();
    const cleanName = name.trim().toUpperCase();

    if (!cleanAd || !cleanName) {
      setError('Please provide both Admission Number and Student Name.');
      return;
    }

    const studentId = `STU-${cleanAd}`;

    onAddStudent({
      id: studentId,
      studentId,
      officialId: `DHAC/ST/2026/${className}/${cleanAd}`,
      adNo: cleanAd,
      adFlag: 'VALID',
      name: cleanName,
      className,
      batchName: getBatchName(className),
      mentorName,
      totalCoins: 0,
      coinStatus: 'ZERO',
      rankStatus: 'OFFICIAL',
      notes: `Registered student in Class ${className} (${getBatchName(className)}) under ${mentorName}`,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
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

          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-400 flex items-center justify-center mb-2 shadow-xs">
            <UserPlus className="w-5 h-5 text-amber-300" />
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight">
            Register New Student
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Add a new student profile to the official DHAC coin registry
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Admission Number (AD No):
            </label>
            <input
              type="text"
              required
              value={adNo}
              onChange={e => setAdNo(e.target.value)}
              placeholder="e.g. 930"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Student Full Name:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. MOHAMMAD HAMZA"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white uppercase"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Academic Class & Batch:</span>
              <span className="text-[11px] font-mono text-emerald-800 font-bold">
                {getBatchName(className)}
              </span>
            </label>
            <select
              value={className}
              onChange={e => setClassName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            >
              {existingClasses.map(cls => (
                <option key={cls} value={cls}>
                  Class {cls} — {getBatchName(cls)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Assigned Faculty Mentor / Class Teacher:
            </label>
            <select
              value={mentorName}
              onChange={e => setMentorName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            >
              {existingMentors.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 font-mono">
            Initial balance: <strong>0 Coins</strong> (Standard institutional baseline)
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Register Student</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
