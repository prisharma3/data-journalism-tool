'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CodeCell from './CodeCell';
import DatasetSection from './DatasetSection';
import HypothesisSection from './HypothesisSection';
import InsightCard from './InsightCard';
import { useRef } from 'react';

interface NotebookCanvasProps {
    projectId: string;
    onSectionsChange?: (sections: MinimapSection[]) => void;
  }
  
  export interface MinimapSection {
    id: string;
    type: 'dataset' | 'hypothesis' | 'analysis' | 'insight';
    title: string;
    color: string;
    position: number;
    height: number;
  }

interface NotebookState {
    cells: CodeCellType[];
    selectedCellId?: string;
    isExecutingAll: boolean;
    executionCounter: number;
    dataset: {
      filename: string;
      data: string;
      hypothesisTags?: string[]; // Array of hypothesis IDs
      summary?: {
        rows: number;
        columns: number;
        columnNames: string[];
        columnTypes: Record<string, string>;
      };
    } | null;
    hypotheses: Hypothesis[];
  }



  interface CodeCellType {
    id: string;
    type: 'code';
    content: string;
    query?: string; // Natural language query
    output?: {
      text?: string;
      plot?: string;
      executionTime?: number;
    };
    error?: string;
    executionCount?: number;
    isRunning?: boolean;
    isGenerating?: boolean;
  }

