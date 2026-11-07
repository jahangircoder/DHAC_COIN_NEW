import React, { useState } from 'react';
import { X, Award, AlertCircle, Save, Mail } from 'lucide-react';
import { TeacherRecord } from '../types/student';

interface EditMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherRecord;
  onSave: (updatedTeacher: TeacherRecord, oldName: string) => Promise<void>;
}

export const EditMentorModal: React.FC<EditMentorModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSave,
}) => {
  const [name, setName] = useState(teacher.name);
  const [username, setUsername] = useState(teacher.username);
  const [teacherId, setTeacherId] = useState(teacher.teacherId);
  const [assignedEmail, setAssignedEmail] = useState(teacher.assignedEmail || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      setError('Name and username are required.');
      return;
    }

    setSaving(true);
    try {
      const updated: TeacherRecord = {
        ...teacher,
        name: name.trim().toUpperCase(),
        username: username.trim(),
        teacherId: teacherId.trim(),
        assignedEmail: assignedEmail.trim().toLowerCase() || undefined,
      };
      await onSave(updated, teacher.name);
      onClose();
    } catch {
      setError('Failed to update mentor in Firestore.');
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Edit Faculty Mentor
              </h2>
              <p className="text-xs text-slate-300">
                Institutional profile & Google email binding for {teacher.name}
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
              Faculty / Mentor Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teacher ID
            </label>
            <input
              type="text"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Portal Identifier / Handle
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Authorized Google Email (For Faculty Sign-In)</span>
            </label>
            <input
              type="email"
              value={assignedEmail}
              onChange={(e) => setAssignedEmail(e.target.value)}
              placeholder="e.g. mentor.name@gmail.com"
              className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-hidden text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Pre-authorizes this Google account to auto-activate TEACHER_ADMIN permissions on login.
            </p>
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
