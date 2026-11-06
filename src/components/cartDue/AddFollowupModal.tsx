import React, { useState } from 'react';
import { X, PhoneCall, Calendar, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  CartDueContactMethod, 
  CartDueContactResult, 
  CartDueFollowup 
} from '../../types';
import { useCartDue } from '../../context/CartDueContext';

interface AddFollowupModalProps {
  initialClientId?: string;
  initialClientName?: string;
  initialProviderName?: string;
  initialRecordId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddFollowupModal: React.FC<AddFollowupModalProps> = ({
  initialClientId = '',
  initialClientName = '',
  initialProviderName = '',
  initialRecordId,
  onClose,
  onSuccess,
}) => {
  const { addFollowup, availableClients } = useCartDue();

  const [clientId, setClientId] = useState(initialClientId);
  const [clientName, setClientName] = useState(initialClientName);
  const [providerName, setProviderName] = useState(initialProviderName);
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState<CartDueContactMethod>('Phone Call');
  const [contactResult, setContactResult] = useState<CartDueContactResult>('Promise to Pay');
  const [notes, setNotes] = useState('');
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When client changes from dropdown
  const handleClientSelect = (selectedId: string) => {
    setClientId(selectedId);
    const found = availableClients.find(c => c.id === selectedId);
    if (found) {
      setClientName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientId.trim() || !clientName.trim()) {
      setErrorMsg('Client Name and Client ID are required.');
      return;
    }

    if (!notes.trim()) {
      setErrorMsg('Please enter follow-up conversation notes.');
      return;
    }

    setLoading(true);
    try {
      await addFollowup({
        record_id: initialRecordId || null,
        client_id: clientId.trim(),
        client_name: clientName.trim(),
        provider_name: providerName.trim() || undefined,
        phone: phone.trim() || undefined,
        contact_method: contactMethod,
        contact_result: contactResult,
        notes: notes.trim(),
        followup_date: followupDate,
        next_followup_date: nextFollowupDate || null,
        has_reminder: hasReminder,
        status: 'Pending',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save follow-up');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Log Cart Due Follow-up
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Record collection call or message outcome
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Client Selection / Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client ID *
              </label>
              {availableClients.length > 0 && !initialClientId ? (
                <select
                  value={clientId}
                  onChange={e => handleClientSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                >
                  <option value="">-- Select Client --</option>
                  {availableClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  placeholder="e.g. 001082"
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Provider & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Provider Name
              </label>
              <input
                type="text"
                value={providerName}
                onChange={e => setProviderName(e.target.value)}
                placeholder="e.g. Dr. Rohan Sharma"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Client Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 9811234567"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Contact Method & Outcome Result */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Method *
              </label>
              <select
                value={contactMethod}
                onChange={e => setContactMethod(e.target.value as CartDueContactMethod)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="Phone Call">Phone Call</option>
                <option value="WhatsApp">WhatsApp Message</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS Notification</option>
                <option value="In-Person">In-Person at Clinic</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Result *
              </label>
              <select
                value={contactResult}
                onChange={e => setContactResult(e.target.value as CartDueContactResult)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="Promise to Pay">Promise to Pay</option>
                <option value="Disputed Amount">Disputed Amount</option>
                <option value="Call Not Answered">Call Not Answered</option>
                <option value="Follow Up Later">Follow Up Later</option>
                <option value="Paid Confirmed">Paid Confirmed</option>
                <option value="Wrong Contact">Wrong Contact / Switched Off</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Follow-up Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Follow-up Conversation Notes *
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Spoke with pet owner. Confirmed surgery cart due of ₹18,500. Promised UPI transfer tomorrow by 4 PM."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Date & Next Scheduled Call */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followupDate}
                onChange={e => setFollowupDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Next Follow-up Date
              </label>
              <input
                type="date"
                value={nextFollowupDate}
                onChange={e => setNextFollowupDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="cartReminder"
              checked={hasReminder}
              onChange={e => setHasReminder(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="cartReminder" className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <Bell className="w-3.5 h-3.5 text-blue-500" />
              <span>Enable priority reminder flag for next follow-up</span>
            </label>
          </div>

          {/* Footer Submit */}
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
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Follow-up'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