interface Hypothesis {
    id: string;
    content: string;
    createdAt: Date;
  }

  interface Tag {
    id: string;
    name: string;
    color: string;
  }
  
  interface Insight {
    id: string;
    cellId: string; // Which code cell this insight is attached to
    content: string;
    tagId: string;
    hypothesisTags?: string[]; // Array of hypothesis IDs
    createdAt: Date;
  }

  interface NotebookState {
    cells: CodeCellType[];
    selectedCellId?: string;
    isExecutingAll: boolean;
    executionCounter: number;
    dataset: {
      filename: string;
      data: string;
      hypothesisTags?: string[]; // Array of hypothesis IDs
      summary?: {
        rows: number;
        columns: number;
        columnNames: string[];
        columnTypes: Record<string, string>;
      };
    } | null;
    hypotheses: Hypothesis[];
    insights: Insight[];
    tags: Tag[];
  }

  export default function NotebookCanvas({ projectId, onSectionsChange }: NotebookCanvasProps) {

    const [notebookState, setNotebookState] = useState<NotebookState>({
        cells: [],
        selectedCellId: undefined,
        isExecutingAll: false,
        executionCounter: 0,
        dataset: null,
        hypotheses: [],
        insights: [],
        tags: [
          { id: 'tag-1', name: 'For Review', color: '#9C27B0' },
          { id: 'tag-2', name: 'Explanation', color: '#4CAF50' },
          { id: 'tag-3', name: 'For Teacher', color: '#F44336' },
          { id: 'tag-4', name: 'Key Finding', color: '#2196F3' },
        ],
      });

      const [insightModal, setInsightModal] = useState<{
        isOpen: boolean;
        cellId: string | null;
      }>({
        isOpen: false,
        cellId: null,
      });

// Highlight and scroll state
const [highlightedCellId, setHighlightedCellId] = useState<string | null>(null);
const [highlightedInsightId, setHighlightedInsightId] = useState<string | null>(null);

// Refs to track DOM elements
const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
const insightRefs = useRef<Map<string, HTMLDivElement>>(new Map());
const notebookScrollRef = useRef<HTMLDivElement>(null);
const insightsScrollRef = useRef<HTMLDivElement>(null);

// Collapse state for sections
const [isDatasetCollapsed, setIsDatasetCollapsed] = useState(false);
const [isHypothesesCollapsed, setIsHypothesesCollapsed] = useState(false);

  // Add this helper function to scroll to a cell
const scrollToCell = useCallback((cellId: string) => {
    const cellElement = cellRefs.current.get(cellId);
    if (cellElement) {
      cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedCellId(cellId);
      // Clear highlight after 2 seconds
      setTimeout(() => setHighlightedCellId(null), 2000);
    }
  }, []);
  
// Scroll to and highlight a code cell when insight is clicked
const handleInsightClick = useCallback((insightId: string, cellId: string) => {
    const cellElement = cellRefs.current.get(cellId);
    if (cellElement && notebookScrollRef.current) {
      cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedCellId(cellId);
      setHighlightedInsightId(insightId);
      
      // Clear highlights after 2 seconds
      setTimeout(() => {
        setHighlightedCellId(null);
        setHighlightedInsightId(null);
      }, 2000);
    }
  }, []);

  // Generate minimap sections whenever notebook state changes
useEffect(() => {
    if (!onSectionsChange) return;
  
    const sections: MinimapSection[] = [];
    let currentPosition = 0;
    const baseHeight = 0.05; // Base height for each section
  
    // Dataset section
    if (notebookState.dataset) {
      sections.push({
        id: 'dataset',
        type: 'dataset',
        title: notebookState.dataset.filename,
        color: '#9E9E9E',
        position: currentPosition,
        height: baseHeight * 2,
      });
      currentPosition += baseHeight * 2;
    }
  
    // Hypothesis sections
    notebookState.hypotheses.forEach((hyp, index) => {
      sections.push({
        id: hyp.id,
        type: 'hypothesis',
        title: `H${index + 1}: ${hyp.content.substring(0, 30)}...`,
        color: '#9C27B0',
        position: currentPosition,
        height: baseHeight * 1.5,
      });
      currentPosition += baseHeight * 1.5;
    });
  
    // Code cells and insights
    notebookState.cells.forEach((cell, index) => {
      // Analysis section
      sections.push({
        id: cell.id,
        type: 'analysis',
        title: cell.query || `Cell ${index + 1}`,
        color: '#2196F3',
        position: currentPosition,
        height: baseHeight,
      });
      currentPosition += baseHeight;
  
      // Insights for this cell
      const cellInsights = notebookState.insights.filter(i => i.cellId === cell.id);
      cellInsights.forEach(insight => {
        const tag = notebookState.tags.find(t => t.id === insight.tagId);
        sections.push({
          id: insight.id,
          type: 'insight',
          title: insight.content.substring(0, 30) + '...',
          color: tag?.color || '#4CAF50',
          position: currentPosition,
          height: baseHeight * 0.8,
        });
        currentPosition += baseHeight * 0.8;
      });
    });
  
    console.log('Generated minimap sections:', sections);
    if (onSectionsChange) {
      onSectionsChange(sections);
    }
}, [notebookState.dataset, notebookState.hypotheses, notebookState.cells, notebookState.insights, notebookState.tags]);

  // Load cells from API or store
  useEffect(() => {
    // TODO: Fetch cells from API based on projectId
    // fetchNotebookCells(projectId);
  }, [projectId]);

  // Preload Pyodide on component mount
useEffect(() => {
    const preloadPyodide = async () => {
      try {
        const { pyodideService } = await import('@/lib/services/pyodideService');
        console.log('Preloading Pyodide...');
        await pyodideService.loadPyodide();
        console.log('Pyodide ready!');
      } catch (error) {
        console.error('Failed to preload Pyodide:', error);
      }
    };
    
    preloadPyodide();
  }, []);

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
        c.id === cellId ? { ...c, isRunning: true, error: undefined, output: undefined } : c
      ),
    }));
  
    try {
      const startTime = Date.now();
      
      // Dynamically import and execute with Pyodide
      const { pyodideService } = await import('@/lib/services/pyodideService');
      
      // Load Pyodide if not already loaded
      if (!pyodideService.isReady()) {
        console.log('Loading Pyodide for the first time...');
        await pyodideService.loadPyodide();
      }
      
// Load dataset if available
if (notebookState.dataset) {
    try {
      // Check if dataset variable exists in Python, if not, load it
      const datasetExists = await pyodideService.checkVariableExists('dataset');
      if (!datasetExists) {
        // Write file if not in filesystem
        try {
          await pyodideService.getDatasetVariable(notebookState.dataset.filename, 'dataset');
        } catch (err) {
          // If dataset not in filesystem, write it first
          await pyodideService.writeFile(notebookState.dataset.filename, notebookState.dataset.data);
          await pyodideService.getDatasetVariable(notebookState.dataset.filename, 'dataset');
        }
      }
    } catch (err) {
      console.error('Error loading dataset:', err);
    }
  }
      
      // Execute the code
      const result = await pyodideService.executeCode(cell.content);
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
                output: result.error ? undefined : {
                  text: result.output,
                  plot: result.plot,
                  executionTime,
                },
                error: result.error,
                executionCount: prev.executionCounter + 1,
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Execution error:', error);
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
  }, [notebookState.cells, notebookState.executionCounter, notebookState.dataset]);

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
  
      // Swap the cells
      [newCells[index], newCells[targetIndex]] = [newCells[targetIndex], newCells[index]];
  
      // Force re-render by creating new cell objects with updated keys
      const updatedCells = newCells.map((cell, idx) => ({
        ...cell,
        // Add a timestamp to force Monaco to remount
        _renderKey: `${cell.id}-${Date.now()}-${idx}`
      }));
  
      return { ...prev, cells: updatedCells };
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
    setNotebookState(prev => ({
      ...prev,
      selectedCellId: cellId,
    }));
    
    // Find insights for this cell and scroll to them
    const cellInsights = notebookState.insights.filter(i => i.cellId === cellId);
    if (cellInsights.length > 0 && insightsScrollRef.current) {
      const firstInsight = cellInsights[0];
      const insightElement = insightRefs.current.get(firstInsight.id);
      
      if (insightElement) {
        insightElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setHighlightedInsightId(firstInsight.id);
        setHighlightedCellId(cellId);
        
        setTimeout(() => {
          setHighlightedCellId(null);
          setHighlightedInsightId(null);
        }, 2000);
      }
    }
  }, [notebookState.insights]);

