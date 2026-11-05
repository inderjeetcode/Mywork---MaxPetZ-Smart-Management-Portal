import React, { useState, useEffect } from 'react';
import { BookOpen, Check, Save } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export const DailyNotesWidget: React.FC = () => {
  const { dailyNotes, saveDailyNote } = useTasks();
  const todayStr = new Date().toISOString().split('T')[0];

  const [noteContent, setNoteContent] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setNoteContent(dailyNotes[todayStr] || '');
  }, [dailyNotes, todayStr]);

  const handleSave = async () => {
    await saveDailyNote(todayStr, noteContent);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Daily Operational Notes ({todayStr})
          </h3>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Note</span>
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-slate-400">
        Private scratchpad for today's clinic follow-ups, calls, payment commitments, or reminders. Persists across sessions.
      </p>

      <textarea
        rows={6}
        value={noteContent}
        onChange={e => setNoteContent(e.target.value)}
        placeholder="Type notes for today (e.g. Called Dr. Rohan regarding INV-1005; client promised UPI transfer by 4 PM)..."
        className="w-full p-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
};
