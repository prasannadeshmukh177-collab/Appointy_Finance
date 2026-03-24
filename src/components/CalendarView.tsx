import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameDay, 
  isSameMonth,
  addDays, 
  parseISO,
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Task } from '../types';
import { useAuth } from '../AuthContext';
import TaskModal from './TaskModal';

const PRIORITY_DOTS = {
  low: 'bg-[#8E8E93]',
  medium: 'bg-[#007AFF]',
  high: 'bg-[#007AFF]',
  critical: 'bg-[#FF3B30]',
};

export default function CalendarView() {
  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      const month = format(currentDate, 'MM');
      const year = format(currentDate, 'yyyy');
      const response = await fetch(`/api/tasks?month=${month}&year=${year}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        console.error('API response is not an array:', data);
        setTasks([]);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    const handleRefresh = () => fetchTasks();
    window.addEventListener('task-created', handleRefresh);
    window.addEventListener('task-updated', handleRefresh);
    window.addEventListener('task-deleted', handleRefresh);
    return () => {
      window.removeEventListener('task-created', handleRefresh);
      window.removeEventListener('task-updated', handleRefresh);
      window.removeEventListener('task-deleted', handleRefresh);
    };
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = useMemo(() => {
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [startDate, endDate]);

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (selectedDate) {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    if (selectedDate) {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  const openAddModal = (date: Date) => {
    if (!isAuthenticated) return;
    setSelectedDate(date);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    if (!isAuthenticated) return;
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const filteredItems = useMemo(() => {
    if (!selectedDate) return [];
    const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), selectedDate));
    const daySubtasks = tasks.flatMap(t => 
      t.subtasks
        .filter(st => st.due_date && isSameDay(parseISO(st.due_date), selectedDate))
        .map(st => ({ 
          ...t,
          id: `st-${st.id}`,
          title: st.title,
          isSubtask: true,
          parentTask: t,
          completed: st.completed
        }))
    );
    return [...dayTasks, ...daySubtasks];
  }, [tasks, selectedDate]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-1">
          <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight">
            {format(currentDate, 'MMMM')}
          </h1>
          <span className="text-[34px] font-normal text-[#8E8E93] ml-2 leading-tight">
            {format(currentDate, 'yyyy')}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#F2F2F7] p-1 rounded-lg">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-md transition-all text-[#007AFF] active:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-md transition-all text-[#007AFF] active:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-7 border-b border-[#F2F2F7] bg-[#F9F9F9]/50">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="py-3 text-center text-[11px] font-bold text-[#8E8E93] tracking-widest">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), day));
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  onDoubleClick={() => openAddModal(day)}
                  className={cn(
                    "min-h-[100px] p-2 border-b border-r border-[#F2F2F7] transition-all cursor-pointer relative group",
                    !isCurrentMonth && "bg-[#F9F9F9]/30",
                    isSelected && "bg-[#007AFF]/5 ring-1 ring-inset ring-[#007AFF]/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "text-[14px] font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all",
                      isSameDay(day, new Date()) ? "bg-[#007AFF] text-white" : 
                      isSelected ? "text-[#007AFF]" :
                      isCurrentMonth ? "text-black" : "text-[#C7C7CC]"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-1">
                    {dayTasks.map(task => (
                      <div 
                        key={task.id}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          task.priority === 'critical' ? "bg-[#FF3B30]" :
                          task.priority === 'high' ? "bg-[#007AFF]" :
                          "bg-[#8E8E93]"
                        )}
                      />
                    ))}
                    {tasks.flatMap(t => t.subtasks)
                      .filter(st => st.due_date && isSameDay(parseISO(st.due_date), day))
                      .map((st, sidx) => (
                        <div 
                          key={`st-${sidx}`}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full border border-[#8E8E93] bg-white",
                            st.completed && "bg-[#8E8E93] border-transparent opacity-40"
                          )}
                          title={`Subtask: ${st.title}`}
                        />
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task List Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col h-full min-h-[500px]">
          <div className="px-6 py-5 border-b border-[#E5E5EA] bg-[#F9F9F9]/80 backdrop-blur-md sticky top-0 z-10">
            <h2 className="text-[20px] font-bold text-black tracking-tight">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Upcoming'}
            </h2>
            <p className="text-[13px] text-[#8E8E93] font-medium mt-0.5">
              {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'} scheduled
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-[#F2F2F7] custom-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-[#C7C7CC]" />
                </div>
                <h3 className="text-[17px] font-semibold text-black">No Events</h3>
                <p className="text-[14px] text-[#8E8E93] mt-1">
                  Enjoy your free day! No compliance tasks scheduled for this date.
                </p>
              </div>
            ) : (
              filteredItems
                .sort((a, b) => {
                  if (a.isSubtask && !b.isSubtask) return 1;
                  if (!a.isSubtask && b.isSubtask) return -1;
                  return a.priority === 'critical' ? -1 : 1;
                })
                .map(item => (
                  <div 
                    key={item.id}
                    onClick={() => isAuthenticated && openEditModal(item.isSubtask ? item.parentTask : item)}
                    className={cn(
                      "px-6 py-4 flex items-start gap-4 hover:bg-[#F9F9F9] transition-colors group",
                      isAuthenticated && "cursor-pointer"
                    )}
                  >
                    <div className={cn(
                      "w-1 h-12 rounded-full shrink-0 mt-1",
                      item.isSubtask ? "bg-[#8E8E93] opacity-30" : PRIORITY_DOTS[item.priority]
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.isSubtask && (
                          <span className="text-[9px] font-bold bg-[#F2F2F7] text-[#8E8E93] px-1 py-0.5 rounded uppercase tracking-wider shrink-0">Sub</span>
                        )}
                        <h3 className={cn(
                          "text-[16px] font-bold text-black truncate leading-tight",
                          item.isSubtask && "text-[#8E8E93] font-medium"
                        )}>
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[13px] text-[#8E8E93] font-medium">{item.category}</span>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#C7C7CC]">
                          <User className="w-3 h-3" />
                          <span>{item.assignee || 'Unassigned'}</span>
                          {(item.status === 'completed' || (item.isSubtask && item.completed)) && (
                            <>
                              <span className="mx-1">•</span>
                              <span className="text-emerald-500 font-bold uppercase tracking-wider text-[10px]">Done</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#C7C7CC] self-center group-hover:translate-x-0.5 transition-transform" />
                  </div>
                ))
            )}
          </div>
          
          {isAuthenticated && (
            <div className="p-4 border-t border-[#E5E5EA] bg-[#F9F9F9]/50">
              <button 
                onClick={() => openAddModal(selectedDate || new Date())}
                className="w-full py-3 bg-[#007AFF] text-white rounded-xl text-[16px] font-bold shadow-lg shadow-[#007AFF]/20 active:scale-[0.98] transition-all"
              >
                Add Compliance Task
              </button>
            </div>
          )}
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        selectedDate={selectedDate}
        onSave={fetchTasks}
        onDelete={deleteTask}
      />
    </div>
  );
}
