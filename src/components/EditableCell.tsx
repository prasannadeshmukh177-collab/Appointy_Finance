import React, { useState, useEffect, useRef } from 'react';
import { useMISStore } from '../store';

interface EditableCellProps {
  rowId: string;
  column: string; // e.g. "Jan 25", "Feb 25"
  value: number;
  isReadOnly?: boolean;
  onSave: (val: number) => void;
  visibleRowIds: string[]; // List of row IDs on the current sheet for vertical keys
}

export const EditableCell: React.FC<EditableCellProps> = ({
  rowId,
  column,
  value,
  isReadOnly = false,
  onSave,
  visibleRowIds,
}) => {
  const selectedCell = useMISStore(state => state.selectedCell);
  const setSelectedCell = useMISStore(state => state.setSelectedCell);
  const months = useMISStore(state => state.months);
  const userRole = useMISStore(state => state.userRole);

  const effectiveIsReadOnly = isReadOnly || userRole !== 'edit';

  const isSelected = selectedCell?.rowId === rowId && selectedCell?.column === column;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  // Sync state if value changes from somewhere else
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle cell click selection
  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveIsReadOnly) return;
    setSelectedCell({ rowId, column });
  };

  // Enter edit mode
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (effectiveIsReadOnly) return;
    setIsEditing(true);
  };

  // Exit edit mode & save
  const handleSave = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsed)) {
      onSave(parsed);
    } else {
      setInputValue(value.toString()); // Revert
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue(value.toString());
  };

  // Handle keyboard events on container and cell level
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
        // Keep selected, focus container
        cellRef.current?.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        cellRef.current?.focus();
      }
      return;
    }

    if (isSelected) {
      let handled = false;
      const colIdx = months.indexOf(column);
      const rowIdx = visibleRowIds.indexOf(rowId);

      if (e.key === 'ArrowRight' && colIdx < months.length - 1) {
        setSelectedCell({ rowId, column: months[colIdx + 1] });
        handled = true;
      } else if (e.key === 'ArrowLeft' && colIdx > 0) {
        setSelectedCell({ rowId, column: months[colIdx - 1] });
        handled = true;
      } else if (e.key === 'ArrowDown' && rowIdx < visibleRowIds.length - 1) {
        setSelectedCell({ rowId: visibleRowIds[rowIdx + 1], column });
        handled = true;
      } else if (e.key === 'ArrowUp' && rowIdx > 0) {
        setSelectedCell({ rowId: visibleRowIds[rowIdx - 1], column });
        handled = true;
      } else if (e.key === 'Enter' || e.key === 'F2') {
        setIsEditing(true);
        handled = true;
      }

      if (handled) {
        e.preventDefault();
      }
    }
  };

  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  // Keyboard accessibility: focus native elements when selected
  useEffect(() => {
    if (isSelected && cellRef.current && !isEditing) {
      cellRef.current.focus();
    }
  }, [isSelected, isEditing]);

  if (isEditing) {
    return (
      <div className="p-0.5 h-full w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          className="w-full h-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 text-right font-mono font-medium rounded border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
        />
      </div>
    );
  }

  return (
    <div
      ref={cellRef}
      tabIndex={effectiveIsReadOnly ? -1 : 0}
      onClick={handleCellClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={`h-full w-full px-3 py-2 text-right font-mono text-xs font-semibold cursor-cell focus:outline-none select-none transition-colors duration-100 ${
        isSelected
          ? 'bg-blue-100/50 dark:bg-blue-500/20 ring-2 ring-blue-500/80 ring-inset rounded-sm'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
      } ${value < 0 ? 'text-red-500 dark:text-red-400 font-bold' : ''}`}
    >
      {value === 0 && isSelected ? '0' : value === 0 ? '-' : formattedValue}
    </div>
  );
};
