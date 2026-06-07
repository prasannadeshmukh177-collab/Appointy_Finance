import React, { useMemo } from 'react';
import { useMISStore } from '../store';
import { FinancialRow } from './FinancialRow';
import { ExpenseItem } from '../types';

interface ExpenseTreeProps {
  visibleRowIds: string[];
}

export const ExpenseTree: React.FC<ExpenseTreeProps> = ({ visibleRowIds }) => {
  const expenseItems = useMISStore(state => state.expenseItems);
  const months = useMISStore(state => state.months);
  const collapsedRows = useMISStore(state => state.collapsedRows);
  const toggleRowCollapse = useMISStore(state => state.toggleRowCollapse);
  const updateExpenseValue = useMISStore(state => state.updateExpenseValue);
  const updateExpenseCategoryName = useMISStore(state => state.updateExpenseCategoryName);
  const updateExpenseNotes = useMISStore(state => state.updateExpenseNotes);
  const removeExpenseCategory = useMISStore(state => state.removeExpenseCategory);
  const searchFilter = useMISStore(state => state.searchFilter);

  // Derive calculated parent values & layout hierarchy in a memoized tree selector
  const processedItems = useMemo(() => {
    // 1. Separate roots (parents & loose nodes) and children
    const roots = expenseItems.filter(item => item.parentId === null);
    
    // Construct the final list with calculated totals
    const finalTree: {
      item: ExpenseItem;
      depth: number;
      isParentNode: boolean;
      isCollapsed: boolean;
      monthlyValues: Record<string, number>;
      totalValue: number;
    }[] = [];

    roots.forEach(root => {
      // Find direct children
      const children = expenseItems.filter(child => child.parentId === root.id);
      const isParent = children.length > 0;
      const isCollapsed = collapsedRows.includes(root.id);

      // Perform auto dynamic subtotaling for parent categories
      let aggregatedMonthly: Record<string, number> = { ...root.monthlyValues };
      
      if (isParent) {
        aggregatedMonthly = {};
        months.forEach(m => {
          aggregatedMonthly[m] = children.reduce((sum, child) => sum + (child.monthlyValues[m] || 0), 0);
        });
      }

      // Filter check based on search query
      const matchesSearch = root.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                            children.some(c => c.name.toLowerCase().includes(searchFilter.toLowerCase()));

      if (!matchesSearch) return;

      // Calculate annual row total
      const totalValue = months.reduce((sum, m) => sum + (aggregatedMonthly[m] || 0), 0);

      finalTree.push({
        item: root,
        depth: 0,
        isParentNode: isParent,
        isCollapsed,
        monthlyValues: aggregatedMonthly,
        totalValue
      });

      // Render expand list children if parent row is NOT collapsed
      if (isParent && !isCollapsed) {
        children.forEach(child => {
          if (searchFilter && !child.name.toLowerCase().includes(searchFilter.toLowerCase())) {
            return; // Filter child row matching query
          }

          const childTotal = months.reduce((sum, m) => sum + (child.monthlyValues[m] || 0), 0);

          finalTree.push({
            item: child,
            depth: 1,
            isParentNode: false,
            isCollapsed: false,
            monthlyValues: child.monthlyValues,
            totalValue: childTotal
          });
        });
      }
    });

    return finalTree;
  }, [expenseItems, collapsedRows, searchFilter, months]);

  return (
    <>
      {processedItems.map(({ item, depth, isParentNode, isCollapsed, monthlyValues, totalValue }) => (
        <FinancialRow
          key={item.id}
          id={item.id}
          name={item.name}
          depth={depth}
          isParentNode={isParentNode}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => toggleRowCollapse(item.id)}
          monthlyValues={monthlyValues}
          totalValue={totalValue}
          notes={item.notes}
          onValueChange={(month, val) => updateExpenseValue(item.id, month, val)}
          onNotesChange={(notes) => updateExpenseNotes(item.id, notes)}
          onDelete={() => removeExpenseCategory(item.id)}
          onRename={(newName) => updateExpenseCategoryName(item.id, newName)}
          visibleRowIds={visibleRowIds}
        />
      ))}

      {processedItems.length === 0 && (
        <tr>
          <td colSpan={months.length + 2} className="py-8 text-center text-xs text-slate-400">
            No matching expense profiles. Manage categories to append rows.
          </td>
        </tr>
      )}
    </>
  );
};
