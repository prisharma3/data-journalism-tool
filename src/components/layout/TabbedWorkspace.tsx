'use client';

import { useState, useEffect, useRef } from 'react';
import { BookOpen, PenTool, GripVertical } from 'lucide-react';
import Minimap, { MinimapSection } from '@/components/minimap/Minimap';
import NotebookCanvas from '@/components/notebook/NotebookCanvas';
import WritingContainer from '@/components/writing/WritingContainer';

interface TabbedWorkspaceProps {
  projectId: string;
}

type TabType = 'notebook' | 'writing';

export default function TabbedWorkspace({ projectId }: TabbedWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');
  const [minimapSections, setMinimapSections] = useState<MinimapSection[]>([]);
  
  // Only resize minimap - notebook takes remaining space
  const [minimapWidth, setMinimapWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Min/Max constraints for minimap
  const MINIMAP_MIN = 48;
  const MINIMAP_MAX = 200;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setActiveTab('notebook');
      } else if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setActiveTab('writing');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle minimap resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        
        if (newWidth >= MINIMAP_MIN && newWidth <= MINIMAP_MAX) {
          setMinimapWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Tab Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center px-6 py-3">
          <div className="flex items-center gap-1">
            {/* Notebook Tab */}
            <button
              onClick={() => setActiveTab('notebook')}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm
                transition-all duration-200 ease-in-out
                ${activeTab === 'notebook' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <BookOpen className="w-4 h-4" />
              <span>Notebook</span>
              <span className={`
                text-xs ml-1 px-1.5 py-0.5 rounded
                ${activeTab === 'notebook' ? 'bg-blue-500' : 'bg-gray-200 text-gray-500'}
              `}>
                ⌘1
              </span>
            </button>

            {/* Writing Tab */}
            <button
              onClick={() => setActiveTab('writing')}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm
                transition-all duration-200 ease-in-out
                ${activeTab === 'writing' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <PenTool className="w-4 h-4" />
              <span>Writing</span>
              <span className={`
                text-xs ml-1 px-1.5 py-0.5 rounded
                ${activeTab === 'writing' ? 'bg-blue-500' : 'bg-gray-200 text-gray-500'}
              `}>
                ⌘2
              </span>
            </button>
          </div>

          {/* Tab Indicator */}
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                activeTab === 'notebook' ? 'bg-blue-600' : 'bg-green-600'
              }`} />
              <span className="font-medium">
                {activeTab === 'notebook' ? 'Analysis Mode' : 'Writing Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div 
        ref={containerRef}
        className="flex-1 flex overflow-hidden"
      >
        {activeTab === 'notebook' ? (
          <div className="flex-1 flex animate-fadeIn">
            {/* Minimap - Resizable */}
            <div 
              className="bg-gray-50 border-r border-gray-200 flex-shrink-0"
              style={{ width: `${minimapWidth}px` }}
            >
              <Minimap 
                projectId={projectId}
                sections={minimapSections}
              />
            </div>

            {/* Resize Handle */}
            <div
              className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors relative group"
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Notebook - Takes remaining space (handles its own internal layout) */}
            <div className="flex-1 min-w-0">
              <NotebookCanvas 
                projectId={projectId}
                onSectionsChange={setMinimapSections}
              />
            </div>
          </div>
        ) : (
          /* Writing Content - Full Width */
          <div className="flex-1 bg-white overflow-y-auto animate-fadeIn">
            <WritingContainer projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}