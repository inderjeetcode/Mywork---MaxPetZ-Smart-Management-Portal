import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Clock, 
  Tag, 
  Trash2, 
  Copy, 
  ChevronDown, 
  Plus, 
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Task, Priority } from '../../types';
import { useTasks } from '../../context/TaskContext';
import { formatDate } from '../../utils/formatters';

interface TaskCardProps {
  task: Task;
}

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  high: {
    bg: 'bg-red-50 dark:bg-red-950/60',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-900',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-900',
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-900',
  },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { 
    toggleTaskCompletion, 
    deleteTask, 
    duplicateTask, 
    addSubtask, 
    toggleSubtask, 
    deleteSubtask 
  } = useTasks();

  const [expanded, setExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const isCompleted = task.status === 'completed';

  const handleSubtaskAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter(s => s.is_completed).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`p-3.5 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Satisfying Animated Checkbox */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => toggleTaskCompletion(task.id)}
          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-white dark:bg-slate-800'
          }`}
          aria-label={isCompleted ? 'Mark incomplete' : 'Mark completed'}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Task Title & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              onClick={() => toggleTaskCompletion(task.id)}
              className={`text-xs font-semibold cursor-pointer select-none transition-colors ${
                isCompleted
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {task.title}
            </h4>

            {/* Actions Menu */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => duplicateTask(task.id)}
                title="Duplicate task"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                title="Delete task"
                className="p-1 text-slate-400 hover:text-red-600 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Clean Unboxed Metadata Line (No Pill Enclosures) */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {task.category}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

            {/* Priority Indicator */}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                task.priority === 'high'
                  ? 'text-red-600 dark:text-red-400'
                  : task.priority === 'medium'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {task.priority} Priority
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formatDate(task.task_date)}</span>
            </span>

            {task.due_time && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{task.due_time}</span>
                </span>
              </>
            )}

            {subtasks.length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  onClick={() => setExpanded(prev => !prev)}
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                >
                  <span>
                    Subtasks: {completedSubtasksCount}/{subtasks.length}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
              </>
            )}

            {task.notes && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <button
                  onClick={() => setExpanded(prev => !prev)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  <span>Notes</span>
                </button>
              </>
            )}
          </div>

          {/* Subtasks and Notes Drawer */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs"
              >
                {/* Notes Block */}
                {task.notes && (
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-[11px]">
                    <strong className="text-slate-700 dark:text-slate-300">Notes:</strong> {task.notes}
                  </div>
                )}

                {/* Subtask list */}
                <div className="space-y-1">
                  {subtasks.map(sub => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={sub.is_completed}
                          onChange={() => toggleSubtask(task.id, sub.id)}
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className={`text-xs ${
                            sub.is_completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sub.title}
                        </span>
                      </label>
                      <button
                        onClick={() => deleteSubtask(task.id, sub.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask */}
                {isAddingSubtask ? (
                  <form onSubmit={handleSubtaskAdd} className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Add subtask title..."
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      autoFocus
                      className="flex-1 px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-medium"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingSubtask(false)}
                      className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded text-slate-400"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingSubtask(true)}
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline pt-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Subtask</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
