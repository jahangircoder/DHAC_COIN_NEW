import React, { useRef } from 'react';
import { X, Printer, User, Award, Shield, QrCode, Camera } from 'lucide-react';
import { StudentRecord, AuthUser } from '../types/student';
import { getBatchName } from '../data/batchNames';
import { Coin3D } from './Coin3D';

interface StudentIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
  currentUser: AuthUser | null;
  onUpdatePhoto?: (studentId: string, photoUrl: string) => void;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({
  isOpen,
  onClose,
  student,
  currentUser,
  onUpdatePhoto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result && onUpdatePhoto) {
        onUpdatePhoto(student.id, result);
      }
    };
    reader.readAsDataURL(file);
  };

  const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'TEACHER_ADMIN';
  const batchName = student.batchName || getBatchName(student.className);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Hidden File Input for Photo Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Top Control Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between no-print bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Official Student Identity Card
            </span>
            <span className="text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              2026-2027
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Physical-Style ID Card (Front) */}
        <div className="p-4 sm:p-6 bg-slate-100/60 flex justify-center overflow-y-auto flex-1">
          <div className="w-full max-w-[340px] bg-gradient-to-b from-white via-white to-slate-50 border-2 border-emerald-900/40 rounded-2xl shadow-xl overflow-hidden relative text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Top Emerald Header Strip */}
            <div className="bg-emerald-900 text-white p-3 text-center relative border-b-2 border-amber-400 shrink-0">
              {/* Crest Logo */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <img
                  src="/assets/aistudio/image_434e52c1.png"
                  alt="Darul Huda Crest"
                  className="w-10 h-10 rounded-full border border-amber-300 shadow-xs object-contain bg-white p-0.5"
                  onError={e => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 leading-tight">
                    DARUL HUDA ISLAMIC UNIVERSITY
                  </div>
                  <div className="text-[9px] font-bold text-white/90 tracking-wide uppercase">
                    ASSAM CENTRE
                  </div>
                </div>
              </div>

              <div className="text-[9px] tracking-widest font-semibold uppercase bg-emerald-950/80 text-emerald-200 py-0.5 rounded px-2 mt-0.5 inline-block">
                STUDENTS AFFAIRS BOARD
              </div>
            </div>

            {/* Photo & Identity Section */}
            <div className="p-4 text-center">
              {/* Student Photo with Admin Upload Trigger */}
              <div className="relative inline-block mx-auto mb-2.5">
                <div className="w-24 h-28 rounded-xl border-2 border-slate-300 overflow-hidden bg-slate-100 shadow-inner flex items-center justify-center mx-auto">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <User className="w-10 h-10 text-slate-400" />
                      <span className="text-[9px] font-mono mt-1 text-slate-400">NO PHOTO</span>
                    </div>
                  )}
                </div>

                {onUpdatePhoto && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload / Change Student Photo"
                    className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900 hover:bg-emerald-700 text-white rounded-full shadow-md transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Student Name */}
              <h3 className="font-extrabold text-slate-950 text-base leading-tight tracking-tight uppercase">
                {student.name}
              </h3>

              {/* Canonical Official ID */}
              <div className="text-[11px] font-mono font-bold text-emerald-900 mt-1 bg-emerald-50 py-0.5 px-2 rounded-md inline-block border border-emerald-200">
                {student.officialId}
              </div>

              {/* Identity Details Grid */}
              <div className="mt-3.5 pt-3 border-t border-slate-200 text-left text-xs space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Admission No:</span>
                  <span className="font-mono font-bold text-slate-900">{student.adNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Class & Batch:</span>
                  <span className="font-bold text-slate-900">
                    Class {student.className} <span className="font-semibold text-emerald-800">({batchName})</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Faculty Mentor:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[160px]" title={student.mentorName}>
                    {student.mentorName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Merit Coins:</span>
                  <div className="flex items-center gap-1 font-mono font-black text-amber-700">
                    <Coin3D size="xs" tier={student.tier as any} />
                    <span>{student.totalCoins} Coins</span>
                  </div>
                </div>
              </div>

              {/* Barcode & Signature Strip */}
              <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex items-center justify-between">
                {/* Barcode simulation */}
                <div className="space-y-0.5">
                  <div className="flex gap-[2px] h-6 items-end">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3].map((w, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800 h-full"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">
                    DHAC-ST-{student.adNo}
                  </div>
                </div>

                {/* Authority Signature */}
                <div className="text-right">
                  <div className="border-b border-slate-400 w-24 mb-0.5 h-4" />
                  <div className="text-[8px] font-bold uppercase text-slate-700">
                    Authorized Signatory
                  </div>
                  <div className="text-[7px] text-slate-400">
                    Students Affairs Board
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer Accent */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-800" />
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-500 no-print flex items-center justify-between shrink-0">
          <span>Official Institutional Student Credential</span>
          {isAdmin && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-emerald-800 hover:underline font-semibold cursor-pointer"
            >
              Upload Student Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
