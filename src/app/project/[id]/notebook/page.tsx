'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// Import the three main components
import Minimap, { MinimapSection } from '@/components/minimap/Minimap';
import NotebookCanvas from '@/components/notebook/NotebookCanvas';
import WritingContainer from '@/components/writing/WritingContainer';

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [projectId] = useState(params.id as string);
  
  // Resizable panels state
  const [minimapWidth, setMinimapWidth] = useState(45);
  const [writingWidth, setWritingWidth] = useState(384);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  
  // Notebook collapse state
  const [isNotebookCollapsed, setIsNotebookCollapsed] = useState(false);
  
  // Minimap sections state
  const [minimapSections, setMinimapSections] = useState<MinimapSection[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  // Handle mouse move for left divider (minimap)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        
        if (newWidth >= 50 && newWidth <= 150) {
          setMinimapWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
    };

    if (isDraggingLeft) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLeft]);

  // Handle mouse move for right divider (writing panel)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = containerRect.right - e.clientX;
        
        if (newWidth >= 300 && newWidth <= 600) {
          setWritingWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
    };

    if (isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRight]);

  // Listen for collapse toggle from NotebookCanvas - ADDED AT THE END
  useEffect(() => {
    const handleToggle = () => {
      setIsNotebookCollapsed(prev => !prev);
    };
    
    window.addEventListener('toggle-notebook-collapse', handleToggle);
    return () => window.removeEventListener('toggle-notebook-collapse', handleToggle);
  }, []);

  // Handle minimap section click
  const handleMinimapClick = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gray-50 flex select-none relative"
      style={{ cursor: isDraggingLeft || isDraggingRight ? 'col-resize' : 'default' }}
    >
      {/* Left Column - Minimap (Resizable, Smaller) */}
      <div 
        className="bg-white border-r border-gray-200 flex-shrink-0"
        style={{ width: `${minimapWidth}px` }}
      >
        <Minimap 
          sections={minimapSections} 
          onSectionClick={handleMinimapClick}
        />
      </div>

      {/* Left Divider (Resize Handle) */}
      <div
        className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={() => setIsDraggingLeft(true)}
      />

      {/* Center Column - Notebook + Insights (Flexible) */}
{/* Center Column - Notebook + Insights split into two separate panels */}
{!isNotebookCollapsed ? (
  <>
    {/* Notebook Column */}
    <div className="flex-1 bg-white border-r border-gray-200 min-w-0">
      <NotebookCanvas 
        projectId={projectId}
        onSectionsChange={setMinimapSections}
      />
    </div>

    {/* Right Divider (Resize Handle) */}
    <div
      className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
      onMouseDown={() => setIsDraggingRight(true)}
    />
  </>
) : (
  <>
    {/* When notebook is collapsed, show insights panel directly */}
    <div 
      className="flex-1 bg-gray-100 border-r border-gray-200 overflow-y-auto p-4"
    >
      {/* We'll create a separate InsightsPanel component or extract it */}
      <div className="text-center py-8 text-gray-600">
        <p className="text-sm">Insights Panel</p>
        <p className="text-xs mt-2">Expand notebook to see insights with their code cells</p>
      </div>
    </div>
  </>
)}

      {/* Right Column - Writing (Resizable) */}
      <div 
        className="bg-white flex-shrink-0"
        style={{ width: `${writingWidth}px` }}
      >
        <WritingContainer projectId={projectId} />
      </div>
    </div>
  );
}