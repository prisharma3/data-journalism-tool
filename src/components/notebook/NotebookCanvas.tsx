'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CodeCell from './CodeCell';

interface NotebookCanvasProps {
  projectId: string;
}

interface CodeCellType {
  id: string;
  type: 'code';
  content: string;
  output?: {
    text?: string;
    plot?: string;
    executionTime?: number;
  };
  error?: string;
  executionCount?: number;
  isRunning?: boolean;
}

interface NotebookState {
  cells: CodeCellType[];
  selectedCellId?: string;
  isExecutingAll: boolean;
  executionCounter: number;
}

export default function NotebookCanvas({ projectId }: NotebookCanvasProps) {
  const [notebookState, setNotebookState] = useState<NotebookState>({
    cells: [],
    selectedCellId: undefined,
    isExecutingAll: false,
    executionCounter: 0,
  });

  // Load cells from API or store
  useEffect(() => {
    // TODO: Fetch cells from API based on projectId
    // fetchNotebookCells(projectId);
  }, [projectId]);

  // Add new cell
  const addCell = useCallback((afterCellId?: string, position?: 'above' | 'below') => {
    const newCell: CodeCellType = {
      id: `cell-${Date.now()}`,
      type: 'code',
      content: '',
      output: undefined,
      executionCount: undefined,
    };

    setNotebookState(prev => {
      let newCells = [...prev.cells];
      if (afterCellId) {
        const index = newCells.findIndex(c => c.id === afterCellId);
        if (index !== -1) {
          const insertIndex = position === 'above' ? index : index + 1;
          newCells.splice(insertIndex, 0, newCell);
        } else {
          newCells.push(newCell);
        }
      } else {
        newCells.push(newCell);
      }

      return {
        ...prev,
        cells: newCells,
        selectedCellId: newCell.id,
      };
    });
  }, []);

  // Delete cell
  const deleteCell = useCallback((cellId: string) => {
    setNotebookState(prev => {
      const newCells = prev.cells.filter(c => c.id !== cellId);
      let newSelectedId = prev.selectedCellId;

      if (prev.selectedCellId === cellId) {
        const deletedIndex = prev.cells.findIndex(c => c.id === cellId);
        if (deletedIndex > 0) {
          newSelectedId = prev.cells[deletedIndex - 1].id;
        } else if (newCells.length > 0) {
          newSelectedId = newCells[0].id;
        } else {
          newSelectedId = undefined;
        }
      }

      return {
        ...prev,
        cells: newCells,
        selectedCellId: newSelectedId,
      };
    });
  }, []);

  // Update cell content
  const updateCell = useCallback((cellId: string, content: string) => {
    setNotebookState(prev => ({
      ...prev,
      cells: prev.cells.map(cell =>
        cell.id === cellId ? { ...cell, content } : cell
      ),
    }));
  }, []);

  // Execute single cell
  const executeCell = useCallback(async (cellId: string) => {
    const cell = notebookState.cells.find(c => c.id === cellId);
    if (!cell || !cell.content.trim()) return;

    // Mark cell as running
    setNotebookState(prev => ({
      ...prev,
      cells: prev.cells.map(c =>
        c.id === cellId ? { ...c, isRunning: true, error: undefined } : c
      ),
    }));

    try {
      const startTime = Date.now();
      
      // TODO: Call API to execute code
      // const result = await executeCode(cell.content);
      
      // Simulate execution for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      const executionTime = Date.now() - startTime;

      // Update cell with results
      setNotebookState(prev => ({
        ...prev,
        executionCounter: prev.executionCounter + 1,
        cells: prev.cells.map(c =>
          c.id === cellId
            ? {
                ...c,
                isRunning: false,
                output: {
                  text: '# Results will appear here',
                  executionTime,
                },
                executionCount: prev.executionCounter + 1,
              }
            : c
        ),
      }));
    } catch (error: any) {
      // Handle execution error
      setNotebookState(prev => ({
        ...prev,
        cells: prev.cells.map(c =>
          c.id === cellId
            ? {
                ...c,
                isRunning: false,
                error: error.message || 'Execution failed',
              }
            : c
        ),
      }));
    }
  }, [notebookState.cells, notebookState.executionCounter]);

  // Execute all cells
  const executeAllCells = useCallback(async () => {
    setNotebookState(prev => ({ ...prev, isExecutingAll: true }));

    for (const cell of notebookState.cells) {
      if (cell.content.trim()) {
        await executeCell(cell.id);
      }
    }

    setNotebookState(prev => ({ ...prev, isExecutingAll: false }));
  }, [notebookState.cells, executeCell]);

  // Move cell up/down
  const moveCell = useCallback((cellId: string, direction: 'up' | 'down') => {
    setNotebookState(prev => {
      const index = prev.cells.findIndex(c => c.id === cellId);
      if (index === -1) return prev;

      const newCells = [...prev.cells];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newCells.length) return prev;

      [newCells[index], newCells[targetIndex]] = [newCells[targetIndex], newCells[index]];

      return { ...prev, cells: newCells };
    });
  }, []);

  // Clear all outputs
  const clearAllOutputs = useCallback(() => {
    setNotebookState(prev => ({
      ...prev,
      cells: prev.cells.map(cell => ({
        ...cell,
        output: undefined,
        error: undefined,
        executionCount: undefined,
      })),
      executionCounter: 0,
    }));
  }, []);

  // Select cell
  const selectCell = useCallback((cellId: string) => {
    setNotebookState(prev => ({ ...prev, selectedCellId: cellId }));
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Notebook Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
        <Button
          onClick={executeAllCells}
          disabled={notebookState.isExecutingAll}
          size="sm"
          className="flex items-center gap-1"
        >
          <Play size={16} />
          Run All
        </Button>

        <Button
          onClick={clearAllOutputs}
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
        >
          <RotateCcw size={16} />
          Clear Outputs
        </Button>

        <Button
          onClick={() => addCell()}
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
        >
          <Plus size={16} />
          Add Cell
        </Button>
      </div>

      {/* Cells Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {notebookState.cells.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Plus size={48} className="mx-auto mb-4 opacity-30" />
            <p>No cells yet. Click "Add Cell" to start coding!</p>
          </div>
        ) : (
          notebookState.cells.map((cell, index) => (
            <CodeCell
              key={cell.id}
              cell={cell}
              isSelected={notebookState.selectedCellId === cell.id}
              onExecute={executeCell}
              onDelete={deleteCell}
              onUpdate={updateCell}
              onSelect={selectCell}
              onAddAbove={(id) => addCell(id, 'above')}
              onAddBelow={(id) => addCell(id, 'below')}
              onMoveUp={index > 0 ? (id) => moveCell(id, 'up') : undefined}
              onMoveDown={index < notebookState.cells.length - 1 ? (id) => moveCell(id, 'down') : undefined}
              canMoveUp={index > 0}
              canMoveDown={index < notebookState.cells.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}