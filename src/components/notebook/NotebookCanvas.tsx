'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { Plus, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CodeCell from './CodeCell';
import DatasetSection from './DatasetSection';
import HypothesisSection from './HypothesisSection';
import InsightCard from './InsightCard';
import { useRef } from 'react';
import { Insight as GlobalInsight, Hypothesis as GlobalHypothesis, Tag as GlobalTag } from '@/types';

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
    hypotheses: GlobalHypothesis[];
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
    hypothesisTags?: string[];
  }

// Use global Hypothesis type

// Use global Tag type
  
  interface LocalInsight extends GlobalInsight {
    cellId?: string; // Which code cell this insight is attached to (local use)
    hypothesisTags?: string[]; // Array of hypothesis IDs (local use)
    plotThumbnail?: string; // Local use
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
    hypotheses: GlobalHypothesis[];
    insights: LocalInsight[];
    tags: GlobalTag[];
  }

  export default function NotebookCanvas({ projectId, onSectionsChange }: NotebookCanvasProps) {

// Get state and actions from projectStore
const {
  cells,
  dataset,
  selectedCellId,
  isExecutingAll,
  executionCounter,
  hypotheses,
  insights,
  tags,
  setCells,
  addCell: addCellToStore,
  updateCell: updateCellInStore,
  removeCell: removeCellFromStore,
  setSelectedCell,
  setDataset,
  setIsExecutingAll,
  incrementExecutionCounter,
  setHypotheses,
  addHypothesis: addHypothesisToStore,
  updateHypothesis: updateHypothesisInStore,
  removeHypothesis: removeHypothesisFromStore,
  setInsights,
  addInsight: addInsightToStore,
  updateInsight: updateInsightInStore,
  removeInsight: removeInsightFromStore,
  setTags,
  addTag: addTagToStore,
} = useProjectStore();

// Initialize default tags if empty
useEffect(() => {
  if (tags.length === 0) {
    setTags([
      { id: 'tag-1', projectId, name: 'For Review', color: '#9C27B0', createdAt: new Date().toISOString() },
      { id: 'tag-2', projectId, name: 'Explanation', color: '#4CAF50', createdAt: new Date().toISOString() },
      { id: 'tag-3', projectId, name: 'For Teacher', color: '#F44336', createdAt: new Date().toISOString() },
      { id: 'tag-4', projectId, name: 'Key Finding', color: '#2196F3', createdAt: new Date().toISOString() },
    ]);
  }
}, [tags.length, setTags, projectId]);

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

// NEW: View mode state
const [globalViewMode, setGlobalViewMode] = useState<'code' | 'text'>('code');
const [cellViewModes, setCellViewModes] = useState<Record<string, 'code' | 'text'>>({});

// Helper to get effective view mode for a cell
const getCellViewMode = (cellId: string): 'code' | 'text' => {
  return cellViewModes[cellId] || globalViewMode;
};

// Toggle global view mode
const toggleGlobalViewMode = () => {
  const newMode = globalViewMode === 'code' ? 'text' : 'code';
  setGlobalViewMode(newMode);
  // Clear individual overrides when changing global mode
  setCellViewModes({});
};

// Toggle individual cell view mode
const toggleCellViewMode = (cellId: string) => {
  setCellViewModes(prev => {
    const currentMode = getCellViewMode(cellId);
    const newMode = currentMode === 'code' ? 'text' : 'code';
    return { ...prev, [cellId]: newMode };
  });
};

// Refs to track DOM elements
const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
const notebookScrollRef = useRef<HTMLDivElement>(null);

// Collapse state for sections
const [isDatasetCollapsed, setIsDatasetCollapsed] = useState(false);
const [isHypothesesCollapsed, setIsHypothesesCollapsed] = useState(false);

// Filter state for notebook cells
const [notebookHypothesisFilter, setNotebookHypothesisFilter] = useState<string[]>([]);
const [showNotebookFilter, setShowNotebookFilter] = useState(false);

// Filter cells based on selected hypothesis filter
const filteredCells = useMemo(() => {
  if (notebookHypothesisFilter.length === 0) {
    return cells;
  }
  
  return cells.filter(cell => 
    cell.hypothesisTags?.some((tag: string) => notebookHypothesisFilter.includes(tag))
  );
}, [cells, notebookHypothesisFilter]);

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
  const baseHeight = 0.05;

  // Dataset section
  if (dataset) {
    sections.push({
      id: 'dataset',
      type: 'dataset',
      title: dataset.filename,
      color: '#9E9E9E',
      position: currentPosition,
      height: baseHeight * 2,
    });
    currentPosition += baseHeight * 2;
  }

  // Hypothesis sections
  hypotheses.forEach((hyp, index) => {
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

  // Code cells with view mode awareness
  cells.forEach((cell, index) => {
    const viewMode = getCellViewMode(cell.id);
    const cellInsights = insights.filter(i => (i as LocalInsight).cellId === cell.id);
    
    // Different rendering based on view mode
    if (viewMode === 'code') {
      // CODE VIEW: Show cell + insights separately
      sections.push({
        id: cell.id,
        type: 'analysis',
        title: cell.query || `Cell ${index + 1}`,
        color: '#2196F3', // Blue for code view
        position: currentPosition,
        height: baseHeight,
      });
      currentPosition += baseHeight;

      // Show insights as separate sections in code view
      cellInsights.forEach(insight => {
        const tag = tags.find(t => t.id === insight.tagId);
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
    } else {
      // TEXT VIEW: Show as unified section with insights count
      const insightCount = cellInsights.length;
      sections.push({
        id: cell.id,
        type: 'insight', // Mark as insight type in text view
        title: insightCount > 0 
          ? `${insightCount} Insight${insightCount !== 1 ? 's' : ''}`
          : 'No insights yet',
        color: insightCount > 0 ? '#10B981' : '#94A3B8', // Green if has insights, gray if empty
        position: currentPosition,
        height: baseHeight * (1 + insightCount * 0.6), // Taller if more insights
      });
      currentPosition += baseHeight * (1 + insightCount * 0.6);
    }
  });

  console.log('Generated minimap sections with view modes:', sections);
  if (onSectionsChange) {
    onSectionsChange(sections);
  }
}, [dataset, hypotheses, cells, insights, tags, onSectionsChange, getCellViewMode, globalViewMode, cellViewModes]);


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

    let newCells = [...cells];
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

    setCells(newCells);
    setSelectedCell(newCell.id);
  }, [cells, setCells, setSelectedCell]);

  // Delete cell
  const deleteCell = useCallback((cellId: string) => {
    const newCells = cells.filter(c => c.id !== cellId);
    let newSelectedId = selectedCellId;

    if (selectedCellId === cellId) {
      const deletedIndex = cells.findIndex(c => c.id === cellId);
      if (deletedIndex > 0) {
        newSelectedId = cells[deletedIndex - 1].id;
      } else if (newCells.length > 0) {
        newSelectedId = newCells[0].id;
      } else {
        newSelectedId = undefined;
      }
    }

    setCells(newCells);
    setSelectedCell(newSelectedId);
  }, [cells, selectedCellId, setCells, setSelectedCell]);

  // Update cell content
  const updateCell = useCallback((cellId: string, content: string) => {
    updateCellInStore(cellId, { content });
  }, [updateCellInStore]);

// Execute single cell
const executeCell = useCallback(async (cellId: string) => {
  const cell = cells.find(c => c.id === cellId);
  if (!cell || !cell.content.trim()) return;

  // Mark cell as running
  updateCellInStore(cellId, { isRunning: true, error: undefined, output: undefined });

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
    if (dataset) {
      try {
        console.log('🔍 Checking dataset availability for cell:', cellId);
        console.log('📁 Dataset filename:', dataset.filename);
        // Check if dataset variable exists in Python, if not, load it
        const datasetExists = await pyodideService.checkVariableExists('dataset');
        console.log('✅ Dataset exists in Python:', datasetExists);

        if (!datasetExists) {
          // Write file if not in filesystem
          console.log('⚠️ Dataset not found in Python, reloading...');

          try {
            await pyodideService.getDatasetVariable(dataset.filename, 'dataset');
            console.log('✅ Dataset reloaded successfully');

          } catch (err) {
            // If dataset not in filesystem, write it first
            console.log('❌ Dataset not in filesystem, writing file first...');

            await pyodideService.writeFile(dataset.filename, dataset.data);
            await pyodideService.getDatasetVariable(dataset.filename, 'dataset');
            console.log('✅ Dataset written and loaded successfully');
          }
        } else {
          console.log('✅ Dataset already available in Python');
        }
      } catch (err) {
        console.error('Error loading dataset:', err);
      }
    }
    
    // Execute the code
    const result = await pyodideService.executeCode(cell.content);
    const executionTime = Date.now() - startTime;

    // Update cell with results
    incrementExecutionCounter();
    updateCellInStore(cellId, {
      isRunning: false,
      output: result.error ? undefined : {
        text: result.output,
        plot: result.plot,
        executionTime,
      },
      error: result.error,
      executionCount: executionCounter + 1,
    });
  } catch (error: any) {
    console.error('Execution error:', error);
    updateCellInStore(cellId, {
      isRunning: false,
      error: error.message || 'Execution failed',
    });
  }
}, [cells, dataset, executionCounter, updateCellInStore, incrementExecutionCounter]);

  // Execute all cells
  const executeAllCells = useCallback(async () => {
    setIsExecutingAll(true);

    for (const cell of cells) {
      if (cell.content.trim()) {
        await executeCell(cell.id);
      }
    }

    setIsExecutingAll(false);
  }, [cells, executeCell, setIsExecutingAll]);

  // Move cell up/down
  const moveCell = useCallback((cellId: string, direction: 'up' | 'down') => {
    const index = cells.findIndex(c => c.id === cellId);
    if (index === -1) return;

    const newCells = [...cells];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCells.length) return;

    // Swap the cells
    [newCells[index], newCells[targetIndex]] = [newCells[targetIndex], newCells[index]];

    // Force re-render by creating new cell objects with updated keys
    const updatedCells = newCells.map((cell, idx) => ({
      ...cell,
      // Add a timestamp to force Monaco to remount
      _renderKey: `${cell.id}-${Date.now()}-${idx}`
    }));

    setCells(updatedCells);
  }, [cells, setCells]);

  // Clear all outputs
  const clearAllOutputs = useCallback(() => {
    const clearedCells = cells.map(cell => ({
      ...cell,
      output: undefined,
      error: undefined,
      executionCount: undefined,
    }));
    setCells(clearedCells);
    // Reset execution counter
    useProjectStore.setState({ executionCounter: 0 });
  }, [cells, setCells]);

  // Select cell
