import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Task, Subtask, DailyNote, Priority, TaskHistory } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { isToday, isPast, isFuture, parseISO, startOfDay, addDays } from 'date-fns';

const LOCAL_TASKS_KEY = 'maxpetz_local_tasks';
const LOCAL_NOTES_KEY = 'maxpetz_local_daily_notes';
const LOCAL_CATEGORIES_KEY = 'maxpetz_local_categories';

export const DEFAULT_TASK_CATEGORIES = [
  'Daily Reporting',
  'Clinic Follow-up',
  'Due Follow-up',
  'Data Management',
  'Excel Reporting',
  'Meetings',
  'Administrative Work',
  'Other',
];

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  categories: string[];
  dailyNotes: Record<string, string>; // date (YYYY-MM-DD) -> note content
  completionToast: string | null;

  // Task Statistics
  totalTasksCount: number;
  completedTasksCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  completionPercentage: number;
  todayProgress: { total: number; completed: number; percentage: number };

  // Task Sections
  todayTasks: Task[];
  upcomingTasks: Task[];
  overdueTasks: Task[];
  completedTasks: Task[];

  // CRUD Operations
  addTask: (taskData: Omit<Task, 'id' | 'user_id' | 'status' | 'completed_at' | 'created_at' | 'updated_at'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  carryForwardPendingTasks: () => Promise<number>;

  // Subtask Operations
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Daily Notes & Categories
  saveDailyNote: (dateStr: string, content: string) => Promise<void>;
  addCustomCategory: (categoryName: string) => void;
  requestReminderPermission: () => Promise<boolean>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_TASK_CATEGORIES);
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [completionToast, setCompletionToast] = useState<string | null>(null);

  const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';

  // Load tasks & notes
  const fetchTasksAndNotes = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch from Supabase
      const { data: dbTasks, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks:task_subtasks(*)
        `)
        .order('task_date', { ascending: true });

      const { data: dbNotes } = await supabase
        .from('daily_notes')
        .select('*');

      if (!taskError && dbTasks && dbTasks.length > 0) {
        setTasks(dbTasks);
        localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(dbTasks));

        if (dbNotes) {
          const notesMap: Record<string, string> = {};
          dbNotes.forEach((n: { note_date: string; content: string }) => {
            notesMap[n.note_date] = n.content;
          });
          setDailyNotes(notesMap);
          localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notesMap));
        }
      } else {
        // Fallback to local storage
        const saved = localStorage.getItem(LOCAL_TASKS_KEY);
        if (saved) {
          try {
            setTasks(JSON.parse(saved));
          } catch {
            setTasks([]);
          }
        } else {
          // Initialize with friendly starter tasks if empty
          const todayStr = new Date().toISOString().split('T')[0];
          const initialTasks: Task[] = [
            {
              id: crypto.randomUUID(),
              user_id: currentUserId,
              title: 'Review October Dues outstanding with Clinic Heads',
              description: 'Examine high-risk invoices > ₹50,000 for South Extension and Gurgaon branches.',
              task_date: todayStr,
              due_time: '11:00',
              priority: 'high',
              category: 'Clinic Follow-up',
              status: 'pending',
              subtasks: [
                { id: crypto.randomUUID(), task_id: '1', title: 'Export South Extension dues report', is_completed: true, position: 1 },
                { id: crypto.randomUUID(), task_id: '1', title: 'Schedule call with Dr. Rohan', is_completed: false, position: 2 },
              ],
              created_at: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              user_id: currentUserId,
              title: 'Verify pending credit card settlements with accounts',
              description: 'Follow up on surgery & in-patient receivables.',
              task_date: todayStr,
              due_time: '15:30',
              priority: 'medium',
              category: 'Daily Reporting',
              status: 'pending',
              subtasks: [],
              created_at: new Date().toISOString(),
            },
          ];
          setTasks(initialTasks);
          localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(initialTasks));
        }

        const savedNotes = localStorage.getItem(LOCAL_NOTES_KEY);
        if (savedNotes) {
          try {
            setDailyNotes(JSON.parse(savedNotes));
          } catch {
            // Ignore
          }
        }
      }

      // Load custom categories
      const savedCats = localStorage.getItem(LOCAL_CATEGORIES_KEY);
      if (savedCats) {
        try {
          setCategories(JSON.parse(savedCats));
        } catch {
          // Ignore
        }
      }
    } catch {
      const saved = localStorage.getItem(LOCAL_TASKS_KEY);
      if (saved) {
        try {
          setTasks(JSON.parse(saved));
        } catch {
          setTasks([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchTasksAndNotes();
  }, [fetchTasksAndNotes]);

  // Persist local tasks
  const saveTasksToStorage = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(updatedTasks));
  };

  // Trigger professional confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#059669', '#10B981', '#34D399', '#3B82F6'],
      ticks: 200,
      disableForReducedMotion: true,
    });
  };

  // Add Task
  const addTask = async (
    taskData: Omit<Task, 'id' | 'user_id' | 'status' | 'completed_at' | 'created_at' | 'updated_at'>
  ): Promise<Task> => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      user_id: currentUserId,
      status: 'pending',
      completed_at: null,
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Supabase
    try {
      await supabase.from('tasks').insert([
        {
          id: newTask.id,
          user_id: newTask.user_id,
          title: newTask.title,
          description: newTask.description,
          task_date: newTask.task_date,
          due_time: newTask.due_time,
          priority: newTask.priority,
          category: newTask.category,
          status: 'pending',
          notes: newTask.notes,
          has_reminder: newTask.has_reminder,
        },
      ]);

      await supabase.from('task_history').insert([
        {
          task_id: newTask.id,
          user_id: newTask.user_id,
          action: 'created',
          notes: `Created task "${newTask.title}"`,
        },
      ]);
    } catch (err) {
      console.warn('Supabase task insert fallback to local storage:', err);
    }

    const updated = [newTask, ...tasks];
    saveTasksToStorage(updated);
    return newTask;
  };

  // Update Task
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const updatedTask = { ...target, ...updates, updated_at: new Date().toISOString() };

    try {
      await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          description: updatedTask.description,
          task_date: updatedTask.task_date,
          due_time: updatedTask.due_time,
          priority: updatedTask.priority,
          category: updatedTask.category,
          status: updatedTask.status,
          notes: updatedTask.notes,
          has_reminder: updatedTask.has_reminder,
          updated_at: updatedTask.updated_at,
        })
        .eq('id', id);

      await supabase.from('task_history').insert([
        {
          task_id: id,
          user_id: currentUserId,
          action: 'updated',
          notes: 'Task details updated',
        },
      ]);
    } catch (err) {
      console.warn('Supabase task update fallback:', err);
    }

    const updatedList = tasks.map(t => (t.id === id ? updatedTask : t));
    saveTasksToStorage(updatedList);
  };

  // Delete Task
  const deleteTask = async (id: string) => {
    try {
      await supabase.from('task_subtasks').delete().eq('task_id', id);
      await supabase.from('task_history').delete().eq('task_id', id);
      await supabase.from('tasks').delete().eq('id', id);
    } catch {
      // Ignore
    }

    const updatedList = tasks.filter(t => t.id !== id);
    saveTasksToStorage(updatedList);
  };

  // Duplicate Task
  const duplicateTask = async (id: string) => {
    const existing = tasks.find(t => t.id === id);
    if (!existing) return;

    await addTask({
      title: `${existing.title} (Copy)`,
      description: existing.description,
      task_date: existing.task_date,
      due_time: existing.due_time,
      priority: existing.priority,
      category: existing.category,
      notes: existing.notes,
      has_reminder: existing.has_reminder,
    });
  };

  // Toggle Task Completion with Satisfying Animation & Toast
  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const willBeCompleted = task.status !== 'completed';
    const newStatus = willBeCompleted ? 'completed' : 'pending';
    const completedAt = willBeCompleted ? new Date().toISOString() : null;

    if (willBeCompleted) {
      triggerConfetti();
      setCompletionToast('Task Completed Successfully!');
      setTimeout(() => setCompletionToast(null), 3200);
    }

    // Immediate state update
    const updatedList = tasks.map(t =>
      t.id === id
        ? {
            ...t,
            status: newStatus as Task['status'],
            completed_at: completedAt,
            updated_at: new Date().toISOString(),
          }
        : t
    );
    saveTasksToStorage(updatedList);

    // Save to Supabase
    try {
      await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      const historyAction: TaskHistory['action'] = willBeCompleted ? 'completed' : 'reopened';
      await supabase.from('task_history').insert([
        {
          task_id: id,
          user_id: currentUserId,
          action: historyAction,
          notes: willBeCompleted ? 'Marked task as completed' : 'Reopened task',
        },
      ]);
    } catch (err) {
      console.warn('Supabase toggle completion fallback:', err);
    }
  };

  // Carry Forward Overdue and Pending Tasks to Today
  const carryForwardPendingTasks = async (): Promise<number> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = startOfDay(new Date());

    const tasksToMove = tasks.filter(t => {
      if (t.status === 'completed') return false;
      try {
        const tDate = startOfDay(parseISO(t.task_date));
        return tDate < todayDate;
      } catch {
        return false;
      }
    });

    if (tasksToMove.length === 0) return 0;

    const updatedList = tasks.map(t => {
      if (tasksToMove.some(m => m.id === t.id)) {
        return {
          ...t,
          task_date: todayStr,
          status: 'pending' as const,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    saveTasksToStorage(updatedList);

    // Update in Supabase
    try {
      const ids = tasksToMove.map(t => t.id);
      await supabase
        .from('tasks')
        .update({
          task_date: todayStr,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .in('id', ids);

      for (const t of tasksToMove) {
        await supabase.from('task_history').insert([
          {
            task_id: t.id,
            user_id: currentUserId,
            action: 'carried_forward',
            notes: `Carried forward from ${t.task_date} to ${todayStr}`,
          },
        ]);
      }
    } catch (err) {
      console.warn('Supabase carry forward fallback:', err);
    }

    return tasksToMove.length;
  };

  // Subtasks
  const addSubtask = async (taskId: string, title: string) => {
    const subtaskId = crypto.randomUUID();
    const newSubtask: Subtask = {
      id: subtaskId,
      task_id: taskId,
      title,
      is_completed: false,
      position: 0,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('task_subtasks').insert([newSubtask]);
    } catch {
      // Ignore
    }

    const updatedList = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: [...(t.subtasks || []), newSubtask],
        };
      }
      return t;
    });
    saveTasksToStorage(updatedList);
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const targetSub = (task.subtasks || []).find(s => s.id === subtaskId);
    if (!targetSub) return;

    const nextCompleted = !targetSub.is_completed;

    try {
      await supabase
        .from('task_subtasks')
        .update({ is_completed: nextCompleted })
        .eq('id', subtaskId);
    } catch {
      // Ignore
    }

    const updatedList = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: (t.subtasks || []).map(s =>
            s.id === subtaskId ? { ...s, is_completed: nextCompleted } : s
          ),
        };
      }
      return t;
    });
    saveTasksToStorage(updatedList);
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await supabase.from('task_subtasks').delete().eq('id', subtaskId);
    } catch {
      // Ignore
    }

    const updatedList = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: (t.subtasks || []).filter(s => s.id !== subtaskId),
        };
      }
      return t;
    });
    saveTasksToStorage(updatedList);
  };

  // Daily Notes
  const saveDailyNote = async (dateStr: string, content: string) => {
    const updatedNotes = { ...dailyNotes, [dateStr]: content };
    setDailyNotes(updatedNotes);
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(updatedNotes));

    try {
      await supabase.from('daily_notes').upsert(
        {
          user_id: currentUserId,
          note_date: dateStr,
          content,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,note_date' }
      );
    } catch (err) {
      console.warn('Supabase daily note save fallback:', err);
    }
  };

  // Categories
  const addCustomCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const next = [...categories, trimmed];
    setCategories(next);
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(next));

    try {
      supabase.from('task_categories').insert([
        {
          user_id: currentUserId,
          name: trimmed,
          color: '#3B82F6',
          icon: 'Folder',
          is_default: false,
        },
      ]);
    } catch {
      // Ignore
    }
  };

  // Browser reminders
  const requestReminderPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const res = await Notification.requestPermission();
    return res === 'granted';
  };

  // Categorize Tasks into Sections
  const { todayTasks, upcomingTasks, overdueTasks, completedTasks } = useMemo(() => {
    const today = startOfDay(new Date());

    const tTasks: Task[] = [];
    const uTasks: Task[] = [];
    const oTasks: Task[] = [];
    const cTasks: Task[] = [];

    tasks.forEach(task => {
      if (task.status === 'completed') {
        cTasks.push(task);
        return;
      }

      try {
        const taskDate = startOfDay(parseISO(task.task_date));
        if (taskDate.getTime() === today.getTime()) {
          tTasks.push(task);
        } else if (taskDate < today) {
          oTasks.push(task);
        } else {
          uTasks.push(task);
        }
      } catch {
        tTasks.push(task);
      }
    });

    return {
      todayTasks: tTasks,
      upcomingTasks: uTasks,
      overdueTasks: oTasks,
      completedTasks: cTasks,
    };
  }, [tasks]);

  // Overall Task Statistics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const overdueTasksCount = overdueTasks.length;
  const completionPercentage =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Today's Progress Bar (e.g. 8/10 = 80%)
  const todayProgress = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTotal = tasks.filter(t => t.task_date === todayStr);
    const completed = todayTotal.filter(t => t.status === 'completed').length;
    const total = todayTotal.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [tasks]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        categories,
        dailyNotes,
        completionToast,
        totalTasksCount,
        completedTasksCount,
        pendingTasksCount,
        overdueTasksCount,
        completionPercentage,
        todayProgress,
        todayTasks,
        upcomingTasks,
        overdueTasks,
        completedTasks,
        addTask,
        updateTask,
        deleteTask,
        duplicateTask,
        toggleTaskCompletion,
        carryForwardPendingTasks,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        saveDailyNote,
        addCustomCategory,
        requestReminderPermission,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export function useTasks(): TaskContextType {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
