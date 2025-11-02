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
  isHighlighted?: boolean;
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
  hypotheses?: Array<{ id: string; content: string; createdAt: string }>;
  canMoveUp: boolean;
  canMoveDown: boolean;
  datasetInfo?: any;
  isCodeCollapsed: boolean; 
  cellInsights: any[];
  insights?: any[];
  tags?: any[];
  onUpdateInsight?: (insightId: string, content: string, tagId: string, hypothesisTags?: string[]) => void;
  onDeleteInsight?: (insightId: string) => void;
  onAddTag?: (name: string, color: string) => string;
}

export default function CodeCell({
  cell,
  isSelected,
  isHighlighted = false,
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
  insights = [], 
  tags = [], 
  onUpdateInsight, 
  onDeleteInsight, 
  onAddTag, 
  canMoveUp,
  canMoveDown,
  datasetInfo,
  isCodeCollapsed,
  cellInsights,
}: CodeCellProps) {
    const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
    const [isCellCollapsed, setIsCellCollapsed] = useState(false);
    
  const [isHovered, setIsHovered] = useState(false);
  const [showQueryInput, setShowQueryInput] = useState(!cell.content && !cell.query);
  const [queryText, setQueryText] = useState(cell.query || '');
  const editorRef = useRef<any>(null);

  const [isLocalCodeCollapsed, setIsLocalCodeCollapsed] = useState(false);

// Use global collapse state, but allow local override

const shouldCollapseCode = isCodeCollapsed || isLocalCodeCollapsed;

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
      className="code-cell mb-2 bg-white rounded border-l-4 transition-all"
      onClick={() => onSelect(cell.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderLeftColor: cellInsights.length > 0 ? '#10B981' : '#2196F3',
        borderWidth: '1px',
        borderLeftWidth: '4px',
        backgroundColor: isHighlighted ? '#fef3c7' : 'white',
        boxShadow: isHighlighted ? '0 0 0 3px rgba(251, 191, 36, 0.3)' : isSelected ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {/* Query Display */}
      {cell.query && !showQueryInput && (
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-start gap-3">
          <Sparkles size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-purple-900 flex-1 italic">"{cell.query}"</p>
        </div>
      )}
  
      {/* Query Input Mode */}
      {showQueryInput && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700">
              ✨ Describe what you want to analyze:
            </label>
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={handleQueryKeyDown}
              placeholder="E.g., Calculate correlation between age and income..."
              className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleGenerateCode}
                disabled={!queryText.trim() || cell.isGenerating}
                className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {cell.isGenerating ? (
                  <>
                    <Loader size={12} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Generate Code
                  </>
                )}
              </button>
              {cell.query && (
                <button
                  onClick={() => setShowQueryInput(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
  
      {/* Collapsible Code Section */}
      <div className="border-b border-gray-200">
        <div
          className="px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
          onClick={(e) => {
            e.stopPropagation();
            setIsLocalCodeCollapsed(!isLocalCodeCollapsed);
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm">{shouldCollapseCode ? '▶' : '▼'}</span>
            <span className="text-sm font-medium text-gray-700">💻 Python Code</span>
            {cell.executionCount && (
              <span className="text-xs text-gray-500 font-mono">[{cell.executionCount}]</span>
            )}
            {cell.output && !cell.error && <Check size={14} className="text-green-500" />}
            {cell.error && <X size={14} className="text-red-500" />}
            {cell.isRunning && <Loader size={14} className="animate-spin text-blue-500" />}
          </div>
          
          {/* Code Actions - Show when expanded or hovered */}
          {(!shouldCollapseCode || isHovered) && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExecute(cell.id);
                }}
                title="Run Cell (Shift+Enter)"
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center gap-1"
                disabled={cell.isRunning || cell.isGenerating}
              >
                <Play size={12} />
                Run
              </button>
              {cell.query && !showQueryInput && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditQuery();
                  }}
                  title="Edit Query"
                  className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 flex items-center gap-1"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
  
        {/* Code Editor - Collapsible */}
        {!shouldCollapseCode && cell.content && (
          <div onKeyDown={handleKeyDown} className="border-t border-gray-200">
            <Editor
              height="150px"
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
            
            {/* Hypothesis Tags */}
            {onUpdateHypothesisTags && hypotheses && hypotheses.length > 0 && (
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                <HypothesisTagSelector
                  hypotheses={hypotheses}
                  selectedTags={cell.hypothesisTags || []}
                  onTagsChange={(tags) => onUpdateHypothesisTags(cell.id, tags)}
                />
              </div>
            )}
          </div>
        )}
      </div>
  
      {/* Split View: Output and Insights Side by Side */}
      <div className="flex gap-4 p-4">
        {/* Left Panel: Output */}
        <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            📊 Output
            {cell.output?.executionTime && (
              <span className="text-xs text-gray-500 font-normal">
                ({cell.output.executionTime}ms)
              </span>
            )}
          </div>
  
          {cell.error ? (
            <div className="text-red-700 font-mono text-xs bg-red-50 p-3 rounded border border-red-200">
              <strong>Error:</strong>
              <pre className="mt-1 whitespace-pre-wrap">{cell.error}</pre>
            </div>
          ) : cell.output ? (
            <>
              {cell.output.text && (
                <div className="font-mono text-xs mb-3 bg-white p-3 rounded border border-gray-200">
                  <pre className="whitespace-pre-wrap">{cell.output.text}</pre>
                </div>
              )}
              {cell.output.plot && (
                <div className="mt-3">
                  <img
                    src={cell.output.plot}
                    alt="Plot output"
                    className="max-w-full h-auto rounded border border-gray-200"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No output yet. Run the cell to see results.
            </div>
          )}
        </div>
  
        {/* Right Panel: Insights */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            💡 Insights
            {cellInsights.length > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {cellInsights.length}
              </span>
            )}
          </div>
  
          {/* Add Insight Button */}
          {cell.output && !cell.error && onAddInsight && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddInsight(cell.id);
              }}
              className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Insight
            </button>
          )}
  
          {/* Insights List */}
          {cellInsights && cellInsights.length > 0 ? (
            cellInsights.map((insight) => {
              const tag = tags?.find((t) => t.id === insight.tagId);
              return (
                <div
                  key={insight.id}
                  className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: tag?.color || '#4CAF50',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: tag?.color || '#4CAF50' }}>
                      {tag?.name || 'INSIGHT'}
                    </span>
                    <div className="flex gap-1">
                      {onUpdateInsight && (
                        <button className="text-gray-400 hover:text-blue-600 text-xs p-1">
                          ✏️
                        </button>
                      )}
                      {onDeleteInsight && (
                        <button
                          onClick={() => onDeleteInsight(insight.id)}
                          className="text-gray-400 hover:text-red-600 text-xs p-1"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    {insight.content}
                  </p>
  
                  {insight.hypothesisTags && insight.hypothesisTags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {insight.hypothesisTags.map((hypId: string) => {
                        const hyp = hypotheses?.find(h => h.id === hypId);
                        const hypIndex = hypotheses?.findIndex(h => h.id === hypId);
                        return hyp ? (
                          <span
                            key={hypId}
                            className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full"
                          >
                            H{hypIndex !== undefined ? hypIndex + 1 : '?'}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
  
                  {insight.plotThumbnail && (
                    <div className="mt-2">
                      <img
                        src={insight.plotThumbnail}
                        alt="Analysis plot"
                        className="w-20 h-16 object-cover rounded border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 px-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
              <p className="mb-1">No insights yet</p>
              <p className="text-xs">Add insights to document your findings</p>
            </div>
          )}
        </div>
      </div>
  
      {/* Cell Management Toolbar - Bottom */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddAbove(cell.id);
            }}
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
            title="Add Cell Above"
          >
            ⬆️ Add Above
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddBelow(cell.id);
            }}
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
            title="Add Cell Below"
          >
            ⬇️ Add Below
          </button>
        </div>
        
        <div className="flex gap-2">
          {canMoveUp && onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp(cell.id);
              }}
              className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
            >
              <ChevronUp size={14} />
            </button>
          )}
          {canMoveDown && onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown(cell.id);
              }}
              className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
            >
              <ChevronDown size={14} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this cell?')) {
                onDelete(cell.id);
              }
            }}
            className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete Cell"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}