// Select cell
const selectCell = useCallback((cellId: string) => {
  setSelectedCell(cellId);
  
  // Scroll to the cell and highlight it
  const cellElement = cellRefs.current.get(cellId);
  if (cellElement) {
    cellElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedCellId(cellId);
    
    // Clear highlight after 2 seconds
    setTimeout(() => {
      setHighlightedCellId(null);
    }, 2000);
  }
}, [setSelectedCell]);

// Handle dataset upload
const handleDatasetUpload = useCallback((filename: string, data: string, summary: any) => {
  setDataset({ filename, data, summary });
}, [setDataset]);
  
// Handle dataset removal
const handleDatasetRemove = useCallback(async () => {
  if (!dataset) return;

  try {
    // Remove from Pyodide if loaded
    const { pyodideService } = await import('@/lib/services/pyodideService');
    if (pyodideService.isReady()) {
      await pyodideService.removeDataset(dataset.filename, 'dataset');
    }

    // Remove from state
    setDataset(null);
  } catch (error) {
    console.error('Error removing dataset:', error);
    // Still remove from state even if cleanup fails
    setDataset(null);
  }
}, [dataset, setDataset]);

  // Handle hypotheses change
  const handleHypothesesChange = useCallback((newHypotheses: GlobalHypothesis[]) => {
    setHypotheses(newHypotheses);
  }, [setHypotheses]);

