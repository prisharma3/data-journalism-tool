'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// Import the three main components
import Minimap from '@/components/minimap/Minimap';
import NotebookCanvas from '@/components/notebook/NotebookCanvas';
import WritingEditor from '@/components/writing/WritingEditor';

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [projectId] = useState(params.id as string);
  
  // Resizable panels state
  const [minimapWidth, setMinimapWidth] = useState(45); // Decreased from 256px
  const [writingWidth, setWritingWidth] = useState(384); // 96 * 4 = 384px
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  
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
        
        // Min 150px, Max 400px for minimap
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
        
        // Min 300px, Max 600px for writing panel
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
      className="min-h-screen bg-gray-50 flex select-none"
      style={{ cursor: isDraggingLeft || isDraggingRight ? 'col-resize' : 'default' }}
    >
      {/* Left Column - Minimap (Resizable, Smaller) */}
      <div 
        className="bg-white border-r border-gray-200 flex-shrink-0"
        style={{ width: `${minimapWidth}px` }}
      >
        <Minimap projectId={projectId} />
      </div>

      {/* Left Divider (Resize Handle) */}
      <div
        className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={() => setIsDraggingLeft(true)}
      />

      {/* Center Column - Notebook + Insights (Flexible) */}
      <div className="flex-1 bg-white border-r border-gray-200 min-w-0">
        <NotebookCanvas projectId={projectId} />
      </div>

      {/* Right Divider (Resize Handle) */}
      <div
        className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={() => setIsDraggingRight(true)}
      />

      {/* Right Column - Writing (Resizable) */}
      <div 
        className="bg-white flex-shrink-0"
        style={{ width: `${writingWidth}px` }}
      >
        <WritingEditor projectId={projectId} />
      </div>
    </div>
  );
}