'use client';

import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Trash2, Plus, ChevronUp, ChevronDown, Check, X, Loader, Sparkles, Edit2 } from 'lucide-react';
import HypothesisTagSelector from './HypothesisTagSelector';
import { generateInsightsForCell } from '@/lib/services/insightGenerationService';

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

const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
const [aiGeneratedInsights, setAiGeneratedInsights] = useState<any[]>([]);
const [showAIInsights, setShowAIInsights] = useState(false);

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

  // Generate AI insights after execution
// Generate AI insights after execution
const handleGenerateInsights = async () => {
  if (!cell.output || cell.error) return;
  
  setIsGeneratingInsights(true);
  setShowAIInsights(false);
  
  try {
    const insights = await generateInsightsForCell({
      cell,
      dataset: datasetInfo, // Use datasetInfo from props
      hypotheses: hypotheses || [],
      allCells: [], // Could pass context of other cells if available
    });
    
    setAiGeneratedInsights(insights);
    setShowAIInsights(true);
  } catch (error) {
    console.error('Failed to generate insights:', error);
    // Show error notification if needed
  } finally {
    setIsGeneratingInsights(false);
  }
};

// Accept AI-generated insight
const handleAcceptInsight = (aiInsight: any, index: number) => {
  if (!onAddInsight) return;
  
  // Find or create a tag for this insight
  let tagId = '';
  if (aiInsight.suggestedTag && onAddTag) {
    // Check if tag already exists
    const existingTag = tags?.find(t => t.name.toLowerCase() === aiInsight.suggestedTag.toLowerCase());
    if (existingTag) {
      tagId = existingTag.id;
    } else {
      // Create new tag with a default color
      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
      const color = colors[tags?.length % colors.length || 0];
      tagId = onAddTag(aiInsight.suggestedTag, color);
    }
  } else if (tags && tags.length > 0) {
    // Use first available tag if no suggestion
    tagId = tags[0].id;
  }
  
  // Create the insight
  // Note: We'll need to modify the parent to handle this properly
  // For now, we'll trigger the add insight modal with pre-filled data
  
  // Store the accepted insight data for the modal to use
  sessionStorage.setItem('pendingInsight', JSON.stringify({
    content: aiInsight.content,
    tagId,
    hypothesisTags: aiInsight.relevantHypotheses || [],
  }));
  
  // Trigger add insight - the modal should pick up the pending data
  onAddInsight(cell.id);
  
  // Remove this insight from AI suggestions
  setAiGeneratedInsights(prev => prev.filter((_, i) => i !== index));
  
  // If no more AI insights, hide the panel
  if (aiGeneratedInsights.length === 1) {
    setShowAIInsights(false);
  }
};

// Edit AI-generated insight
const handleEditInsight = (aiInsight: any, index: number) => {
  if (!onAddInsight) return;
  
  // Store the insight to edit
  sessionStorage.setItem('pendingInsight', JSON.stringify({
    content: aiInsight.content,
    tagId: '',
    hypothesisTags: aiInsight.relevantHypotheses || [],
    isEditing: true, // Flag to indicate this is being edited
  }));
  
  // Trigger add insight modal for editing
  onAddInsight(cell.id);
  
  // Remove from AI suggestions
  setAiGeneratedInsights(prev => prev.filter((_, i) => i !== index));
  
  if (aiGeneratedInsights.length === 1) {
    setShowAIInsights(false);
  }
};

// Auto-generate insights when output changes
useEffect(() => {
  if (cell.output && !cell.error && !isGeneratingInsights) {
    // Check if we already have insights for this output
    const hasInsightsForThisOutput = cellInsights && cellInsights.length > 0;
    
    // Only auto-generate if no insights exist yet
    if (!hasInsightsForThisOutput) {
      handleGenerateInsights();
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [cell.output]); // Trigger when output changes

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
      setShowQueryInput(true);
      setQueryText(cell.query || '');
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
  
{/* Vertical Stack: Output and Insights */}
<div className="flex flex-col">
  {/* Output Section - Collapsible */}
  <div className="border-b border-gray-200">
    <div
      className="px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
      onClick={(e) => {
        e.stopPropagation();
        setIsOutputCollapsed(!isOutputCollapsed);
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{isOutputCollapsed ? '▶️' : '▼'}</span>
        <span className="text-sm font-semibold text-gray-700">📊 Output</span>
        {cell.output?.executionTime && (
          <span className="text-xs text-gray-500">
            ({cell.output.executionTime}ms)
          </span>
        )}
      </div>
    </div>
    
    {!isOutputCollapsed && (
      <div className="p-4">
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
    )}
  </div>

{/* Insights Section - Separate block below output */}
<div className="p-4 bg-white">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-700">💡 Insights</span>
      {cellInsights.length > 0 && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          {cellInsights.length}
        </span>
      )}
    </div>
    
    {/* Manual Add Insight Button */}
    {cell.output && !cell.error && onAddInsight && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddInsight(cell.id);
        }}
        className="text-xs px-3 py-1 border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition-all flex items-center gap-1"
      >
        <Plus size={14} />
        Add Manually
      </button>
    )}
  </div>

  {/* AI-Generated Insights Preview */}
  {isGeneratingInsights && (
    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-center gap-2 text-purple-700">
        <Loader size={16} className="animate-spin" />
        <span className="text-sm font-medium">Generating insights...</span>
      </div>
    </div>
  )}

  {/* Show AI-Generated Insights if available and not generating */}
  {showAIInsights && aiGeneratedInsights.length > 0 && (
    <div className="mb-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-purple-600" />
        <span className="text-xs font-semibold text-purple-700">AI-Generated Insights</span>
        <span className="text-xs text-gray-500">Review and accept</span>
      </div>
      
      {aiGeneratedInsights.map((aiInsight, index) => (
        <div
          key={index}
          className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="text-purple-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-800 leading-relaxed mb-3">
                {aiInsight.content}
              </p>
              
              {aiInsight.suggestedTag && (
                <div className="mb-3">
                  <span className="text-xs text-gray-600">Suggested category: </span>
                  <span className="text-xs font-medium text-purple-700">
                    {aiInsight.suggestedTag}
                  </span>
                </div>
              )}
              
              {aiInsight.relevantHypotheses && aiInsight.relevantHypotheses.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-3">
                  {aiInsight.relevantHypotheses.map((hypId: string) => {
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
              
              <button
  onClick={(e) => {
    e.stopPropagation();
    handleAcceptInsight(aiInsight, index);
  }}
  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
>
  <Check size={12} />
  Accept
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    handleEditInsight(aiInsight, index);
  }}
  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
>
  <Edit2 size={12} />
  Edit
</button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Remove this insight from the list
                    setAiGeneratedInsights(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                >
                  <X size={12} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        // </div>
      ))}
      
      {/* Close AI Insights Panel */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowAIInsights(false);
          setAiGeneratedInsights([]);
        }}
        className="w-full text-xs py-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-300"
      >
        Dismiss All
      </button>
    </div>
  )}

  {/* Existing Insights List */}
  {cellInsights && cellInsights.length > 0 ? (
    cellInsights.map((insight) => {
      const tag = tags?.find((t) => t.id === insight.tagId);
      return (
        <div
          key={insight.id}
          className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow mb-3"
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
  ) : !showAIInsights && (
    <div className="text-center py-8 px-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
      <p className="mb-1">No insights yet</p>
      <p className="text-xs">Run the cell to generate AI insights automatically</p>
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