// Handle AI code generation
const handleGenerateCode = useCallback(async (cellId: string, query: string) => {
  // Mark cell as generating
  updateCellInStore(cellId, { isGenerating: true, query });

  try {
    const response = await fetch('/api/generate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        datasetInfo: dataset?.summary,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate code');
    }

    const data = await response.json();

    // Update cell with generated code
    updateCellInStore(cellId, {
      content: data.code,
      query,
      isGenerating: false,
    });
  } catch (error: any) {
    console.error('Code generation error:', error);
    // Update cell with error
    updateCellInStore(cellId, {
      isGenerating: false,
      error: error.message || 'Failed to generate code',
    });
  }
}, [dataset, updateCellInStore]);

  // Handle updating hypothesis tags for a cell
  const handleUpdateCellHypothesisTags = useCallback((cellId: string, tags: string[]) => {
    updateCellInStore(cellId, { hypothesisTags: tags });
  }, [updateCellInStore]);

// Handle adding insight
const handleAddInsight = useCallback((cellId: string, content: string, tagId: string, hypothesisTags?: string[]) => {
  const newInsight: LocalInsight = {
    id: `insight-${Date.now()}`,
    projectId,
    analysisOutputId: '', // Will be set when linked to analysis output
    tagId,
    content,
    position: insights.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cellId,
    hypothesisTags: hypothesisTags || [],
  };

  addInsightToStore(newInsight);
}, [addInsightToStore, projectId, insights.length]);


  // Handle deleting insight
  const handleDeleteInsight = useCallback((insightId: string) => {
    removeInsightFromStore(insightId);
  }, [removeInsightFromStore]);
  
