import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  parseISO, 
  isAfter, 
  isToday, 
  startOfToday 
} from 'date-fns';
import { 
  Calendar as CalendarIcon,
  User,
  Tag,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Task } from '../types';
import { useAuth } from '../AuthContext';

const PRIORITY_COLORS = {
  low: 'bg-[#F2F2F7] text-[#8E8E93] border-[#E5E5EA]',
  medium: 'bg-[#E5F1FF] text-[#007AFF] border-[#007AFF]/10',
  high: 'bg-[#007AFF] text-white border-transparent',
  critical: 'bg-[#FF3B30] text-white border-transparent',
};

const PRIORITY_DOTS = {
  low: 'bg-[#8E8E93]',
  medium: 'bg-[#007AFF]',
  high: 'bg-[#007AFF]',
  critical: 'bg-[#FF3B30]',
};

export default function QueueView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const upcomingTasks = useMemo(() => {
    const today = startOfToday();
    const allItems: any[] = [];

    tasks.forEach(task => {
      // Add the main task if it's not completed OR if it's upcoming
      const taskDate = parseISO(task.date);
      const isUpcomingOrToday = isAfter(taskDate, today) || isToday(taskDate);
      const isOverdue = !isUpcomingOrToday && task.status !== 'completed';
      
      if (isUpcomingOrToday || isOverdue) {
        allItems.push({
          ...task,
          isSubtask: false
        });
      }

      // Add subtasks if they have a due date and are not completed OR are upcoming
      task.subtasks.forEach(st => {
        if (st.due_date) {
          const subtaskDate = parseISO(st.due_date);
          const isStUpcomingOrToday = isAfter(subtaskDate, today) || isToday(subtaskDate);
          const isStOverdue = !isStUpcomingOrToday && !st.completed;

          if (isStUpcomingOrToday || isStOverdue) {
            allItems.push({
              ...task,
              id: `st-${st.id}`,
              title: st.title,
              date: st.due_date,
              status: st.completed ? 'completed' : 'pending',
              isSubtask: true,
              parentTask: task
            });
          }
        }
      });
    });

    return allItems.sort((a, b) => {
      const dateA = parseISO(a.date).getTime();
      const dateB = parseISO(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      if (a.isSubtask !== b.isSubtask) return a.isSubtask ? 1 : -1;

      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin mb-4" />
        <p className="text-[#8E8E93] font-medium animate-pulse">Loading compliance queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
        <div>
          <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight">
            Compliance Queue
          </h1>
          <p className="text-[#8E8E93] mt-1 font-medium text-[15px]">Upcoming regulatory deadlines in order</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#F2F2F7] rounded-full px-4 py-2 text-[13px] font-bold text-black border border-[#E5E5EA]">
            {upcomingTasks.length} Upcoming Tasks
          </div>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F9]/50 border-b border-[#F2F2F7]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Task</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F2F7]">
              {upcomingTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-[#C7C7CC]" />
                      </div>
                      <h3 className="text-[17px] font-semibold text-black">Queue is Empty</h3>
                      <p className="text-[14px] text-[#8E8E93] mt-1">No upcoming compliance tasks found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                upcomingTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#F9F9F9] transition-colors group">
                    <td className="px-6 py-4">
                      {task.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-[11px] uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4" />
                          Done
                        </div>
                      ) : task.status === 'in-progress' ? (
                        <div className="flex items-center gap-2 text-[#007AFF] font-bold text-[11px] uppercase tracking-wider">
                          <Clock className="w-4 h-4" />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[#8E8E93] font-bold text-[11px] uppercase tracking-wider">
                          <Circle className="w-4 h-4" />
                          Pending
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {task.isSubtask && (
                            <span className="text-[10px] font-bold bg-[#F2F2F7] text-[#8E8E93] px-1.5 py-0.5 rounded uppercase tracking-wider">Sub</span>
                          )}
                          <span className={cn(
                            "text-[15px] font-bold text-black leading-tight",
                            task.isSubtask && "text-[#8E8E93] font-medium"
                          )}>
                            {task.title}
                          </span>
                        </div>
                        {task.isSubtask ? (
                          <span className="text-[11px] text-[#C7C7CC] mt-0.5">
                            Part of: {task.parentTask.title}
                          </span>
                        ) : (
                          task.subtasks.length > 0 && (
                            <span className="text-[12px] text-[#8E8E93] mt-0.5">
                              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[13px] text-[#8E8E93] font-medium">
                        <Tag className="w-3.5 h-3.5" />
                        {task.category}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-[14px] font-bold",
                          isToday(parseISO(task.date)) ? "text-[#FF3B30]" : "text-black"
                        )}>
                          {format(parseISO(task.date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-[11px] text-[#8E8E93] font-medium">
                          {isToday(parseISO(task.date)) ? 'Due Today' : format(parseISO(task.date), 'EEEE')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block",
                        PRIORITY_COLORS[task.priority]
                      )}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#F2F2F7] rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-[#8E8E93]" />
                        </div>
                        <span className="text-[13px] text-black font-medium">{task.assignee || 'Unassigned'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
