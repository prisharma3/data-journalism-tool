'use client';

import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Trash2, Plus, ChevronUp, ChevronDown, Check, X, Loader } from 'lucide-react';

interface CodeCellProps {
  cell: {
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
  };
  isSelected: boolean;
  onExecute: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onSelect: (id: string) => void;
  onAddBelow: (id: string) => void;
  onAddAbove: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function CodeCell({
  cell,
  isSelected,
  onExecute,
  onDelete,
  onUpdate,
  onSelect,
  onAddBelow,
  onAddAbove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: CodeCellProps) {
  const [isHovered, setIsHovered] = useState(false);
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

  return (
    <div
      className="code-cell mb-2 bg-white rounded border transition-all"
      onClick={() => onSelect(cell.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderWidth: isSelected ? '2px' : '1px',
        borderColor: isSelected ? '#007acc' : '#e0e0e0',
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
          {cell.output && !cell.isRunning && !cell.error && <Check size={14} className="text-green-500" />}
          {cell.error && <X size={14} className="text-red-500" />}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExecute(cell.id);
            }}
            title="Run Cell (Shift+Enter)"
            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center"
          >
            <Play size={12} />
          </button>

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

      {/* Code Editor */}
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

      {/* Output Display */}
      {(cell.output || cell.error) && (
        <div
          className="border-t border-gray-200 p-2 max-h-96 overflow-auto"
          style={{
            backgroundColor: cell.error ? '#ffebee' : '#fafafa',
          }}
        >
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