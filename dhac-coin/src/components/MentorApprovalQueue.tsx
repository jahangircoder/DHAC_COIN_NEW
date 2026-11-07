import React from 'react';
import { Check, X, Clock, ShieldCheck, AlertCircle, Coins, User } from 'lucide-react';
import { CoinClaim, AuthUser } from '../types/student';

interface MentorApprovalQueueProps {
  claims: CoinClaim[];
  currentUser: AuthUser | null;
  onApproveClaim: (claimId: string) => void;
  onRejectClaim: (claimId: string, reason?: string) => void;
}

export const MentorApprovalQueue: React.FC<MentorApprovalQueueProps> = ({
  claims,
  currentUser,
  onApproveClaim,
  onRejectClaim,
}) => {
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const mentorFilterName = !isSuperAdmin ? currentUser?.mentorName : undefined;
  const [viewScope, setViewScope] = React.useState<'mentees' | 'all'>(mentorFilterName ? 'mentees' : 'all');
  const [rejectingClaimId, setRejectingClaimId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState<string>('');

  const relevantClaims = claims.filter(c => {
    if (viewScope === 'all' || !mentorFilterName) return true;
    return c.mentorName === mentorFilterName;
  });

  const pendingClaims = relevantClaims.filter(c => c.status === 'PENDING');
  const pastClaims = relevantClaims.filter(c => c.status !== 'PENDING');

  return (
    <div className="space-y-6 mb-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider text-amber-700 dark:text-amber-400 uppercase font-bold">
              STUDENTS AFFAIRS BOARD · VERIFICATION
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Official Merit Award Confirmation Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Student coin submissions remain provisional until confirmed by administrators or faculty mentors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {mentorFilterName && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setViewScope('mentees')}
                className={`px-3 py-1 rounded-md transition ${
                  viewScope === 'mentees' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                My Mentees
              </button>
              <button
                onClick={() => setViewScope('all')}
                className={`px-3 py-1 rounded-md transition ${
                  viewScope === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                All Campus
              </button>
            </div>
          )}

          <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 px-3.5 py-1.5 rounded-xl font-bold">
            Pending: <span className="text-amber-800 dark:text-amber-400">{pendingClaims.length}</span>
          </div>
        </div>
      </div>

      {/* Pending Claims List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Pending Submissions Awaiting Approval ({pendingClaims.length})</span>
        </h3>

        {pendingClaims.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">No pending student claims!</p>
            <p className="text-slate-400 dark:text-slate-500 mt-0.5">All student award requests for your group are confirmed or reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingClaims.map(claim => (
              <div
                key={claim.id}
                className="bg-white dark:bg-slate-900 border-2 border-amber-200/80 dark:border-amber-900/60 rounded-xl p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{claim.studentName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        AD #{claim.adNo} · Class {claim.className}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-lg text-amber-800 dark:text-amber-400 tabular-nums">
                        +{claim.coins} 🪙
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {claim.category} — {claim.activityName}
                    </div>
                    {claim.proofNotes && (
                      <div className="text-slate-600 dark:text-slate-300 italic">
                        "{claim.proofNotes}"
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-1">
                      Submitted: {claim.submittedAt} · Mentor: {claim.mentorName}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {rejectingClaimId === claim.id ? (
                  <div className="mt-4 pt-3 border-t border-rose-200 dark:border-rose-900/60 space-y-2 animate-in fade-in duration-150">
                    <label className="text-xs font-semibold text-rose-800 dark:text-rose-300 block">
                      Optional Rejection Feedback:
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="e.g. Incomplete proof or duplicate claim..."
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingClaimId(null);
                          setRejectReason('');
                        }}
                        className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onRejectClaim(claim.id, rejectReason.trim() || undefined);
                          setRejectingClaimId(null);
                          setRejectReason('');
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingClaimId(claim.id);
                        setRejectReason('');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 rounded-lg transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveClaim(claim.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Credit Coins</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Claims History */}
      {pastClaims.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Recent Review Decisions ({pastClaims.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {pastClaims.slice(0, 10).map(c => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {c.studentName} (+{c.coins} 🪙)
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {c.activityName} · Reviewed by {c.reviewedBy} at {c.reviewedAt}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold font-mono ${
                    c.status === 'APPROVED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
