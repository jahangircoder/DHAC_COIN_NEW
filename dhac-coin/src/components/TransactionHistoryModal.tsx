import React, { useState } from 'react';
import { X, History, Download, Coins, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CoinTransaction, AuthUser } from '../types/student';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: CoinTransaction[];
  currentUser?: AuthUser | null;
  onRevokeTransaction?: (transactionId: string) => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  currentUser,
  onRevokeTransaction,
}) => {
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleExportTransactions = () => {
    const headers = ['Transaction_ID', 'Timestamp', 'Target_Type', 'Student_Name', 'AD_No', 'Class', 'Category', 'Activity', 'Coins', 'Awarded_By', 'Notes'];
    const rows = transactions.map(t => [
      `"${t.id}"`,
      `"${t.timestamp}"`,
      `"${t.targetType}"`,
      `"${t.studentName || ''}"`,
      `"${t.adNo || ''}"`,
      `"${t.className}"`,
      `"${t.category}"`,
      `"${t.activityName}"`,
      `"${t.coins}"`,
      `"${t.awardedBy}"`,
      `"${t.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DHAC_Coin_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeRevoke = async (txId: string) => {
    if (!onRevokeTransaction) return;
    setRevoking(true);
    try {
      await onRevokeTransaction(txId);
      setConfirmRevokeId(null);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 relative shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-400 flex items-center justify-center shadow-xs">
              <History className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Coin Crediting Audit Ledger ({transactions.length})
                </h2>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    Super Admin Controls Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Complete event log with Super-Admin coin revocation & audit trail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <button
                onClick={handleExportTransactions}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger CSV</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {transactions.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Coins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No coin transactions recorded yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All 290 students start at 0 coins. When administrators award coins, transactions will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {transactions.map(t => {
                const isConfirmingThis = confirmRevokeId === t.id;

                return (
                  <div key={t.id} className="py-3 px-2.5 hover:bg-slate-50/80 rounded-lg transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-emerald-800 font-bold text-sm tabular-nums">
                            +{t.coins} 🪙
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {t.targetType === 'STUDENT' ? t.studentName : `Class ${t.className} (Batch Award)`}
                          </span>
                          {t.targetType === 'STUDENT' && (
                            <span className="text-[11px] font-mono text-slate-500">
                              (AD #{t.adNo} · {t.className})
                            </span>
                          )}
                        </div>

                        <div className="text-slate-600 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-medium text-slate-800">{t.category}</span>
                          <span>·</span>
                          <span>{t.activityName}</span>
                          {t.notes && (
                            <>
                              <span>·</span>
                              <span className="italic text-slate-500">"{t.notes}"</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                        <div className="text-right font-mono text-[11px] tabular-nums text-slate-500">
                          <div>{t.timestamp}</div>
                          <div className="text-slate-400 text-[10px]">by {t.awardedBy}</div>
                        </div>

                        {/* Super Admin Remove / Revoke Button */}
                        {isSuperAdmin && onRevokeTransaction && (
                          <div>
                            {!isConfirmingThis ? (
                              <button
                                onClick={() => setConfirmRevokeId(t.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition"
                                title="Revoke this coin award and rollback balance"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Remove Coin</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                                <span className="text-[11px] font-semibold text-rose-900">
                                  Confirm remove?
                                </span>
                                <button
                                  onClick={() => executeRevoke(t.id)}
                                  disabled={revoking}
                                  className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 rounded transition"
                                >
                                  {revoking ? 'Removing...' : 'Yes, Revoke'}
                                </button>
                                <button
                                  onClick={() => setConfirmRevokeId(null)}
                                  className="px-1.5 py-0.5 text-[11px] text-slate-600 hover:text-slate-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isConfirmingThis && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Warning: Revoking will deduct {t.coins} coins from {t.targetType === 'STUDENT' ? t.studentName : `Class ${t.className}`} and dynamically update standings and competition ranks across the campus.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Official DHAC Reward Audit Trail · Super-Admin Reversal Enabled</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

