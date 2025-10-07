'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

// Import the three main components
import Minimap, { MinimapSection } from '@/components/minimap/Minimap';
import NotebookCanvas from '@/components/notebook/NotebookCanvas';
import WritingEditor from '@/components/writing/WritingEditor';

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [projectId] = useState(params.id as string);

  const [minimapSections, setMinimapSections] = useState<MinimapSection[]>([]);
const notebookScrollRef = useRef<HTMLDivElement>(null);

const handleSectionsChange = useCallback((sections: MinimapSection[]) => {
    setMinimapSections(sections);
  }, []);

  const handleMinimapSectionClick = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };


  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Column - Minimap */}
<div className="w-32 bg-white border-r border-gray-200 flex-shrink-0">
  <Minimap 
    sections={minimapSections}
    onSectionClick={handleMinimapSectionClick}
  />
</div>

      {/* Center Column - Notebook + Insights */}
      <div className="flex-1 bg-white border-r border-gray-200 min-w-0">
  <NotebookCanvas 
    projectId={projectId}
    onSectionsChange={handleSectionsChange}
  />
</div>

      {/* Right Column - Writing */}
      <div className="bg-white flex-shrink-0" style={{ width: '422px' }}>
  <WritingEditor projectId={projectId} />
</div>
    </div>
  );
}