// Handle updating insight
const handleUpdateInsight = useCallback((insightId: string, content: string, tagId: string, hypothesisTags?: string[]) => {
  updateInsightInStore(insightId, { 
    content, 
    tagId, 
    updatedAt: new Date().toISOString(),
    // Store hypothesisTags in a local property since it's not part of the global type
    ...(hypothesisTags && { hypothesisTags: hypothesisTags })
  });
}, [updateInsightInStore]);
  
  // Handle adding new tag
  const handleAddTag = useCallback((name: string, color: string) => {
    const newTag: GlobalTag = {
      id: `tag-${Date.now()}`,
      projectId,
      name,
      color,
      createdAt: new Date().toISOString(),
    };
  
    addTagToStore(newTag);
  
    return newTag.id;
  }, [addTagToStore, projectId]);

// Handle opening insight - create blank insight in edit mode in panel
const handleOpenInsightModal = useCallback((cellId: string) => {
  const cell = cells.find(c => c.id === cellId);
  const plotThumbnail = cell?.output?.plot || undefined;

  const newInsight: LocalInsight = {
    id: `insight-${Date.now()}`,
    projectId,
    analysisOutputId: '', // Will be set when linked to analysis output
    tagId: '', // Empty tagId means it's in "new/edit" mode
    content: '',
    position: insights.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cellId,
    hypothesisTags: [],
    plotThumbnail,
  };
  
  // Use the store action instead
  addInsightToStore(newInsight);
}, [cells, addInsightToStore, projectId, insights.length]);
  
  // Handle closing insight modal
  const handleCloseInsightModal = useCallback(() => {
    setInsightModal({ isOpen: false, cellId: null });
  }, []);

