import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  FastForward, 
  Search, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  X,
  Bell,
  Sparkles,
  Tag
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { TaskCard } from './TaskCard';
import { DailyNotesWidget } from './DailyNotesWidget';
import { WeeklyProductivityChart } from './WeeklyProductivityChart';
import { Priority, Task } from '../../types';

interface TaskDashboardViewProps {
  currentTab: 'all_tasks' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'notes' | 'productivity';
}

export const TaskDashboardView: React.FC<TaskDashboardViewProps> = ({ currentTab }) => {
  const {
    tasks,
    todayTasks,
    upcomingTasks,
    overdueTasks,
    completedTasks,
    totalTasksCount,
    completedTasksCount,
    pendingTasksCount,
    overdueTasksCount,
    completionPercentage,
    todayProgress,
    completionToast,
    addTask,
    carryForwardPendingTasks,
    categories,
    addCustomCategory,
    requestReminderPermission,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickCategory, setQuickCategory] = useState(categories[0] || 'Daily Reporting');

  // New Detailed Task Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalTime, setModalTime] = useState('11:00');
  const [modalPriority, setModalPriority] = useState<Priority>('medium');
  const [modalCategory, setModalCategory] = useState(categories[0] || 'Daily Reporting');
  const [modalNotes, setModalNotes] = useState('');
  const [modalReminder, setModalReminder] = useState(false);

  // Custom category modal state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCatInput, setShowCatInput] = useState(false);

  // Carry forward feedback
  const [carriedCount, setCarriedCount] = useState<number | null>(null);

  // Filter tasks by search query
  const filterList = (list: Task[]) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q)
    );
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await addTask({
      title: quickTitle.trim(),
      task_date: new Date().toISOString().split('T')[0],
      priority: quickPriority,
      category: quickCategory,
    });

    setQuickTitle('');
  };

  const handleDetailedAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    if (modalReminder) {
      await requestReminderPermission();
    }

    await addTask({
      title: modalTitle.trim(),
      description: modalDesc.trim() || undefined,
      task_date: modalDate,
      due_time: modalTime || undefined,
      priority: modalPriority,
      category: modalCategory,
      notes: modalNotes.trim() || undefined,
      has_reminder: modalReminder,
    });

    setModalOpen(false);
    setModalTitle('');
    setModalDesc('');
    setModalNotes('');
  };

  const handleCarryForward = async () => {
    const count = await carryForwardPendingTasks();
    setCarriedCount(count);
    setTimeout(() => setCarriedCount(null), 3000);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCustomCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowCatInput(false);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification for Task Completion (Part 12) */}
      {completionToast && (
        <div className="fixed top-16 right-8 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-lg animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{completionToast}</span>
        </div>
      )}

      {/* Task Dashboard KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1 flex items-center justify-between">
            <span>Total Tasks</span>
            <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {totalTasksCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1 flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {completedTasksCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1 flex items-center justify-between">
            <span>Pending</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {pendingTasksCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-slate-400 text-[11px] font-semibold mb-1 flex items-center justify-between">
            <span>Overdue</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
            {overdueTasksCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
          <div className="text-slate-400 text-[11px] font-semibold mb-1 flex items-center justify-between">
            <span>Completion</span>
            <span className="font-mono text-xs text-emerald-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily Progress Bar: e.g. 8/10 tasks completed = 80% */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Today's Execution Progress:
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {todayProgress.completed} / {todayProgress.total} tasks completed ({todayProgress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${todayProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* Carry Forward Pending Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCarryForward}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors whitespace-nowrap"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Carry Forward Pending</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {carriedCount !== null && (
        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
          Successfully carried forward {carriedCount} pending tasks to Today!
        </div>
      )}

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2"
      >
        <input
          type="text"
          placeholder="Quick add a task for today (press Enter)..."
          value={quickTitle}
          onChange={e => setQuickTitle(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <select
          value={quickPriority}
          onChange={e => setQuickPriority(e.target.value as Priority)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
        >
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        <select
          value={quickCategory}
          onChange={e => setQuickCategory(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {/* Search & Custom Categories Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks or categories..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {showCatInput ? (
            <form onSubmit={handleCreateCategory} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="New Category..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                autoFocus
                className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
              <button
                type="submit"
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowCatInput(false)}
                className="px-2 py-1 text-xs text-slate-400"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCatInput(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>+ Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Tab View Render */}
      {currentTab === 'notes' ? (
        <DailyNotesWidget />
      ) : currentTab === 'productivity' ? (
        <WeeklyProductivityChart />
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {(currentTab === 'all_tasks' || currentTab === 'overdue') && overdueTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Overdue Tasks ({filterList(overdueTasks).length})</span>
              </h3>
              <div className="space-y-2">
                {filterList(overdueTasks).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          {(currentTab === 'all_tasks' || currentTab === 'today') && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Today's Tasks ({filterList(todayTasks).length})</span>
              </h3>
              <div className="space-y-2">
                {filterList(todayTasks).length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    No tasks scheduled for today. Add one above!
                  </div>
                ) : (
                  filterList(todayTasks).map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          {(currentTab === 'all_tasks' || currentTab === 'upcoming') && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span>Upcoming Tasks ({filterList(upcomingTasks).length})</span>
              </h3>
              <div className="space-y-2">
                {filterList(upcomingTasks).length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                    No upcoming tasks scheduled.
                  </div>
                ) : (
                  filterList(upcomingTasks).map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {(currentTab === 'all_tasks' || currentTab === 'completed') && completedTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed Tasks ({filterList(completedTasks).length})</span>
              </h3>
              <div className="space-y-2">
                {filterList(completedTasks).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Create New Office Task</span>
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleDetailedAdd} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on surgery dues with South Extension clinic"
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed notes or specific invoice numbers..."
                  value={modalDesc}
                  onChange={e => setModalDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={e => setModalDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={modalTime}
                    onChange={e => setModalTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={modalPriority}
                    onChange={e => setModalPriority(e.target.value as Priority)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={modalCategory}
                    onChange={e => setModalCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional reference notes"
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reminder"
                  checked={modalReminder}
                  onChange={e => setModalReminder(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="reminder" className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Enable Browser Notification Reminder</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