// Handle dataset upload
const handleDatasetUpload = useCallback((filename: string, data: string, summary: any) => {
    setNotebookState(prev => ({
      ...prev,
      dataset: { filename, data, summary },
    }));
  }, []);
  
// Handle dataset removal
const handleDatasetRemove = useCallback(async () => {
    if (!notebookState.dataset) return;
  
    try {
      // Remove from Pyodide if loaded
      const { pyodideService } = await import('@/lib/services/pyodideService');
      if (pyodideService.isReady()) {
        await pyodideService.removeDataset(notebookState.dataset.filename, 'dataset');
      }
  
      // Remove from state
      setNotebookState(prev => ({
        ...prev,
        dataset: null,
      }));
    } catch (error) {
      console.error('Error removing dataset:', error);
      // Still remove from state even if cleanup fails
      setNotebookState(prev => ({
        ...prev,
        dataset: null,
      }));
    }
  }, [notebookState.dataset]);

  // Handle hypotheses change
const handleHypothesesChange = useCallback((hypotheses: Hypothesis[]) => {
    setNotebookState(prev => ({
      ...prev,
      hypotheses,
    }));
  }, []);

// Handle AI code generation
const handleGenerateCode = useCallback(async (cellId: string, query: string) => {
    // Mark cell as generating
    setNotebookState(prev => ({
      ...prev,
      cells: prev.cells.map(c =>
        c.id === cellId ? { ...c, isGenerating: true, query } : c
      ),
    }));
  
    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          datasetInfo: notebookState.dataset?.summary,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }
  
      const data = await response.json();
  
      // Update cell with generated code
      setNotebookState(prev => ({
        ...prev,
        cells: prev.cells.map(c =>
          c.id === cellId
            ? {
                ...c,
                content: data.code,
                query,
                isGenerating: false,
              }
            : c
        ),
      }));
    } catch (error: any) {
      console.error('Code generation error:', error);
      // Update cell with error
      setNotebookState(prev => ({
        ...prev,
        cells: prev.cells.map(c =>
          c.id === cellId
            ? {
                ...c,
                isGenerating: false,
                error: error.message || 'Failed to generate code',
              }
            : c
        ),
      }));
    }
  }, [notebookState.dataset]);

  // Handle updating hypothesis tags for a cell
const handleUpdateCellHypothesisTags = useCallback((cellId: string, tags: string[]) => {
    setNotebookState(prev => ({
      ...prev,
      cells: prev.cells.map(c =>
        c.id === cellId ? { ...c, hypothesisTags: tags } : c
      ),
    }));
  }, []);

