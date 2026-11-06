import React, { useState } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle, Wallet, Info } from 'lucide-react';
import { CartDueRecord, CartDuePaymentMethod } from '../../types';
import { useCartDue } from '../../context/CartDueContext';
import { formatCurrency } from '../../utils/formatters';

interface RecordPaymentModalProps {
  record: CartDueRecord;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  record,
  onClose,
  onSuccess,
}) => {
  const { recordPayment } = useCartDue();

  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'custom'>('full');
  const [amountStr, setAmountStr] = useState<string>(String(record.remaining_amount));
  const [paymentMethod, setPaymentMethod] = useState<CartDuePaymentMethod>('UPI');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parsedAmount = parseFloat(amountStr) || 0;
  const isExcess = parsedAmount > record.remaining_amount;
  const excessAmount = isExcess ? parsedAmount - record.remaining_amount : 0;

  const handlePaymentTypeChange = (type: 'full' | 'partial' | 'custom') => {
    setPaymentType(type);
    if (type === 'full') {
      setAmountStr(String(record.remaining_amount));
    } else if (type === 'partial') {
      setAmountStr(String(Math.round(record.remaining_amount / 2)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (parsedAmount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    setLoading(true);
    try {
      const res = await recordPayment({
        recordId: record.id,
        amount: parsedAmount,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to record payment.');
        setLoading(false);
        return;
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Record Cart Due Payment
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Client: {record.client_name} ({record.client_id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Record Details Context Strip */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Provider</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{record.provider_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Original Due</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {formatCurrency(record.original_amount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Current Remaining</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(record.remaining_amount)}
              </span>
            </div>
          </div>

          {/* Payment Type Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Allocation
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('full')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  paymentType === 'full'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Full Due ({formatCurrency(record.remaining_amount)})
              </button>
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('partial')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  paymentType === 'partial'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Partial (50%)
              </button>
              <button
                type="button"
                onClick={() => handlePaymentTypeChange('custom')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  paymentType === 'custom'
                    ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                Custom / Excess
              </button>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              value={amountStr}
              onChange={e => {
                setAmountStr(e.target.value);
                setPaymentType('custom');
              }}
              className="w-full px-3 py-2 text-sm font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Excess Amount Advance Credit Notice */}
          {isExcess && (
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 flex items-start gap-2">
              <Wallet className="w-4 h-4 shrink-0 mt-0.5 text-purple-600" />
              <div>
                <p className="font-semibold text-[11px]">Advance Credit Creation</p>
                <p className="text-[10px] mt-0.5">
                  This payment clears the entire balance of {formatCurrency(record.remaining_amount)}. The remaining{' '}
                  <strong className="font-mono">{formatCurrency(excessAmount)}</strong> will be credited to{' '}
                  <strong>{record.client_name}&apos;s</strong> advance credit account for future manual allocation.
                </p>
              </div>
            </div>
          )}

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as CartDuePaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="NetBanking">NetBanking / NEFT</option>
                <option value="Cheque">Cheque</option>
                <option value="Advance Credit">Apply Advance Credit</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reference / Txn ID
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-98124971 or CHQ-0021"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Collection Note
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in clinic counter after post-op review"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : 'Confirm Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
