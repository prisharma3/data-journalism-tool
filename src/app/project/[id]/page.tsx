'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useProjectState } from '@/hooks/useProjectState';
import Minimap from '@/components/minimap/Minimap';
import NotebookCanvas from '@/components/notebook/NotebookCanvas';
import WritingContainer from '@/components/writing/WritingContainer';
import { GripVertical, ArrowLeft, LogOut, Save, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const projectId = params.id as string;

  // Project state management (auto-save + manual save)
  const { saveState } = useProjectState(projectId);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  // Panel widths
  const [minimapWidth, setMinimapWidth] = useState(120);
  const [writingWidth, setWritingWidth] = useState(800);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Minimap sections state
  const [minimapSections, setMinimapSections] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_MINIMAP = 48;
  const MAX_MINIMAP = 150;
  const MIN_WRITING = 500;
  const MAX_WRITING = 1000;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  // Manual save handler
  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await saveState();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Return to dashboard handler
  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  // Sign out handler
  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

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
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingRight]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" ref={containerRef}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReturnToDashboard}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : showSaved ? (
              <Check className="w-4 h-4 mr-2 text-green-600" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : showSaved ? 'Saved!' : 'Save'}
          </Button>
          
          <span className="text-xs text-gray-400 ml-2">
            Auto-saves every few seconds
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {user?.firstName} {user?.lastName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Minimap Panel */}
        <div 
          className="bg-gray-100 border-r border-gray-200 overflow-hidden shrink-0"
          style={{ width: minimapWidth }}
        >
          <Minimap sections={minimapSections} />
        </div>

        {/* Left Resizer */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center shrink-0 transition-colors"
          onMouseDown={() => setIsDraggingLeft(true)}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>

        {/* Notebook Panel */}
        <div className="flex-1 overflow-hidden">
          <NotebookCanvas 
            projectId={projectId} 
            onSectionsChange={setMinimapSections}
          />
        </div>

        {/* Right Resizer */}
        <div
          className="w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center shrink-0 transition-colors"
          onMouseDown={() => setIsDraggingRight(true)}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>

        {/* Writing Panel */}
        <div 
          className="bg-white border-l border-gray-200 overflow-hidden shrink-0"
          style={{ width: writingWidth }}
        >
          <WritingContainer projectId={projectId} />
        </div>
      </div>
    </div>
  );
}