// Handle adding insight
const handleAddInsight = useCallback((cellId: string, content: string, tagId: string, hypothesisTags?: string[]) => {
    const newInsight: Insight = {
      id: `insight-${Date.now()}`,
      cellId,
      content,
      tagId,
      hypothesisTags: hypothesisTags || [],
      createdAt: new Date(),
    };
  
    setNotebookState(prev => ({
      ...prev,
      insights: [...prev.insights, newInsight],
    }));
  }, []);
  
  // Handle deleting insight
  const handleDeleteInsight = useCallback((insightId: string) => {
    setNotebookState(prev => ({
      ...prev,
      insights: prev.insights.filter(i => i.id !== insightId),
    }));
  }, []);
  
// Handle updating insight
const handleUpdateInsight = useCallback((insightId: string, content: string, tagId: string, hypothesisTags?: string[]) => {
    setNotebookState(prev => ({
      ...prev,
      insights: prev.insights.map(i =>
        i.id === insightId ? { ...i, content, tagId, hypothesisTags: hypothesisTags || [] } : i
      ),
    }));
  }, []);
  
  // Handle adding new tag
  const handleAddTag = useCallback((name: string, color: string) => {
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name,
      color,
    };
  
    setNotebookState(prev => ({
      ...prev,
      tags: [...prev.tags, newTag],
    }));
  
    return newTag.id;
  }, []);

// Handle opening insight - create blank insight in edit mode in panel
const handleOpenInsightModal = useCallback((cellId: string) => {
    const newInsight: Insight = {
      id: `insight-${Date.now()}`,
      cellId,
      content: '',
      tagId: '', // Empty tagId means it's in "new/edit" mode
      hypothesisTags: [],
      createdAt: new Date(),
    };
    
    setNotebookState(prev => ({
      ...prev,
      insights: [newInsight, ...prev.insights], // Add at the beginning
    }));
  }, []);
  
  // Handle closing insight modal
  const handleCloseInsightModal = useCallback(() => {
    setInsightModal({ isOpen: false, cellId: null });
  }, []);

// Handle saving insight from modal
const handleSaveInsight = useCallback((content: string, tagId: string, hypothesisTags: string[]) => {
    if (insightModal.cellId) {
      // Create insight with hypothesis tags
      const newInsight: Insight = {
        id: `insight-${Date.now()}`,
        cellId: insightModal.cellId,
        content,
        tagId,
        hypothesisTags,
        createdAt: new Date(),
      };
    
      setNotebookState(prev => ({
        ...prev,
        insights: [...prev.insights, newInsight],
      }));
      
      handleCloseInsightModal();
    }
  }, [insightModal.cellId, handleCloseInsightModal]);

  // Listen for minimap section clicks
useEffect(() => {
    const handleHighlight = (e: CustomEvent) => {
      const { sectionId } = e.detail;
      
      // Check if it's a cell
      const cell = notebookState.cells.find(c => c.id === sectionId);
      if (cell) {
        selectCell(cell.id);
        return;
      }
      
      // Check if it's an insight
      const insight = notebookState.insights.find(i => i.id === sectionId);
      if (insight) {
        setHighlightedInsightId(insight.id);
        setTimeout(() => setHighlightedInsightId(null), 2000);
      }
    };
    
    window.addEventListener('highlight-section', handleHighlight as EventListener);
    return () => window.removeEventListener('highlight-section', handleHighlight as EventListener);
  }, [notebookState.cells, notebookState.insights, selectCell]);

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

{/* Two Column Layout: Notebook + Insights */}
<div className="flex-1 flex overflow-hidden">
{/* Left Column: Notebook Content */}
<div ref={notebookScrollRef} className="flex-1 overflow-y-auto p-4">

{/* Dataset Upload Section */}
<div id="section-dataset" className="mb-4">
  <button
    onClick={() => setIsDatasetCollapsed(!isDatasetCollapsed)}
    className="w-full flex items-center justify-between p-2 bg-gray-100 hover:bg-gray-200 rounded-t border border-gray-300 transition-colors"
  >
    <span className="text-sm font-semibold text-gray-700">
      Dataset {notebookState.dataset && `- ${notebookState.dataset.filename}`}
    </span>
    <span className="text-gray-600">
      {isDatasetCollapsed ? '▼' : '▲'}
    </span>
  </button>
  {!isDatasetCollapsed && (
    <div className="border border-t-0 border-gray-300 rounded-b">
      <DatasetSection
        dataset={notebookState.dataset}
        onDatasetUpload={handleDatasetUpload}
        onDatasetRemove={handleDatasetRemove}
      />
    </div>
  )}
