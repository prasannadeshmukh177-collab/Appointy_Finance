import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Calendar as CalendarIcon, 
  User, 
  Tag, 
  AlertTriangle, 
  Repeat,
  CheckCircle2,
  Circle,
  Clock,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '../lib/utils';
import { Task, Subtask } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  selectedDate?: Date | null;
  onSave: () => void;
  onDelete?: (id: number) => void;
}

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

const PRIORITY_COLORS = {
  low: 'bg-[#F2F2F7] text-[#8E8E93] border-[#E5E5EA]',
  medium: 'bg-[#E5F1FF] text-[#007AFF] border-[#007AFF]/10',
  high: 'bg-[#007AFF] text-white border-transparent',
  critical: 'bg-[#FF3B30] text-white border-transparent',
};

export default function TaskModal({ isOpen, onClose, task, selectedDate, onSave, onDelete }: TaskModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!task);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState('Finance');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<Task['recurrence_frequency']>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [reminderValue, setReminderValue] = useState<number>(1);
  const [reminderUnit, setReminderUnit] = useState<'minutes' | 'hours' | 'days'>('days');
  const [reminderMessage, setReminderMessage] = useState('');
  const [enableReminder, setEnableReminder] = useState(false);
  const [subtasks, setSubtasks] = useState<{title: string, due_date: string | null, completed: boolean}[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtaskDateInput, setSubtaskDateInput] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssignee(task.assignee || '');
      setDueDate(task.due_date || '');
      setPriority(task.priority);
      setCategory(task.category);
      setRecurrenceFrequency(task.recurrence_frequency || 'none');
      setRecurrenceEndDate(task.recurrence_end_date || '');
      setReminderValue(task.reminder_advance_value || 1);
      setReminderUnit(task.reminder_advance_unit || 'days');
      setReminderMessage(task.reminder_message || '');
      setEnableReminder(!!task.reminder_advance_value);
      setSubtasks((task.subtasks || []).map(st => ({ 
        title: st.title, 
        due_date: st.due_date, 
        completed: !!st.completed 
      })));
      setIsEditing(false);
    } else {
      setTitle('');
      setDescription('');
      setAssignee('');
      setDueDate(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
      setPriority('medium');
      setCategory('Finance');
      setRecurrenceFrequency('none');
      setRecurrenceEndDate('');
      setReminderValue(1);
      setReminderUnit('days');
      setReminderMessage('');
      setEnableReminder(false);
      setSubtasks([]);
      setIsEditing(true);
    }
    setShowDeleteConfirm(false);
    setError(null);
  }, [task, selectedDate, isOpen]);

  const handleSave = async () => {
    if (!title) {
      setError('Please provide a title.');
      return;
    }

    setIsSaving(true);
    setError(null);
    const dateToUse = task ? task.date : (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    const finalDate = dueDate || dateToUse;
    
    const taskData = {
      title,
      description,
      date: finalDate,
      due_date: finalDate,
      assignee,
      priority,
      category,
      status: task ? task.status : 'pending',
      recurrence_frequency: recurrenceFrequency,
      recurrence_end_date: (recurrenceFrequency !== 'none' && recurrenceEndDate) ? recurrenceEndDate : null,
      reminder_advance_value: enableReminder ? reminderValue : null,
      reminder_advance_unit: enableReminder ? reminderUnit : null,
      reminder_message: enableReminder ? reminderMessage : null,
      subtasks
    };

    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save task');
      }
    } catch (err: any) {
      console.error('Failed to save task:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const addSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, { 
        title: subtaskInput.trim(), 
        due_date: subtaskDateInput || null,
        completed: false
      }]);
      setSubtaskInput('');
      setSubtaskDateInput('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleSubtask = (index: number) => {
    setSubtasks(subtasks.map((st, i) => i === index ? { ...st, completed: !st.completed } : st));
  };

  const handleDelete = async (all: boolean = false) => {
    if (!task) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}?all=${all}`, { method: 'DELETE' });
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete task');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#F2F2F7] flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[#F2F2F7] rounded-full transition-colors text-[#8E8E93]"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-[17px] font-bold text-black">
                  {task ? (isEditing ? 'Edit Task' : 'Task Details') : 'New Task'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {task && !isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-1.5 text-[#007AFF] font-bold text-[14px] hover:bg-[#007AFF]/5 rounded-full transition-all"
                  >
                    Edit
                  </button>
                )}
                {isEditing ? (
                  <button 
                    onClick={handleSave}
                    disabled={isSaving || !title}
                    className="px-6 py-1.5 bg-[#007AFF] text-white font-bold text-[14px] rounded-full shadow-lg shadow-[#007AFF]/20 disabled:opacity-30 transition-all hover:bg-[#0062CC]"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                ) : (
                  <button 
                    onClick={onClose}
                    className="px-6 py-1.5 bg-[#F2F2F7] text-black font-bold text-[14px] rounded-full transition-all hover:bg-[#E5E5EA]"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                  {/* Title & Description */}
                  <div className="space-y-4">
                    {isEditing ? (
                      <input 
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Task Title"
                        className="w-full text-[24px] font-bold text-black outline-none placeholder:text-[#C7C7CC] border-b-2 border-transparent focus:border-[#007AFF]/20 pb-2 transition-all"
                      />
                    ) : (
                      <h1 className="text-[28px] font-bold text-black leading-tight">{title}</h1>
                    )}

                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" />
                        Description
                      </label>
                      {isEditing ? (
                        <textarea 
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Add a detailed description..."
                          rows={4}
                          className="w-full p-4 bg-[#F2F2F7] rounded-2xl outline-none text-[15px] text-black placeholder:text-[#8E8E93] resize-none focus:ring-2 ring-[#007AFF]/10 transition-all"
                        />
                      ) : (
                        <p className="text-[15px] text-[#48484A] leading-relaxed bg-[#F9F9F9] p-4 rounded-2xl border border-[#F2F2F7]">
                          {description || 'No description provided.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subtasks */}
                  <div className="space-y-4">
                    <label className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Subtasks ({subtasks.length})
                    </label>
                    
                    <div className="space-y-2">
                      {subtasks.map((st, i) => (
                        <div key={i} className="flex items-center gap-3 group bg-white border border-[#F2F2F7] p-3 rounded-xl hover:border-[#007AFF]/20 transition-all">
                          <button 
                            onClick={() => isEditing && toggleSubtask(i)}
                            className={cn(
                              "shrink-0 transition-colors",
                              st.completed ? "text-emerald-500" : "text-[#C7C7CC]"
                            )}
                          >
                            {st.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-[14px] font-medium truncate",
                              st.completed ? "text-[#8E8E93] line-through" : "text-black"
                            )}>
                              {st.title}
                            </p>
                            {st.due_date && (
                              <span className="text-[11px] text-[#8E8E93] flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(st.due_date), 'MMM d')}
                              </span>
                            )}
                          </div>
                          {isEditing && (
                            <button 
                              onClick={() => removeSubtask(i)}
                              className="p-1.5 text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      {isEditing && (
                        <div className="flex flex-col gap-2 p-4 bg-[#F2F2F7] rounded-2xl mt-4">
                          <input 
                            type="text"
                            value={subtaskInput}
                            onChange={e => setSubtaskInput(e.target.value)}
                            placeholder="Add a subtask..."
                            className="bg-transparent outline-none text-[14px] text-black placeholder:text-[#8E8E93]"
                            onKeyDown={e => e.key === 'Enter' && addSubtask()}
                          />
                          <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA]">
                            <input 
                              type="date"
                              value={subtaskDateInput}
                              onChange={e => setSubtaskDateInput(e.target.value)}
                              className="bg-transparent text-[12px] text-[#8E8E93] outline-none"
                            />
                            <button 
                              onClick={addSubtask}
                              className="p-1.5 bg-[#007AFF] text-white rounded-lg hover:bg-[#0062CC] transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Metadata */}
                <div className="space-y-6">
                  <div className="bg-[#F9F9F9] rounded-2xl p-5 border border-[#F2F2F7] space-y-5">
                    {/* Assignee */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Assignee
                      </label>
                      {isEditing ? (
                        <input 
                          type="text"
                          value={assignee}
                          onChange={e => setAssignee(e.target.value)}
                          placeholder="Assign to..."
                          className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[14px] outline-none focus:border-[#007AFF]/30 transition-all"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#007AFF]/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-[#007AFF]" />
                          </div>
                          <span className="text-[14px] font-bold text-black">{assignee || 'Unassigned'}</span>
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Due Date
                      </label>
                      {isEditing ? (
                        <input 
                          type="date"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[14px] outline-none focus:border-[#007AFF]/30 transition-all"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-[14px] font-bold text-black">
                          <CalendarIcon className="w-4 h-4 text-[#8E8E93]" />
                          {dueDate ? format(parseISO(dueDate), 'MMMM d, yyyy') : 'No date set'}
                        </div>
                      )}
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Priority
                      </label>
                      {isEditing ? (
                        <select 
                          value={priority}
                          onChange={e => setPriority(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[14px] outline-none focus:border-[#007AFF]/30 transition-all appearance-none"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      ) : (
                        <span className={cn(
                          "inline-block px-3 py-1 rounded-full text-[12px] font-bold border",
                          PRIORITY_COLORS[priority]
                        )}>
                          {priority.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" />
                        Category
                      </label>
                      {isEditing ? (
                        <select 
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[14px] outline-none focus:border-[#007AFF]/30 transition-all appearance-none"
                        >
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      ) : (
                        <span className="text-[14px] font-bold text-black">{category}</span>
                      )}
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-2">
                        <Repeat className="w-3.5 h-3.5" />
                        Recurrence
                      </label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <select 
                            value={recurrenceFrequency}
                            onChange={e => setRecurrenceFrequency(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[14px] outline-none focus:border-[#007AFF]/30 transition-all appearance-none"
                          >
                            <option value="none">None</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                          {recurrenceFrequency !== 'none' && (
                            <input 
                              type="date"
                              value={recurrenceEndDate}
                              onChange={e => setRecurrenceEndDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[14px] outline-none focus:border-[#007AFF]/30 transition-all"
                              placeholder="End Date"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-[14px] font-bold text-black capitalize">
                            {recurrenceFrequency === 'none' ? 'No recurrence' : recurrenceFrequency}
                          </span>
                          {recurrenceFrequency !== 'none' && recurrenceEndDate && (
                            <span className="text-[11px] text-[#8E8E93]">Until {format(parseISO(recurrenceEndDate), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Email Reminders */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5" />
                          Email Reminder
                        </label>
                        {isEditing && (
                          <button 
                            onClick={() => setEnableReminder(!enableReminder)}
                            className={cn(
                              "w-10 h-5 rounded-full transition-all relative",
                              enableReminder ? "bg-[#007AFF]" : "bg-[#E5E5EA]"
                            )}
                          >
                            <div className={cn(
                              "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                              enableReminder ? "left-[22px]" : "left-0.5"
                            )} />
                          </button>
                        )}
                      </div>

                      {enableReminder ? (
                        <div className="space-y-4 bg-[#F2F2F7]/50 p-4 rounded-2xl border border-[#E5E5EA]">
                          {isEditing ? (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-tight">Value</label>
                                  <input 
                                    type="number"
                                    value={reminderValue}
                                    onChange={e => setReminderValue(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[14px] outline-none focus:border-[#007AFF]/30 transition-all"
                                    min="1"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-tight">Unit</label>
                                  <select 
                                    value={reminderUnit}
                                    onChange={e => setReminderUnit(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[14px] outline-none focus:border-[#007AFF]/30 transition-all appearance-none"
                                  >
                                    <option value="minutes">Minutes</option>
                                    <option value="hours">Hours</option>
                                    <option value="days">Days</option>
                                  </select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-tight">Custom Message</label>
                                <textarea 
                                  value={reminderMessage}
                                  onChange={e => setReminderMessage(e.target.value)}
                                  placeholder="Enter custom reminder message..."
                                  className="w-full px-3 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[13px] outline-none focus:border-[#007AFF]/30 transition-all min-h-[70px] resize-none"
                                />
                              </div>
                              <div className="pt-1 border-t border-[#E5E5EA] mt-1">
                                <p className="text-[10px] text-[#8E8E93] leading-tight">
                                  Reminders will be sent to <span className="text-black font-bold">prasanna@appointy.com</span>
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-[14px] font-bold text-black">
                                {reminderValue} {reminderUnit} before deadline
                              </p>
                              {reminderMessage && (
                                <p className="text-[13px] text-[#8E8E93] italic">"{reminderMessage}"</p>
                              )}
                              <p className="text-[10px] text-[#8E8E93] pt-2 border-t border-[#E5E5EA]">
                                Sent to: prasanna@appointy.com
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        !isEditing && <span className="text-[14px] font-medium text-[#8E8E93]">No reminder set</span>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] text-[#FF3B30] font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {task && onDelete && (
                    <div className="space-y-2 pt-4 border-t border-[#F2F2F7]">
                      {!showDeleteConfirm ? (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full py-3 bg-red-50 text-[#FF3B30] rounded-2xl text-[14px] font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Task
                        </button>
                      ) : (
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-3">
                          <p className="text-[13px] text-[#FF3B30] font-medium text-center">Are you sure you want to delete this task?</p>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => handleDelete(false)}
                              className="w-full py-2 bg-white text-black border border-[#E5E5EA] rounded-xl text-[13px] font-bold"
                            >
                              Delete This Instance
                            </button>
                            {task.recurrence_id && (
                              <button 
                                onClick={() => handleDelete(true)}
                                className="w-full py-2 bg-[#FF3B30] text-white rounded-xl text-[13px] font-bold"
                              >
                                Delete Entire Series
                              </button>
                            )}
                            <button 
                              onClick={() => setShowDeleteConfirm(false)}
                              className="w-full py-2 text-[#8E8E93] text-[12px] font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
