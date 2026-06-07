import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface SummaryCardProps {
  id: string;
  title: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  id,
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  color,
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/10 dark:border-emerald-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/10 dark:border-blue-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/10 dark:border-amber-500/20',
    },
    rose: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/10 dark:border-rose-500/20',
    },
    violet: {
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-500/10 dark:border-violet-500/20',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      id={`summary-card-${id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-36`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight leading-none truncate max-w-[150px] sm:max-w-[200px]" title={value}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-50 dark:border-slate-800/50 pt-3">
        <span className="text-slate-400 dark:text-slate-500">{subtext || 'Annual Performance'}</span>
        {trend && (
          <span
            className={`font-semibold px-2 py-0.5 rounded-full ${
              trend === 'up'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : trend === 'down'
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {trend === 'up' ? '▲ High' : trend === 'down' ? '▼ Check' : '● Solid'}
          </span>
        )}
      </div>
    </motion.div>
  );
};
