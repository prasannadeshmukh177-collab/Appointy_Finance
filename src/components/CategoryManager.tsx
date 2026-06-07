import React, { useState } from 'react';
import { useMISStore } from '../store';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryManagerProps {
  type: 'revenue' | 'expense';
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ type }) => {
  const store = useMISStore();
  const [newCatName, setNewCatName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const revenueItems = store.revenueItems;
  const expenseItems = store.expenseItems;

  const currentItems = type === 'revenue' ? revenueItems : expenseItems;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const parentId = selectedParentId === 'none' || !selectedParentId ? null : selectedParentId;
    if (type === 'revenue') {
      store.addRevenueCategory(newCatName, parentId);
    } else {
      store.addExpenseCategory(newCatName, parentId);
    }

    setNewCatName('');
    setSelectedParentId('');
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    if (type === 'revenue') {
      store.updateRevenueCategoryName(id, editName);
    } else {
      store.updateExpenseCategoryName(id, editName);
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category? All its monthly values will be permanently removed.')) {
      if (type === 'revenue') {
        store.removeRevenueCategory(id);
      } else {
        store.removeExpenseCategory(id);
      }
    }
  };

  // Get eligible parents (only parent categories or root items)
  const parentCategories = currentItems.filter(item => item.parentId === null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
        <span>Manage {type === 'revenue' ? 'Revenue Tree' : 'Expense Lines'}</span>
      </h3>

      {/* Add New Category Form */}
      <form onSubmit={handleAdd} className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder={`Enter ${type === 'revenue' ? 'revenue line' : 'expense category'} name...`}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400 focus:border-blue-500 transition-all"
            required
          />

          <select
            value={selectedParentId}
            onChange={(e) => setSelectedParentId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all md:w-56"
          >
            <option value="">No Parent (Root Item)</option>
            {parentCategories.map(p => (
              <option key={p.id} value={p.id}>
                Parent: {p.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-200/[0.15]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </form>

      {/* Category List */}
      <div className="max-h-64 overflow-y-auto pr-1 space-y-2 select-none border border-slate-50 dark:border-slate-800/50 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/20">
        <AnimatePresence>
          {parentCategories.map(item => {
            const children = currentItems.filter(child => child.parentId === item.id);
            const isEditing = editingId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1.5"
              >
                {/* Parent Item */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs group">
                  <div className="flex-1 flex items-center gap-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
                        {item.name}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Parent
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(item.id, item.name)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-900 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-rose-500 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Render Children Nesting */}
                {children.length > 0 && (
                  <div className="pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-1.5">
                    {children.map(child => {
                      const isChildEditing = editingId === child.id;
                      return (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800/50 group"
                        >
                          <div className="flex-1 flex items-center gap-2">
                            {isChildEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-850 text-slate-900 dark:text-white text-xs font-semibold w-full focus:outline-none focus:ring-2"
                              />
                            ) : (
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-350">
                                {child.name}
                              </span>
                            )}
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-500">
                              Child
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            {isChildEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(child.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(child.id, child.name)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 hover:text-slate-900 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(child.id)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-rose-500 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
          {currentItems.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No custom lines found. Click add to begin.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
