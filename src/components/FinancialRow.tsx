import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Trash2, Edit3, Check, X, MessageSquare } from 'lucide-react';
import { EditableCell } from './EditableCell';
import { useMISStore } from '../store';

interface FinancialRowProps {
  id: string;
  name: string;
  depth: number;
  isParentNode: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  monthlyValues: Record<string, number>;
  totalValue: number;
  notes?: string;
  onValueChange: (month: string, value: number) => void;
  onNotesChange?: (notes: string) => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
  visibleRowIds: string[];
}

export const FinancialRow: React.FC<FinancialRowProps> = React.memo(({
  id,
  name,
  depth,
  isParentNode,
  isCollapsed,
  onToggleCollapse,
  monthlyValues,
  totalValue,
  notes,
  onValueChange,
  onNotesChange,
  onDelete,
  onRename,
  visibleRowIds,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isShowingNotesInput, setIsShowingNotesInput] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes || '');

  const activeSheet = useMISStore(state => state.activeSheet);
  const months = useMISStore(state => state.months);
  const userRole = useMISStore(state => state.userRole);

  const handleSaveName = () => {
    if (editedName.trim() && editedName.trim() !== name) {
      onRename(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleSaveNotes = () => {
    if (onNotesChange) {
      onNotesChange(editedNotes);
    }
    setIsShowingNotesInput(false);
  };

  // Simple check for responsive indentation
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 645); // threshold matching mobile
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(totalValue);

  return (
    <>
      <tr className={`border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 group/row transition-colors ${
        isParentNode ? 'bg-slate-50/20 dark:bg-slate-950/5 font-bold' : ''
      }`}>
        {/* Name and hierarchy Column */}
        <td 
          className="sticky left-0 bg-white dark:bg-slate-950 z-10 px-2 sm:px-4 py-2 min-w-[150px] sm:min-w-[280px] max-w-[150px] sm:max-w-[280px] border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.01)] transition-colors"
          style={{ paddingLeft: `${isMobile ? Math.max(6, depth * 8) : Math.max(16, depth * 24)}px` }}
        >
          <div className="flex items-center gap-1 sm:gap-1.5 w-full min-w-0">
            {/* Collapse/Expand Toggle */}
            {isParentNode ? (
              <button 
                onClick={onToggleCollapse}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-4 sm:w-5.5 shrink-0" />
            )}

            {/* Inline Edit Row Name */}
            {isEditingName ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setEditedName(name);
                      setIsEditingName(false);
                    }
                  }}
                  className="px-1.5 py-0.5 border border-blue-500 rounded font-sans text-xs bg-white dark:bg-slate-900 text-slate-950 dark:text-white w-full focus:outline-none"
                  autoFocus
                />
                <button onClick={handleSaveName} className="p-0.5 rounded text-emerald-600 hover:bg-emerald-50 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsEditingName(false)} className="p-0.5 rounded text-rose-500 hover:bg-rose-50 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between min-w-0 pr-1 group">
                <span 
                  className={`truncate text-xs tracking-tight transition-colors ${
                    isParentNode 
                      ? 'font-bold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' 
                      : 'font-medium text-slate-700 dark:text-slate-300'
                  }`}
                  onClick={() => {
                    if (isParentNode) {
                      onToggleCollapse();
                    }
                  }}
                  onDoubleClick={() => {
                    if (userRole === 'edit') {
                      setIsEditingName(true);
                    }
                  }}
                  title={name}
                >
                  {name}
                </span>

                {/* Inline Action Hover Icons: show consistently on touch, on-hover for desktop */}
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover/row:opacity-100 transition-opacity ml-1 shrink-0">
                  {userRole === 'edit' && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Rename Row"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                  {onNotesChange && (
                    <button
                      onClick={() => setIsShowingNotesInput(!isShowingNotesInput)}
                      className={`p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        notes ? 'text-blue-500 hover:text-blue-600' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title={notes ? `Notes: ${notes}` : 'Add Notes'}
                    >
                      <MessageSquare className="w-3 h-3" />
                    </button>
                  )}
                  {userRole === 'edit' && (
                    <button
                      onClick={onDelete}
                      className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </td>

        {/* Dynamic Month Cells */}
        {months.map(month => (
          <td 
            key={month} 
            className="p-0 border-r border-slate-100 dark:border-slate-800/50 min-w-[105px] max-w-[105px]"
          >
            <EditableCell
              rowId={id}
              column={month}
              value={monthlyValues[month] || 0}
              isReadOnly={isParentNode && activeSheet === 'p&l'} // Top-level parent totals are auto subtotals in P&L
              onSave={(val) => onValueChange(month, val)}
              visibleRowIds={visibleRowIds}
            />
          </td>
        ))}

        {/* Row Grand Total */}
        <td className="px-4 py-2 text-right font-mono text-xs font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800 min-w-[115px] bg-slate-50/20 dark:bg-slate-950/10">
          {formattedTotal}
        </td>
      </tr>

      {/* Expandable Notes Input Row below row */}
      {isShowingNotesInput && (
        <tr>
          <td colSpan={months.length + 2} className="px-4 py-2 bg-blue-50/30 dark:bg-blue-500/5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Notes for {name}:</span>
              <input
                type="text"
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                onBlur={userRole === 'edit' ? handleSaveNotes : undefined}
                placeholder={userRole === 'edit' ? "Write any custom comments/notes here..." : "No custom notes written..."}
                onKeyDown={(e) => e.key === 'Enter' && userRole === 'edit' && handleSaveNotes()}
                readOnly={userRole !== 'edit'}
                className="flex-1 px-3 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none disabled:bg-slate-50/50"
              />
              {userRole === 'edit' && (
                <button 
                  onClick={handleSaveNotes} 
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all"
                >
                  Save Note
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Deep-equal check optimizing render performance
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.depth === nextProps.depth &&
    prevProps.isParentNode === nextProps.isParentNode &&
    prevProps.isCollapsed === nextProps.isCollapsed &&
    prevProps.totalValue === nextProps.totalValue &&
    prevProps.notes === nextProps.notes &&
    JSON.stringify(prevProps.monthlyValues) === JSON.stringify(nextProps.monthlyValues) &&
    JSON.stringify(prevProps.visibleRowIds) === JSON.stringify(nextProps.visibleRowIds)
  );
});

FinancialRow.displayName = 'FinancialRow';
