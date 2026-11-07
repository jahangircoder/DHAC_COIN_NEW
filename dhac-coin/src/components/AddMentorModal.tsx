import React, { useState } from 'react';
import { X, Award, Check, Mail } from 'lucide-react';

interface AddMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMentor: (mentorName: string, assignedEmail?: string) => void;
  existingMentors: string[];
}

export const AddMentorModal: React.FC<AddMentorModalProps> = ({
  isOpen,
  onClose,
  onAddMentor,
  existingMentors,
}) => {
  const [mentorName, setMentorName] = useState('');
  const [assignedEmail, setAssignedEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let clean = mentorName.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a mentor name.');
      return;
    }

    if (!clean.includes('HUDAWI')) {
      clean = `${clean} HUDAWI`;
    }

    if (existingMentors.includes(clean)) {
      setError(`Mentor "${clean}" already exists in the faculty roster.`);
      return;
    }

    onAddMentor(clean, assignedEmail.trim().toLowerCase() || undefined);
    setMentorName('');
    setAssignedEmail('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 relative border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-400 flex items-center justify-center mb-2 shadow-xs">
            <Award className="w-5 h-5 text-amber-300" />
          </div>

          <h2 className="text-lg font-bold text-white tracking-tight">
            Add Faculty Mentor
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Register a new mentor to supervise mentee groups and award merit points
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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mentor Full Name:
            </label>
            <input
              type="text"
              required
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              placeholder="e.g. AHMAD KABEER HUDAWI"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white uppercase text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              "HUDAWI" will be automatically appended if omitted.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Authorized Google Email (Optional):</span>
            </label>
            <input
              type="email"
              value={assignedEmail}
              onChange={(e) => setAssignedEmail(e.target.value)}
              placeholder="e.g. ustad@gmail.com"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 rounded-lg transition shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Add Mentor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
