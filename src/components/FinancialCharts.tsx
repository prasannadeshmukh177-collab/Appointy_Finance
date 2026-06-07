import React, { useMemo } from 'react';
import { useMISStore } from '../store';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const FinancialCharts: React.FC = () => {
  const store = useMISStore();
  const revenueItems = store.revenueItems;
  const expenseItems = store.expenseItems;
  const months = store.months;

  const chartData = useMemo(() => {
    return months.map(m => {
      // Sum revenue roots (incorporating child values)
      const roots = revenueItems.filter(item => item.parentId === null);
      let revenue = 0;
      roots.forEach(root => {
        const children = revenueItems.filter(c => c.parentId === root.id);
        if (children.length > 0) {
          revenue += children.reduce((s, c) => s + (c.monthlyValues[m] || 0), 0);
        } else {
          revenue += root.monthlyValues[m] || 0;
        }
      });

      // Sum expense
      const expense = expenseItems.reduce((s, item) => s + (item.monthlyValues[m] || 0), 0);
      const ebitda = revenue - expense;

      return {
        month: m,
        Revenue: revenue,
        Expense: expense,
        Profit: ebitda,
      };
    });
  }, [revenueItems, expenseItems, months]);

  const currencyFormatter = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const tooltipFormatter = (value: any) => {
    return [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value))];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none shadow-2xs">
      {/* Revenue & Expenses Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 font-sans">
          Revenue vs Expenses Trend
        </h3>
        <div className="h-[300px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/85" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94a3b8" />
              <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={currencyFormatter} />
              <Tooltip formatter={tooltipFormatter} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Profit Performance Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 font-sans">
          Monthly Profit Breakdown
        </h3>
        <div className="h-[300px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800/85" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94a3b8" />
              <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={currencyFormatter} />
              <Tooltip formatter={tooltipFormatter} contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="Profit" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.Profit < 0 ? '#ef4444' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
