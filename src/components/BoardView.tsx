import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  User, 
  Trash2, 
  Clock,
  AlertTriangle,
  Tag,
  Plus,
  MoreVertical,
  Calendar as CalendarIcon,
  Layout,
  GripVertical,
  Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { Task } from '../types';
import { useAuth } from '../AuthContext';
import TaskModal from './TaskModal';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_COLORS = {
  low: 'bg-[#F2F2F7] text-[#8E8E93] border-[#E5E5EA]',
  medium: 'bg-[#E5F1FF] text-[#007AFF] border-[#007AFF]/10',
  high: 'bg-[#007AFF] text-white border-transparent',
  critical: 'bg-[#FF3B30] text-white border-transparent',
};

const PRIORITY_INDICATORS = {
  low: 'bg-[#8E8E93]',
  medium: 'bg-[#007AFF]',
  high: 'bg-[#007AFF]',
  critical: 'bg-[#FF3B30]',
};

interface SortableTaskProps {
  key?: React.Key;
  task: Task;
  deleteTask: (id: number) => void;
  updateTaskStatus: (id: number, status: Task['status']) => void;
  columnStatus: Task['status'];
  onClick: (task: Task) => void;
}

function SortableTaskCard({ task, deleteTask, updateTaskStatus, columnStatus, onClick }: SortableTaskProps) {
  const { isAuthenticated } = useAuth();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    disabled: !isAuthenticated,
    data: {
      type: 'Task',
      task,
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        "bg-white rounded-xl p-4 shadow-sm border border-[#E5E5EA] transition-all group relative overflow-hidden",
        isAuthenticated ? "cursor-grab active:cursor-grabbing hover:border-[#007AFF]/30 hover:shadow-md" : "cursor-default",
        isDragging && "z-50 shadow-xl border-[#007AFF]/50"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            PRIORITY_COLORS[task.priority]
          )}>
            {task.priority}
          </span>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Removed inline delete button to encourage using detailed view */}
          </div>
        )}
      </div>

      <h3 className="font-bold text-black leading-tight mb-2 text-[15px] flex items-center justify-between">
        {task.title}
        {task.recurrence_frequency && task.recurrence_frequency !== 'none' && (
          <Repeat className="w-3.5 h-3.5 text-[#C7C7CC] shrink-0" />
        )}
      </h3>
      
      <div className="flex flex-col gap-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-[12px] text-[#8E8E93] font-medium">
          <Tag className="w-3.5 h-3.5" />
          {task.category}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#8E8E93] font-medium">
          <CalendarIcon className="w-3.5 h-3.5" />
          {format(parseISO(task.date), 'MMM d, yyyy')}
        </div>
      </div>

      {task.subtasks.length > 0 && (
        <div className="mb-4 space-y-1.5 bg-[#F2F2F7]/50 p-2 rounded-lg border border-[#E5E5EA]/50">
          {task.subtasks.slice(0, 2).map(st => (
            <div key={st.id} className="flex items-center gap-2 text-[11px]">
              {st.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-[#C7C7CC]" />
              )}
              <span className={cn(
                "truncate transition-all",
                st.completed ? "text-[#8E8E93] line-through" : "text-black"
              )}>
                {st.title}
              </span>
            </div>
          ))}
          {task.subtasks.length > 2 && (
            <div className="text-[10px] text-[#8E8E93] font-medium pl-5">
              + {task.subtasks.length - 2} more
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#F2F2F7]">
        <div className="flex items-center gap-1.5 text-[12px] text-[#8E8E93] font-medium">
          <div className="w-6 h-6 bg-[#F2F2F7] rounded-full flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[#8E8E93]" />
          </div>
          <span className="truncate max-w-[80px]">{task.assignee || 'Unassigned'}</span>
        </div>
        
        <div className="flex gap-1">
          {isAuthenticated && columnStatus !== 'pending' && (
            <button 
              onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'pending'); }}
              className="p-1.5 text-[#C7C7CC] hover:text-[#007AFF] transition-colors pointer-events-auto"
              title="Move to Pending"
            >
              <Circle className="w-4 h-4" />
            </button>
          )}
          {isAuthenticated && columnStatus !== 'in-progress' && (
            <button 
              onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'in-progress'); }}
              className="p-1.5 text-[#C7C7CC] hover:text-black transition-colors pointer-events-auto"
              title="Move to In Progress"
            >
              <Clock className="w-4 h-4" />
            </button>
          )}
          {isAuthenticated && columnStatus !== 'completed' && (
            <button 
              onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'completed'); }}
              className="p-1.5 text-[#C7C7CC] hover:text-emerald-500 transition-colors pointer-events-auto"
              title="Move to Completed"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface BoardColumnProps {
  key?: React.Key;
  column: { title: string; status: Task['status']; color: string };
  tasks: Task[];
  deleteTask: (id: number) => void;
  updateTaskStatus: (id: number, status: Task['status']) => void;
  onTaskClick: (task: Task) => void;
}

