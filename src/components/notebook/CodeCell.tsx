'use client';

import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Trash2, Plus, ChevronUp, ChevronDown, Check, X, Loader, Sparkles, Edit2 } from 'lucide-react';
import HypothesisTagSelector from './HypothesisTagSelector';

interface CodeCellProps {
    cell: {
      id: string;
      type: 'code';
      content: string;
      query?: string;
      hypothesisTags?: string[];
      output?: {
        text?: string;
        plot?: string;
        executionTime?: number;
      };
      error?: string;
      executionCount?: number;
      isRunning?: boolean;
      isGenerating?: boolean;
    };
    isSelected: boolean;
    isHighlighted?: boolean; // ADD THIS LINE
    onExecute: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, content: string) => void;
    onSelect: (id: string) => void;
    onAddBelow: (id: string) => void;
    onAddAbove: (id: string) => void;
    onMoveUp?: (id: string) => void;
    onMoveDown?: (id: string) => void;
    onGenerateCode?: (id: string, query: string) => void;
    onAddInsight?: (cellId: string) => void;
    onUpdateHypothesisTags?: (cellId: string, tags: string[]) => void;
    hypotheses?: Array<{ id: string; content: string; createdAt: Date }>;
    canMoveUp: boolean;
    canMoveDown: boolean;
    datasetInfo?: any;
  }

  export default function CodeCell({
    cell,
    isSelected,
    isHighlighted = false, // ADD THIS LINE
    onExecute,
    onDelete,
    onUpdate,
    onSelect,
    onAddBelow,
    onAddAbove,
    onMoveUp,
    onMoveDown,
    onGenerateCode,
    onAddInsight,
    onUpdateHypothesisTags,
    hypotheses,
    insights = [], // ADD THIS
    tags = [], // ADD THIS
    onUpdateInsight, // ADD THIS
    onDeleteInsight, // ADD THIS
    onAddTag, // ADD THIS
    canMoveUp,
    canMoveDown,
    datasetInfo,
  }: CodeCellProps) {
    const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
    const [isCellCollapsed, setIsCellCollapsed] = useState(false);
    
  const [isHovered, setIsHovered] = useState(false);
  const [showQueryInput, setShowQueryInput] = useState(!cell.content && !cell.query);
  const [queryText, setQueryText] = useState(cell.query || '');
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      onExecute(cell.id);
    } else if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onExecute(cell.id);
    }
  };

  const handleQueryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateCode();
    }
  };

  const handleGenerateCode = () => {
    if (queryText.trim() && onGenerateCode) {
      onGenerateCode(cell.id, queryText.trim());
      setShowQueryInput(false);
    }
  };

  const handleEditQuery = () => {
    setShowQueryInput(true);
    setQueryText(cell.query || '');
  };

  return (
<div
  className="code-cell mb-2 bg-white rounded border transition-all"
  onClick={() => onSelect(cell.id)}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  style={{
    borderWidth: isSelected ? '2px' : '1px',
    borderColor: isHighlighted ? '#fbbf24' : (isSelected ? '#007acc' : '#e0e0e0'),
    backgroundColor: isHighlighted ? '#fef3c7' : 'white',
    boxShadow: isHighlighted ? '0 0 0 3px rgba(251, 191, 36, 0.3)' : 'none',
  }}
>
{/* Cell Toolbar */}
<div
  className="flex items-center justify-between px-2 py-1 bg-gray-50 border-b border-gray-200 transition-opacity"
  style={{
    opacity: isHovered || isSelected ? 1 : 0.3,
  }}
>
  <div className="flex items-center gap-2">
    {/* Execution Count */}
    <div className="min-w-[40px] text-xs text-gray-600 font-mono">
      {cell.executionCount ? `[${cell.executionCount}]:` : '[ ]:'}
    </div>

    {/* Execution Status */}
    {cell.isRunning && <Loader size={14} className="animate-spin text-blue-500" />}
    {cell.isGenerating && <Loader size={14} className="animate-spin text-purple-500" />}
    {cell.output && !cell.isRunning && !cell.error && <Check size={14} className="text-green-500" />}
    {cell.error && <X size={14} className="text-red-500" />}
  </div>

  {/* Action Buttons */}
  <div className="flex gap-1">
    {/* Collapse Buttons */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsOutputCollapsed(!isOutputCollapsed);
      }}
      className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 flex items-center gap-1"
      title={isOutputCollapsed ? "Show output" : "Hide output"}
    >
      {isOutputCollapsed ? '▶' : '▼'} Output
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsCellCollapsed(!isCellCollapsed);
        if (!isCellCollapsed) {
          setIsOutputCollapsed(false);
        }
      }}
      className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 flex items-center gap-1"
      title={isCellCollapsed ? "Expand cell" : "Collapse cell"}
    >
      {isCellCollapsed ? '▶' : '▼'} Code
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        onExecute(cell.id);
      }}
      title="Run Cell (Shift+Enter)"
      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center"
      disabled={cell.isRunning || cell.isGenerating}
    >
      <Play size={12} />
    </button>

    {cell.query && !showQueryInput && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEditQuery();
        }}
        title="Edit Query"
        className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 flex items-center"
        disabled={cell.isGenerating}
      >
        <Edit2 size={12} />
      </button>
    )}

    <button
      onClick={(e) => {
        e.stopPropagation();
        onAddAbove(cell.id);
      }}
      title="Add Cell Above"
      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
    >
      <Plus size={12} />↑
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        onAddBelow(cell.id);
      }}
      title="Add Cell Below"
      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
    >
      <Plus size={12} />↓
    </button>

    {canMoveUp && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveUp?.(cell.id);
        }}
        title="Move Up"
        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
      >
        <ChevronUp size={12} />
      </button>
    )}

    {canMoveDown && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMoveDown?.(cell.id);
        }}
        title="Move Down"
        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
      >
        <ChevronDown size={12} />
      </button>
    )}

    <button
      onClick={(e) => {
        e.stopPropagation();
        if (window.confirm('Delete this cell?')) {
          onDelete(cell.id);
        }
      }}
      title="Delete Cell"
      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
    >
      <Trash2 size={12} />
    </button>
  </div>
