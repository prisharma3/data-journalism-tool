'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Minimap from '@/components/minimap/Minimap';
import NotebookCanvas from '@/components/notebook/NotebookCanvas';
import WritingContainer from '@/components/writing/WritingContainer';
import { GripVertical } from 'lucide-react';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const projectId = params.id as string;
  
  // Panel widths
  const [minimapWidth, setMinimapWidth] = useState(60);
  const [writingWidth, setWritingWidth] = useState(400);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Minimap sections state
  const [minimapSections, setMinimapSections] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_MINIMAP = 48;
  const MAX_MINIMAP = 150;
  const MIN_WRITING = 500;
  const MAX_WRITING = 700;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  // Left divider drag (minimap resize)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        if (newWidth >= MIN_MINIMAP && newWidth <= MAX_MINIMAP) {
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
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft]);

  // Right divider drag (writing panel resize)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRight && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = containerRect.right - e.clientX;
        if (newWidth >= MIN_WRITING && newWidth <= MAX_WRITING) {
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
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingRight]);

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
      className="min-h-screen bg-gray-50 flex"
    >
{/* Panel 1: Minimap */}
<div 
        className="bg-white border-r border-gray-200 flex-shrink-0"
        style={{ width: `${minimapWidth}px` }}
      >
        <Minimap 
          projectId={projectId} 
          sections={minimapSections}
          onSectionClick={(sectionId) => {
            // Dispatch event to scroll to section in notebook
            const event = new CustomEvent('minimap-section-click', {
              detail: { sectionId },
              bubbles: true,
            });
            window.dispatchEvent(event);
          }}
        />
      </div>

      {/* Left Resize Handle */}
      <div
        className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors relative group"
        onMouseDown={() => setIsDraggingLeft(true)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Panel 2: Notebook (Code + Insights) */}
<div className="flex-1 bg-white border-r border-gray-200 min-w-0">
        <NotebookCanvas 
          projectId={projectId}
          onSectionsChange={setMinimapSections}
        />
      </div>

      {/* Right Resize Handle */}
      <div
        className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors relative group"
        onMouseDown={() => setIsDraggingRight(true)}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Panel 3: Writing */}
      <div 
        className="bg-white flex-shrink-0"
        style={{ width: `${writingWidth}px` }}
      >
        <WritingContainer projectId={projectId} />
      </div>
    </div>
  );
}