// Handle saving insight from modal
const handleSaveInsight = useCallback((content: string, tagId: string, hypothesisTags: string[]) => {
  if (insightModal.cellId) {
    const cell = cells.find(c => c.id === insightModal.cellId);
    const plotThumbnail = cell?.output?.plot || undefined;
    
    const newInsight: LocalInsight = {
      id: `insight-${Date.now()}`,
      projectId,
      analysisOutputId: '', // Will be set when linked to analysis output
      tagId,
      content,
      position: insights.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cellId: insightModal.cellId,
      hypothesisTags,
      plotThumbnail,
    };
  
    addInsightToStore(newInsight);
    handleCloseInsightModal();
  }
}, [insightModal.cellId, cells, addInsightToStore, handleCloseInsightModal, projectId, insights.length]);

  // Listen for minimap section clicks
  useEffect(() => {
    const handleHighlight = (e: CustomEvent) => {
      const { sectionId } = e.detail;
      
      // Check if it's a cell
      const cell = cells.find(c => c.id === sectionId);
      if (cell) {
        selectCell(cell.id);
        return;
      }
      
      // Check if it's an insight
      const insight = insights.find(i => i.id === sectionId);
      if (insight) {
        setHighlightedInsightId(insight.id);
        setTimeout(() => setHighlightedInsightId(null), 2000);
      }
    };
    
    window.addEventListener('highlight-section', handleHighlight as EventListener);
    return () => window.removeEventListener('highlight-section', handleHighlight as EventListener);
  }, [cells, insights, selectCell]);
  

  return (
<div className="h-full flex flex-col bg-gray-50">
{/* Notebook Toolbar */}
<div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
  <Button
    onClick={executeAllCells}
    disabled={isExecutingAll}
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

  {/* NEW: View Mode Toggle */}
  <div className="ml-auto flex items-center gap-2">
    <span className="text-xs text-gray-600">View:</span>
    <div className="flex items-center bg-gray-100 rounded-md p-0.5">
      <button
        onClick={toggleGlobalViewMode}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          globalViewMode === 'code'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Code View
      </button>
      <button
        onClick={toggleGlobalViewMode}
        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
          globalViewMode === 'text'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Text View
      </button>
    </div>
  </div>
</div>

{/* Notebook Content - Full Width */}
<div 
  ref={notebookScrollRef} 
  className="flex-1 overflow-y-auto overflow-x-hidden p-4"
>

{/* Dataset Upload Section */}
<div id="section-dataset" className="mb-4">
  <button
    onClick={() => setIsDatasetCollapsed(!isDatasetCollapsed)}
    className="w-full flex items-center justify-between p-2 bg-gray-100 hover:bg-gray-200 rounded-t border border-gray-300 transition-colors"
  >
    <span className="text-sm font-semibold text-gray-700">
      Dataset {dataset && `- ${dataset.filename}`}
    </span>
    <span className="text-gray-600">
      {isDatasetCollapsed ? '▼' : '▲'}
    </span>
  </button>
  {!isDatasetCollapsed && (
    <div className="border border-t-0 border-gray-300 rounded-b">
      <DatasetSection
        dataset={dataset}
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
      Research Hypotheses {hypotheses.length > 0 && `(${hypotheses.length})`}
    </span>
    <span className="text-purple-700">
      {isHypothesesCollapsed ? '▼' : '▲'}
    </span>
  </button>
  {!isHypothesesCollapsed && (
    <div className="border border-t-0 border-purple-300 rounded-b">
      <HypothesisSection
        hypotheses={hypotheses}
        onHypothesesChange={handleHypothesesChange}
      />
    </div>
  )}
</div>

{/* Hypothesis Filter for Notebook */}
{hypotheses.length > 0 && (
  <div className="mb-4 bg-white border border-gray-300 rounded-lg p-3">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-700">Filter Code Cells</h3>
      <button
        onClick={() => setShowNotebookFilter(!showNotebookFilter)}
        className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Filter by Hypothesis
        {notebookHypothesisFilter.length > 0 && (
          <span className="bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
            {notebookHypothesisFilter.length}
          </span>
        )}
      </button>
    </div>

    {showNotebookFilter && (
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded relative">
        {/* Close button */}
        <button
          onClick={() => setShowNotebookFilter(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          title="Close filter"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <p className="text-xs font-semibold text-gray-600 mb-2">Show cells linked to:</p>
        <div className="space-y-1">
          {hypotheses.map((hyp, index) => (
            <label key={hyp.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white p-1 rounded">
              <input
                type="checkbox"
                checked={notebookHypothesisFilter.includes(hyp.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setNotebookHypothesisFilter(prev => [...prev, hyp.id]);
                  } else {
                    setNotebookHypothesisFilter(prev => prev.filter(id => id !== hyp.id));
                  }
                }}
                className="rounded"
              />
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white bg-purple-600">
                H{index + 1}
              </span>
              <span className="flex-1 truncate">{hyp.content.slice(0, 40)}...</span>
            </label>
          ))}
        </div>

        {notebookHypothesisFilter.length > 0 && (
          <button
            onClick={() => setNotebookHypothesisFilter([])}
            className="mt-2 w-full text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Clear Filter
          </button>
        )}
      </div>
    )}

    {notebookHypothesisFilter.length > 0 && (
      <p className="text-xs text-gray-500 mt-2">
        Showing {filteredCells.length} of {cells.length} code cells
      </p>
    )}
  </div>
)}

{cells.length === 0 ? (
  <div className="text-center py-20 text-gray-500">
    <Plus size={48} className="mx-auto mb-4 opacity-30" />
    <p>No cells yet. Click "Add Cell" to start coding!</p>
  </div>
) : filteredCells.length === 0 ? (
  <div className="text-center py-20 text-gray-500">
    <p>No cells match the selected hypothesis filter.</p>
    <button
      onClick={() => setNotebookHypothesisFilter([])}
      className="mt-2 text-sm text-blue-600 hover:underline"
    >
      Clear filter to see all cells
    </button>
  </div>
) : (
  filteredCells.map((cell, index) => (
        <div 
          key={`${cell.id}-${index}`}
          id={`section-${cell.id}`}
          ref={(el) => {
            if (el) cellRefs.current.set(cell.id, el);
          }}
        >
<CodeCell
  cell={cell}
  isSelected={selectedCellId === cell.id}
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
  hypotheses={hypotheses}
  insights={insights}
  tags={tags}
  onUpdateInsight={handleUpdateInsight}
  onDeleteInsight={handleDeleteInsight}
  onAddTag={handleAddTag}
  canMoveUp={index > 0}
  canMoveDown={index < filteredCells.length - 1}
  datasetInfo={dataset?.summary}
  viewMode={getCellViewMode(cell.id)}
  onToggleViewMode={() => toggleCellViewMode(cell.id)}
  cellInsights={insights.filter(i => (i as LocalInsight).cellId === cell.id)}
/>
        </div>
      ))
    )}
    </div> 
  </div>
    );
  }