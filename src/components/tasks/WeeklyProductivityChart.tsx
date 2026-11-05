import React, { useMemo } from 'react';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useTasks } from '../../context/TaskContext';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

export const WeeklyProductivityChart: React.FC = () => {
  const { tasks, totalTasksCount, completedTasksCount, completionPercentage } = useTasks();

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { date: string; display: string; completed: number; pending: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const display = format(d, 'EEE');

      let completed = 0;
      let pending = 0;

      tasks.forEach(task => {
        if (task.task_date === dateStr) {
          if (task.status === 'completed') {
            completed += 1;
          } else {
            pending += 1;
          }
        }
      });

      days.push({ date: dateStr, display, completed, pending });
    }

    return days;
  }, [tasks]);

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Weekly Task Productivity & Velocity</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Completed vs pending scheduled items across the last 7 days.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Completed ({completedTasksCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">Total ({totalTasksCount})</span>
          </div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="display" fontSize={11} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            />
            <Bar dataKey="completed" name="Completed Tasks" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pending Tasks" fill="#94A3B8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">Overall Completion Rate:</span>
        </div>
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {completionPercentage}%
        </span>
      </div>
    </div>
  );
};