function BoardColumn({ column, tasks, deleteTask, updateTaskStatus, onTaskClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border border-[#E5E5EA] overflow-hidden transition-all duration-300",
        column.color,
        isOver ? "bg-[#007AFF]/10 ring-4 ring-[#007AFF]/10 border-[#007AFF]/40 scale-[1.01] shadow-lg" : "bg-[#F2F2F7]/30"
      )}
    >
      <div className="p-4 border-b border-[#E5E5EA] bg-white/80 backdrop-blur-sm flex justify-between items-center">
        <h2 className="font-bold text-black flex items-center gap-2 text-[15px] tracking-tight">
          {column.title}
          <span className="text-[11px] bg-[#F2F2F7] text-[#8E8E93] px-2 py-0.5 rounded-full border border-[#E5E5EA]">
            {tasks.length}
          </span>
        </h2>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {/* @ts-ignore - React 19 type compatibility issue with @dnd-kit */}
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <SortableTaskCard 
              key={task.id} 
              task={task} 
              deleteTask={deleteTask}
              updateTaskStatus={updateTaskStatus}
              columnStatus={column.status}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function BoardView() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
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
  }, []);

  const updateTaskStatus = async (id: number, status: Task['status']) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        fetchTasks(); // Rollback on error
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      fetchTasks(); // Rollback
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const openEditModal = (task: Task) => {
    if (!isAuthenticated) return;
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const columns: { title: string; status: Task['status']; color: string }[] = [
    { title: 'Pending', status: 'pending', color: 'bg-[#F2F2F7]/30' },
    { title: 'In Progress', status: 'in-progress', color: 'bg-[#E5E5EA]/20' },
    { title: 'Completed', status: 'completed', color: 'bg-emerald-50/20' },
  ];

  const getSortedTasksForColumn = (status: Task['status']) => {
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => {
        const dateA = a.due_date || a.date;
        const dateB = b.due_date || b.date;
        return dateA.localeCompare(dateB);
      });
  };

  function handleDragStart(event: any) {
    const { active } = event;
    setActiveTask(active.data.current.task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";

    if (!isActiveATask) return;

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      const activeTask = active.data.current.task;
      const overTask = over.data.current.task;

      if (activeTask.status !== overTask.status) {
        setTasks((tasks) => {
          const activeIndex = tasks.findIndex((t) => t.id === activeId);
          const overIndex = tasks.findIndex((t) => t.id === overId);

          tasks[activeIndex].status = overTask.status;

          return arrayMove(tasks, activeIndex, overIndex);
        });
      } else {
        // Same column reordering
        setTasks((tasks) => {
          const activeIndex = tasks.findIndex((t) => t.id === activeId);
          const overIndex = tasks.findIndex((t) => t.id === overId);
          return arrayMove(tasks, activeIndex, overIndex);
        });
      }
    }

    // Dropping a Task over a column
    const isOverAColumn = columns.some(col => col.status === overId);
    if (isActiveATask && isOverAColumn) {
      const activeTask = active.data.current.task;
      const overColumnStatus = overId as Task['status'];

      if (activeTask.status !== overColumnStatus) {
        setTasks((tasks) => {
          const activeIndex = tasks.findIndex((t) => t.id === activeId);
          tasks[activeIndex].status = overColumnStatus;
          return arrayMove(tasks, activeIndex, activeIndex);
        });
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Determine target status
    let targetStatus: Task['status'] = activeTask.status;
    
    const isOverAColumn = columns.some(col => col.status === overId);
    if (isOverAColumn) {
      targetStatus = overId as Task['status'];
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    // Update on server if status changed
    if (activeTask.status !== targetStatus) {
      await updateTaskStatus(activeId, targetStatus);
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto px-4 sm:px-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
        <div>
          <h1 className="text-[34px] font-bold text-black tracking-tight leading-tight">
            Compliance Board
          </h1>
          <p className="text-[#8E8E93] mt-1 font-medium text-[15px]">Manage your regulatory workflow</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#F2F2F7] rounded-full px-4 py-2 text-[13px] font-bold text-black border border-[#E5E5EA]">
            {tasks.length} Total Tasks
          </div>
          {isAuthenticated && (
            <button 
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#007AFF] text-white rounded-full text-[15px] font-bold shadow-lg shadow-[#007AFF]/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)]">
          {columns.map((column) => (
            <BoardColumn 
              key={column.status} 
              column={column} 
              tasks={getSortedTasksForColumn(column.status)}
              deleteTask={deleteTask}
              updateTaskStatus={updateTaskStatus}
              onTaskClick={openEditModal}
            />
          ))}
        </div>

        <DragOverlay adjustScale={true}>
          {activeTask ? (
            <div className="w-[300px] rotate-[3deg] scale-105 shadow-2xl pointer-events-none opacity-90">
              <SortableTaskCard 
                task={activeTask} 
                deleteTask={() => {}} 
                updateTaskStatus={() => {}} 
                columnStatus={activeTask.status}
                onClick={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        onSave={fetchTasks}
        onDelete={deleteTask}
      />
    </div>
  );
}

