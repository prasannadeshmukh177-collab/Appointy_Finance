import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO,
  isToday,
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Circle, 
  User, 
  Trash2, 
  X,
  ListTodo,
  Clock,
  AlertTriangle,
  Tag,
  Calendar as CalendarIcon,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Task, Subtask } from '../types';
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

const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const CATEGORIES = [
  'Finance',
  'accounts',
  'Payroll',
  'Indian Books',
  'USA Books',
  'Singapore compliance',
  'USA Compliances',
  'CEAM team stuff',
  'Miscellaneous'
];

export default function CalendarView() {
  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newCategory, setNewCategory] = useState('Finance');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<Task['recurrence_frequency']>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [newSubtasks, setNewSubtasks] = useState<{title: string, due_date: string | null, completed: boolean}[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtaskDateInput, setSubtaskDateInput] = useState('');

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

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !newTitle) {
      alert('Please provide a title for the compliance task.');
      return;
    }

    setIsSaving(true);
    const taskData = {
      title: newTitle,
      description: newDesc,
      date: format(selectedDate, 'yyyy-MM-dd'),
      due_date: newDueDate || format(selectedDate, 'yyyy-MM-dd'),
      assignee: newAssignee,
      priority: newPriority,
      category: newCategory,
      status: editingTask ? editingTask.status : 'pending',
      recurrence_frequency: recurrenceFrequency,
      recurrence_end_date: recurrenceFrequency !== 'none' ? recurrenceEndDate : null,
      subtasks: newSubtasks
    };

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      if (response.ok) {
        await fetchTasks();
        resetForm();
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to save task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to save task:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setNewTitle('');
    setNewDesc('');
    setNewAssignee('');
    setNewDueDate('');
    setNewPriority('medium');
    setNewCategory('Finance');
    setRecurrenceFrequency('none');
    setRecurrenceEndDate('');
    setNewSubtasks([]);
    setSubtaskInput('');
    setSubtaskDateInput('');
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDesc(task.description || '');
    setNewAssignee(task.assignee || '');
    setNewDueDate(task.due_date || '');
    setNewPriority(task.priority);
    setNewCategory(task.category);
    setRecurrenceFrequency(task.recurrence_frequency || 'none');
    setRecurrenceEndDate(task.recurrence_end_date || '');
    
    // Ensure subtasks is always an array
    const subtasks = task.subtasks || [];
    setNewSubtasks(subtasks.map(st => ({ 
      title: st.title, 
      due_date: st.due_date, 
      completed: !!st.completed 
    })));
    
    setSelectedDate(parseISO(task.date));
    setIsModalOpen(true);
  };

  const toggleSubtask = async (subtask: Subtask) => {
    try {
      const response = await fetch(`/api/subtasks/${subtask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed })
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this compliance task?')) return;
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const addSubtaskToForm = () => {
    if (subtaskInput.trim()) {
      setNewSubtasks([...newSubtasks, { 
        title: subtaskInput.trim(), 
        due_date: subtaskDateInput || null,
        completed: false
      }]);
      setSubtaskInput('');
      setSubtaskDateInput('');
    }
  };

  const handleCompleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
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
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDate(today);
              }}
              className="px-3 py-1 hover:bg-white rounded-md transition-all text-[13px] font-semibold text-[#007AFF] active:opacity-50"
            >
              Today
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-md transition-all text-[#007AFF] active:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {isAuthenticated && (
            <button 
              onClick={() => {
                resetForm();
                setSelectedDate(selectedDate || new Date());
                setIsModalOpen(true);
              }}
              className="w-10 h-10 bg-[#F2F2F7] rounded-full flex items-center justify-center text-[#007AFF] hover:bg-[#E5E5EA] transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5E5EA] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-7 border-b border-[#F2F2F7] bg-[#F9F9F9]/50">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold text-[#8E8E93] tracking-[0.05em]">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), day));
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDay = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedDate(day);
                  }}
                  className={cn(
                    "min-h-[100px] sm:min-h-[120px] p-2 border-r border-b border-[#F2F2F7] transition-all relative group cursor-pointer",
                    isSelected ? "bg-[#F2F2F7]/30" : "hover:bg-[#F9F9F9]",
                    !isCurrentMonth && "bg-[#FDFDFD]",
                    idx % 7 === 6 && "border-r-0"
                  )}
                >
                  <div className="flex flex-col items-center mb-1.5">
                    <span className={cn(
                      "text-[15px] font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all",
                      isTodayDay ? "bg-[#FF3B30] text-white font-bold shadow-sm" : 
                      isSelected ? "bg-[#007AFF] text-white font-bold shadow-sm" :
                      !isCurrentMonth ? "text-[#C7C7CC]" : "text-black"
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
                onClick={() => {
                  resetForm();
                  setSelectedDate(selectedDate || new Date());
                  setIsModalOpen(true);
                }}
                className="w-full py-3 bg-[#007AFF] text-white rounded-xl text-[16px] font-bold shadow-lg shadow-[#007AFF]/20 active:scale-[0.98] transition-all"
              >
                Add Compliance Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-t-[20px] md:rounded-[20px] shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-[#007AFF] text-[17px]"
                  >
                    Cancel
                  </button>
                  <h2 className="text-[17px] font-bold text-black">
                    {editingTask ? 'Edit Event' : 'New Event'}
                  </h2>
                  <button 
                    onClick={handleAddTask}
                    className="text-[#007AFF] text-[17px] font-bold disabled:opacity-30"
                    disabled={isSaving || !newTitle}
                  >
                    {editingTask ? 'Done' : 'Add'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#F2F2F7] rounded-xl overflow-hidden">
                    <input 
                      autoFocus
                      required
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full px-4 py-3 bg-transparent outline-none text-[17px] text-black placeholder:text-[#C7C7CC] border-b border-[#E5E5EA]"
                    />
                    <textarea 
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Notes"
                      rows={3}
                      className="w-full px-4 py-3 bg-transparent outline-none resize-none text-[15px] text-black placeholder:text-[#C7C7CC]"
                    />
                  </div>

                  <div className="bg-[#F2F2F7] rounded-xl overflow-hidden divide-y divide-[#E5E5EA]">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[17px] text-black">Due Date</span>
                      <input 
                        type="date"
                        value={newDueDate}
                        onChange={e => setNewDueDate(e.target.value)}
                        className="bg-transparent text-[#8E8E93] text-[17px] outline-none text-right cursor-pointer"
                      />
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[17px] text-black">Category</span>
                      <select 
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className="bg-transparent text-[#8E8E93] text-[17px] outline-none appearance-none text-right"
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[17px] text-black">Priority</span>
                      <select 
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value as any)}
                        className="bg-transparent text-[#8E8E93] text-[17px] outline-none appearance-none text-right"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[17px] text-black">Assignee</span>
                      <input 
                        type="text"
                        value={newAssignee}
                        onChange={e => setNewAssignee(e.target.value)}
                        placeholder="Name"
                        className="bg-transparent text-[#8E8E93] text-[17px] outline-none text-right placeholder:text-[#C7C7CC]"
                      />
                    </div>
                  </div>

                  <div className="bg-[#F2F2F7] rounded-xl p-4 space-y-3">
                    <h3 className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider">Subtasks</h3>
                    <div className="space-y-2">
                      {newSubtasks.map((st, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/50 p-2 rounded-lg">
                          <span className="text-[14px] text-black">{st.title}</span>
                          <button 
                            type="button"
                            onClick={() => setNewSubtasks(newSubtasks.filter((_, idx) => idx !== i))}
                            className="text-[#FF3B30]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={subtaskInput}
                        onChange={e => setSubtaskInput(e.target.value)}
                        placeholder="New subtask"
                        className="flex-1 bg-white px-3 py-2 rounded-lg text-[14px] outline-none"
                      />
                      <input 
                        type="date"
                        value={subtaskDateInput}
                        onChange={e => setSubtaskDateInput(e.target.value)}
                        className="bg-white px-2 py-2 rounded-lg text-[12px] outline-none w-28"
                      />
                      <button 
                        type="button"
                        onClick={addSubtaskToForm}
                        className="bg-[#007AFF] text-white p-2 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#F2F2F7] rounded-xl overflow-hidden divide-y divide-[#E5E5EA]">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[17px] text-black">Recurrence</span>
                      <select 
                        value={recurrenceFrequency}
                        onChange={e => setRecurrenceFrequency(e.target.value as any)}
                        className="bg-transparent text-[#8E8E93] text-[17px] outline-none appearance-none text-right"
                      >
                        <option value="none">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  {editingTask && (
                    <button 
                      type="button"
                      onClick={() => deleteTask(editingTask.id)}
                      className="w-full bg-[#F2F2F7] text-[#FF3B30] py-3 rounded-xl text-[17px] font-medium"
                    >
                      Delete Event
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
