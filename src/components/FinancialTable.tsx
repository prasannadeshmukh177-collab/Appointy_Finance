import React, { useMemo } from 'react';
import { useMISStore } from '../store';
import { RevenueTree } from './RevenueTree';
import { ExpenseTree } from './ExpenseTree';

export const FinancialTable: React.FC = () => {
  const store = useMISStore();
  const revenueItems = store.revenueItems;
  const expenseItems = store.expenseItems;
  const collapsedRows = store.collapsedRows;
  const searchFilter = store.searchFilter;
  const months = store.months;

  // 1. Calculate combined visible row IDs across revenue & expense for cell key navigation
  const visibleRowIds = useMemo(() => {
    const list: string[] = [];

    // Revenue visible rows
    const revRoots = revenueItems.filter(item => item.parentId === null);
    revRoots.forEach(root => {
      const matchSearch = root.name.toLowerCase().includes(searchFilter.toLowerCase());
      const children = revenueItems.filter(child => child.parentId === root.id);
      const isParent = children.length > 0;
      const isCollapsed = collapsedRows.includes(root.id);
      
      const childrenMatch = children.some(c => c.name.toLowerCase().includes(searchFilter.toLowerCase()));

      if (searchFilter && !matchSearch && !childrenMatch) return;

      list.push(root.id);

      if (isParent && !isCollapsed) {
        children.forEach(child => {
          if (searchFilter && !child.name.toLowerCase().includes(searchFilter.toLowerCase())) return;
          list.push(child.id);
        });
      }
    });

    // Expense visible rows
    const expRoots = expenseItems.filter(item => item.parentId === null);
    expRoots.forEach(root => {
      const matchSearch = root.name.toLowerCase().includes(searchFilter.toLowerCase());
      const children = expenseItems.filter(child => child.parentId === root.id);
      const isParent = children.length > 0;
      const isCollapsed = collapsedRows.includes(root.id);
      
      const childrenMatch = children.some(c => c.name.toLowerCase().includes(searchFilter.toLowerCase()));

      if (searchFilter && !matchSearch && !childrenMatch) return;

      list.push(root.id);

      if (isParent && !isCollapsed) {
        children.forEach(child => {
          if (searchFilter && !child.name.toLowerCase().includes(searchFilter.toLowerCase())) return;
          list.push(child.id);
        });
      }
    });

    return list;
  }, [revenueItems, expenseItems, collapsedRows, searchFilter]);

  // 2. Perform high precision monthly aggregates using derived state mapping
  const aggregates = useMemo(() => {
    const monthlyRev: Record<string, number> = {};
    const monthlyExp: Record<string, number> = {};
    const monthlyEbitda: Record<string, number> = {};
    const monthlyMargin: Record<string, number> = {};

    months.forEach(m => {
      // Sum revenue roots (auto aggregating child levels where needed to ensure accuracy)
      const roots = revenueItems.filter(item => item.parentId === null);
      let mRevSum = 0;
      roots.forEach(root => {
        const children = revenueItems.filter(c => c.parentId === root.id);
        if (children.length > 0) {
          mRevSum += children.reduce((s, c) => s + (c.monthlyValues[m] || 0), 0);
        } else {
          mRevSum += root.monthlyValues[m] || 0;
        }
      });
      monthlyRev[m] = mRevSum;

      // Sum expenses (auto aggregating child levels where needed to ensure accuracy)
      const expRoots = expenseItems.filter(item => item.parentId === null);
      let mExpSum = 0;
      expRoots.forEach(root => {
        const children = expenseItems.filter(c => c.parentId === root.id);
        if (children.length > 0) {
          mExpSum += children.reduce((s, c) => s + (c.monthlyValues[m] || 0), 0);
        } else {
          mExpSum += root.monthlyValues[m] || 0;
        }
      });
      monthlyExp[m] = mExpSum;

      monthlyEbitda[m] = mRevSum - mExpSum;
      monthlyMargin[m] = mRevSum > 0 ? (monthlyEbitda[m] / mRevSum) * 100 : 0;
    });

    // Year end aggregated sums
    const annualRevTotal = months.reduce((s, m) => s + (monthlyRev[m] || 0), 0);
    const annualExpTotal = months.reduce((s, m) => s + (monthlyExp[m] || 0), 0);
    const annualEbitdaTotal = annualRevTotal - annualExpTotal;
    const annualMarginTotal = annualRevTotal > 0 ? (annualEbitdaTotal / annualRevTotal) * 100 : 0;

    return {
      monthlyRev,
      monthlyExp,
      monthlyEbitda,
      monthlyMargin,
      annualRevTotal,
      annualExpTotal,
      annualEbitdaTotal,
      annualMarginTotal,
    };
  }, [revenueItems, expenseItems, months]);

  const currencyFormatter = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const percentageFormatter = (val: number) => {
    return `${val.toFixed(1)}%`;
  };

  return (
    <div className="w-full bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden select-none">
      <div className="overflow-x-auto relative max-h-[800px] scrollbar-thin">
        <table className="w-full text-left border-collapse table-fixed">
          <colgroup>
            <col className="w-[150px] sm:w-[280px]" />
            {months.map(month => (
              <col key={month} className="w-[105px]" />
            ))}
            <col className="w-[115px]" />
          </colgroup>
          {/* Sticky Header Row */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-20">
              <th className="sticky left-0 bg-slate-50 dark:bg-slate-900 z-30 px-2 sm:px-4 py-3 min-w-[150px] sm:min-w-[280px] max-w-[150px] sm:max-w-[280px] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800/80 animate-fade-in">
                Particulars
              </th>
              {months.map(month => (
                <th key={month} className="px-3 py-3 min-w-[105px] max-w-[105px] text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800/60 font-mono">
                  {month}
                </th>
              ))}
              <th className="px-4 py-3 min-w-[115px] text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                Annual Total
              </th>
            </tr>
          </thead>

          {/* Table Body Workspace */}
          <tbody className="divide-y divide-slate-50 dark:divide-slate-900 bg-white dark:bg-slate-950">
            {/* --- REVENUE SECTION --- */}
            <tr className="bg-blue-500/5 dark:bg-blue-500/10">
              <td colSpan={months.length + 2} className="px-4 py-2 font-black text-xs font-sans tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                Sales
              </td>
            </tr>
            <RevenueTree visibleRowIds={visibleRowIds} />

            {/* Total Revenue Summary Subtotal Row */}
            <tr className="bg-emerald-500/[0.04] dark:bg-emerald-500/10 border-t-2 border-slate-200 dark:border-slate-800">
              <td className="sticky left-0 bg-emerald-100 dark:bg-emerald-950 z-10 px-2 sm:px-4 py-3 min-w-[150px] sm:min-w-[280px] max-w-[150px] sm:max-w-[280px] font-bold text-xs text-emerald-800 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.015)] uppercase">
                Total Sales
              </td>
              {months.map(month => (
                <td key={month} className="px-3 py-3 text-right font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800/50">
                  {currencyFormatter(aggregates.monthlyRev[month] || 0)}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-mono text-xs font-extrabold text-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                {currencyFormatter(aggregates.annualRevTotal)}
              </td>
            </tr>

            {/* --- EXPENSE SECTION --- */}
            <tr className="bg-rose-500/5 dark:bg-rose-500/10">
              <td colSpan={months.length + 2} className="px-4 py-2 font-black text-xs font-sans tracking-wider text-rose-600 dark:text-rose-400 uppercase">
                Expenses
              </td>
            </tr>
            <ExpenseTree visibleRowIds={visibleRowIds} />

            {/* Total Expenses Summary Subtotal Row */}
            <tr className="bg-slate-100/50 dark:bg-slate-900/30 border-t-2 border-slate-200 dark:border-slate-800">
              <td className="sticky left-0 bg-slate-200 dark:bg-slate-900 z-10 px-2 sm:px-4 py-3 min-w-[150px] sm:min-w-[280px] max-w-[150px] sm:max-w-[280px] font-bold text-xs text-slate-800 dark:text-slate-350 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.015)] uppercase">
                Total Expenses
              </td>
              {months.map(month => (
                <td key={month} className="px-3 py-3 text-right font-mono text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/50">
                  {currencyFormatter(aggregates.monthlyExp[month] || 0)}
                </td>
              ))}
              <td className="px-4 py-3 text-right font-mono text-xs font-extrabold text-slate-800 dark:text-slate-300 bg-slate-100/30 dark:bg-slate-900/30">
                {currencyFormatter(aggregates.annualExpTotal)}
              </td>
            </tr>

            {/* --- LINE BREAK / SPACING --- */}
            <tr className="h-4 bg-slate-50 dark:bg-slate-950/80">
              <td colSpan={months.length + 2} />
            </tr>

            {/* --- MASTER BOTTOM KPI FINANCIAL ROWS --- */}
            
            {/* EBITDA Summary Row */}
            <tr className="bg-blue-500/[0.04] dark:bg-blue-500/10 border-t-2 border-blue-200 dark:border-blue-900">
              <td className="sticky left-0 bg-blue-100 dark:bg-blue-950 z-10 px-2 sm:px-4 py-3 min-w-[150px] sm:min-w-[280px] max-w-[150px] sm:max-w-[280px] font-bold text-xs text-blue-800 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.015)] uppercase">
                Profit
              </td>
              {months.map(month => (
                <td key={month} className={`px-3 py-3 text-right font-mono text-xs font-bold border-r border-slate-100 dark:border-slate-800/50 ${
                  (aggregates.monthlyEbitda[month] || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-700 dark:text-blue-400'
                }`}>
                  {currencyFormatter(aggregates.monthlyEbitda[month] || 0)}
                </td>
              ))}
              <td className={`px-4 py-3 text-right font-mono text-xs font-extrabold bg-blue-50/50 dark:bg-blue-950/20 ${
                aggregates.annualEbitdaTotal < 0 ? 'text-rose-700 dark:text-rose-400 font-extrabold' : 'text-blue-800 dark:text-blue-400'
              }`}>
                {currencyFormatter(aggregates.annualEbitdaTotal)}
              </td>
            </tr>

            {/* Net Margin % Row */}
            <tr className="bg-violet-500/[0.04] dark:bg-violet-500/10 border-b border-t border-violet-200 dark:border-violet-900">
              <td className="sticky left-0 bg-violet-100 dark:bg-violet-950 z-10 px-2 sm:px-4 py-3 min-w-[150px] sm:min-w-[280px] max-w-[150px] sm:max-w-[280px] font-bold text-xs text-violet-800 dark:text-violet-400 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.015)] uppercase">
                Net Margin (%)
              </td>
              {months.map(month => (
                <td key={month} className={`px-3 py-3 text-right font-mono text-xs font-bold border-r border-slate-100 dark:border-slate-800/50 ${
                  (aggregates.monthlyMargin[month] || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-violet-700 dark:text-violet-400'
                }`}>
                  {percentageFormatter(aggregates.monthlyMargin[month] || 0)}
                </td>
              ))}
              <td className={`px-4 py-3 text-right font-mono text-xs font-extrabold bg-violet-50/50 dark:bg-violet-950/20 ${
                aggregates.annualMarginTotal < 0 ? 'text-rose-700 dark:text-rose-400 font-extrabold' : 'text-violet-800 dark:text-violet-400'
              }`}>
                {percentageFormatter(aggregates.annualMarginTotal)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