</div>

{/* Hypothesis Section */}
<div id="section-hypotheses" className="mb-4">
  <button
    onClick={() => setIsHypothesesCollapsed(!isHypothesesCollapsed)}
    className="w-full flex items-center justify-between p-2 bg-purple-100 hover:bg-purple-200 rounded-t border border-purple-300 transition-colors"
  >
    <span className="text-sm font-semibold text-purple-700">
      Research Hypotheses {notebookState.hypotheses.length > 0 && `(${notebookState.hypotheses.length})`}
    </span>
    <span className="text-purple-700">
      {isHypothesesCollapsed ? '▼' : '▲'}
    </span>
  </button>
  {!isHypothesesCollapsed && (
    <div className="border border-t-0 border-purple-300 rounded-b">
      <HypothesisSection
        hypotheses={notebookState.hypotheses}
        onHypothesesChange={handleHypothesesChange}
      />
    </div>
  )}
</div>

{notebookState.cells.length === 0 ? (
  <div className="text-center py-20 text-gray-500">
    <Plus size={48} className="mx-auto mb-4 opacity-30" />
    <p>No cells yet. Click "Add Cell" to start coding!</p>
  </div>
) : (
    notebookState.cells.map((cell, index) => (
        <div 
          key={`${cell.id}-${index}`}
          id={`section-${cell.id}`}
          ref={(el) => {
            if (el) cellRefs.current.set(cell.id, el);
          }}
        >
          <CodeCell
            cell={cell}
            isSelected={notebookState.selectedCellId === cell.id}
            isHighlighted={highlightedCellId === cell.id}
            onExecute={executeCell}
            onDelete={deleteCell}
            onUpdate={updateCell}
            onSelect={selectCell}
            onAddAbove={(id) => addCell(id, 'above')}
            onAddBelow={(id) => addCell(id, 'below')}
            onMoveUp={(id) => moveCell(id, 'up')}
            onMoveDown={(id) => moveCell(id, 'down')}
            onGenerateCode={handleGenerateCode}
            onAddInsight={handleOpenInsightModal}
            onUpdateHypothesisTags={handleUpdateCellHypothesisTags}
            hypotheses={notebookState.hypotheses}
            canMoveUp={index > 0}
            canMoveDown={index < notebookState.cells.length - 1}
            datasetInfo={notebookState.dataset?.summary}
          />
        </div>
      ))
)}
  </div>

{/* Right Column: Insights Margin */}
<div 
ref={insightsScrollRef}
className="bg-gray-100 border-l border-gray-300 overflow-y-auto p-4"
style={{ width: '400px', minWidth: '350px', flexShrink: 0 }}
>
        <div className="sticky top-0 mb-4 pb-2 bg-gray-100 z-10 border-b border-gray-300">
          <h3 className="text-sm font-semibold text-gray-700">Insights</h3>
          <p className="text-xs text-gray-500 mt-1">
            {notebookState.insights.length} insight{notebookState.insights.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Insights List */}
        <div className="space-y-3">
        {notebookState.insights.length === 0 ? (
  <p className="text-sm text-gray-500 text-center py-8">
    No insights yet. Run code and click "+ Add Insight" to create insights.
  </p>
) : (
    notebookState.insights.map(insight => {
        const tag = notebookState.tags.find(t => t.id === insight.tagId);
        
        return (
          <div
            key={insight.id}
            id={`section-${insight.id}`}
            ref={(el) => {
              if (el) insightRefs.current.set(insight.id, el);
            }}
          >
            <InsightCard
              insight={insight}
              tag={tag}
              onUpdate={handleUpdateInsight}
              onDelete={handleDeleteInsight}
              onAddTag={handleAddTag}
              onClick={() => handleInsightClick(insight.id, insight.cellId)}
              isHighlighted={highlightedInsightId === insight.id}
              allTags={notebookState.tags}
              hypotheses={notebookState.hypotheses}
            />
          </div>
        );
      })
)}
        </div>
      </div>
</div>
</div>
);
}