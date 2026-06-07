import React, { useState } from 'react';
import { useMISStore } from '../store';
import { Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

export const MonthManager: React.FC = () => {
  const store = useMISStore();
  const months = store.months;
  const [newMonth, setNewMonth] = useState('');
  const [error, setError] = useState('');

  const monthsList = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const input = newMonth.trim();
    if (!input) return;

    // Validate format: "MMM YY" (e.g. "Jan 25")
    const parts = input.split(' ');
    if (parts.length !== 2) {
      setError('Please use the format: MMM YY (e.g., "Jan 26")');
      return;
    }

    const mPart = parts[0];
    const yPart = parts[1];

    // Standardize month name (capitalize first letter, lowercase rest)
    const formattedMonthName = mPart.charAt(0).toUpperCase() + mPart.slice(1).toLowerCase();

    if (!monthsList.includes(formattedMonthName)) {
      setError(`Invalid month name "${mPart}". Must be one of Jan, Feb, Mar, etc.`);
      return;
    }

    // Validate year part is exactly two digits
    if (!/^\d{2}$/.test(yPart)) {
      setError('Year must be exactly two digits (e.g., "26" for 2026)');
      return;
    }

    const finalizedMonthString = `${formattedMonthName} ${yPart}`;

    if (months.includes(finalizedMonthString)) {
      setError(`"${finalizedMonthString}" is already added to the spreadsheet.`);
      return;
    }

    // Add and clear
    store.addMonth(finalizedMonthString);
    setNewMonth('');
  };

  const handleDeleteMonth = (m: string) => {
    if (months.length <= 1) {
      alert('You must keep at least one month in the spreadsheet.');
      return;
    }

    if (
      confirm(
        `Are you sure you want to delete ${m}? All financial cell data and aggregates mapped under ${m} will be permanently cleared from the current session and backup.`
      )
    ) {
      store.removeMonth(m);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-500" />
        <span>Manage Spreadsheet Months</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Month Section */}
        <div className="md:col-span-1 space-y-4">
          <form onSubmit={handleAddMonth} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-sans">
                Add New Period
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMonth}
                  onChange={(e) => {
                    setNewMonth(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Jan 26"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400 focus:border-blue-500 transition-all font-mono"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-200/[0.15]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-2 text-xs font-semibold leading-relaxed border border-rose-100 dark:border-rose-900/50">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed rounded-xl border border-slate-100 dark:border-slate-800 font-medium">
            <p className="font-bold mb-1 text-slate-650 dark:text-slate-350">Usage Tips:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Input format: <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200/50 dark:border-slate-800/50">MMM YY</code> (e.g., <code className="font-mono px-1">Jan 26</code>, <code className="font-mono px-1">Nov 25</code>).</li>
              <li>Newly added periods are automatically sorted chronologically.</li>
              <li>Values for newly added months will be safely initialized to zero (<code className="font-mono">-</code>) across all categories.</li>
            </ul>
          </div>
        </div>

        {/* List & Delete Section */}
        <div className="md:col-span-2 space-y-3">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase font-sans">
            Active Statement Periods ({months.length})
          </label>
          <div className="flex flex-wrap gap-2.5 max-h-[350px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner scrollbar-thin">
            {months.map((m) => (
              <div
                key={m}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs group transition-all duration-150"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-xs font-bold font-mono text-slate-750 dark:text-slate-300">{m}</span>
                <button
                  onClick={() => handleDeleteMonth(m)}
                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/45 text-slate-400 hover:text-rose-650 dark:hover:text-rose-450 rounded-md transition-colors cursor-pointer"
                  title={`Delete ${m}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