</div>

      {/* Query Input (shown when cell is new or editing query) */}
      {showQueryInput && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-blue-600 mt-2 flex-shrink-0" />
            <div className="flex-1">
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={handleQueryKeyDown}
                placeholder="Describe what you want to analyze... (e.g., 'Show distribution of sepal length')"
                className="w-full p-2 rounded border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none bg-white text-gray-900 text-sm"
                rows={2}
                disabled={cell.isGenerating}
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-blue-700">
                  Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-300">Enter</kbd> to generate code
                </p>
                <div className="flex gap-2">
                  {cell.content && (
                    <button
                      onClick={() => setShowQueryInput(false)}
                      className="text-xs text-gray-600 hover:text-gray-800"
                      disabled={cell.isGenerating}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleGenerateCode}
                    disabled={!queryText.trim() || cell.isGenerating}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {cell.isGenerating ? (
                      <>
                        <Loader size={12} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display Query (when code is generated) */}
      {cell.query && !showQueryInput && (
        <div className="px-3 py-2 bg-purple-50 border-b border-purple-200 flex items-start gap-2">
          <Sparkles size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-purple-900 flex-1 italic">"{cell.query}"</p>
        </div>
      )}

      {/* Code Editor */}
      {!isCellCollapsed && cell.content && (
        <div onKeyDown={handleKeyDown}>
          <Editor
            height="120px"
            defaultLanguage="python"
            value={cell.content}
            onChange={(value) => onUpdate(cell.id, value || '')}
            onMount={handleEditorDidMount}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              padding: { top: 8, bottom: 8 },
            }}
          />
        </div>
      )}


{/* Hypothesis Tag Selector - NEW SECTION */}
{onUpdateHypothesisTags && hypotheses && hypotheses.length > 0 && (
  <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
    <HypothesisTagSelector
      hypotheses={hypotheses}
      selectedTags={cell.hypothesisTags || []}
      onTagsChange={(tags) => onUpdateHypothesisTags(cell.id, tags)}
    />
  </div>
)}

{/* Output Display */}
{!isOutputCollapsed && (cell.output || cell.error) && (
  <div
    className="border-t border-gray-200 p-2 max-h-96 overflow-auto"
    style={{
      backgroundColor: cell.error ? '#ffebee' : '#fafafa',
    }}
  >
    {/* Add Insight Button - Top Right */}
    {cell.output && !cell.error && onAddInsight && (
      <div className="flex justify-end mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddInsight(cell.id);
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors shadow-sm"
          title="Add Insight"
        >
          <Plus size={14} />
          Add Insight
        </button>
      </div>
    )}
    
    {cell.error && (
      <div className="text-red-700 font-mono text-xs">
        <strong>Error:</strong>
        <pre className="mt-1 whitespace-pre-wrap">{cell.error}</pre>
      </div>
    )}

    {cell.output?.text && (
      <div className="font-mono text-xs">
        <pre className="m-0 whitespace-pre-wrap">{cell.output.text}</pre>
      </div>
    )}

    {cell.output?.plot && (
      <div className="mt-2">
        <img
          src={cell.output.plot}
          alt="Plot output"
          className="max-w-full h-auto rounded"
        />
      </div>
    )}

    {cell.output?.executionTime && (
      <div className="text-[10px] text-gray-600 mt-1 italic">
        Execution time: {cell.output.executionTime}ms
      </div>
    )}
  </div>
)}
    </div>
  );
}