import React, { useState } from 'react';
import { X, UserCheck, AlertCircle, Save, Mail } from 'lucide-react';
import { StudentRecord } from '../types/student';
import { getBatchName } from '../data/batchNames';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord;
  mentorsList: string[];
  classesList: string[];
  onSave: (updatedStudent: StudentRecord) => Promise<void>;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  mentorsList,
  classesList,
  onSave,
}) => {
  const [name, setName] = useState(student.name);
  const [adNo, setAdNo] = useState(student.adNo);
  const [className, setClassName] = useState(student.className);
  const [mentorName, setMentorName] = useState(student.mentorName);
  const [studentEmail, setStudentEmail] = useState(student.studentEmail || '');
  const [notes, setNotes] = useState(student.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adNo.trim()) {
      setError('Name and AD Number are required.');
      return;
    }

    setSaving(true);
    try {
      const updated: StudentRecord = {
        ...student,
        name: name.trim().toUpperCase(),
        adNo: adNo.trim(),
        className,
        batchName: getBatchName(className),
        mentorName,
        studentEmail: studentEmail.trim().toLowerCase() || '',
        notes: notes.trim(),
        officialId: `DHAC/ST/2026/${className}/${adNo.trim()}`,
      };
      await onSave(updated);
      onClose();
    } catch {
      setError('Failed to update student record in Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Edit Student Record
              </h2>
              <p className="text-xs text-slate-300">
                Super-Admin institutional modification for {student.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                AD Number
              </label>
              <input
                type="text"
                value={adNo}
                onChange={(e) => setAdNo(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Class / Batch
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
              >
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Faculty Mentor
            </label>
            <select
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
            >
              {mentorsList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Pre-Linked Student Google Email (Optional)</span>
            </label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="e.g. student.ad@gmail.com"
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Audit Notes / Changelog Entry
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Corrected name spelling or class transfer"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
