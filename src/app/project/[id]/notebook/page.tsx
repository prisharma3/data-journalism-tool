'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Minimap } from '@/components/minimap/Minimap';
import { TopNavigation } from '@/components/notebook/TopNavigation';
import { NotebookCanvas } from '@/components/notebook/NotebookCanvas';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';

export default function NotebookPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [currentSection, setCurrentSection] = useState('dataset-section');
  
  const { isAuthenticated, user } = useAuthStore();
  const { currentProject, setCurrentProject, clearProject } = useProjectStore();

  // Load project data on mount
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    // Load project data from API (we'll implement this)
    // For now, create a mock project
    const mockProject = {
      id: projectId,
      name: 'Climate Data Analysis',
      description: 'Analyzing climate change data',
      userId: user?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setCurrentProject(mockProject);
  }, [projectId, isAuthenticated, user, setCurrentProject]);

  // Handle section navigation
  const handleSectionClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    console.log('Navigating to section:', sectionId);
    
    // Scroll to section (we'll implement this)
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Minimap */}
      <div className="w-64 flex-shrink-0">
        <Minimap 
          onSectionClick={handleSectionClick}
          currentSection={currentSection}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <TopNavigation 
          onSectionClick={handleSectionClick}
          currentSection={currentSection}
        />

        {/* Notebook Canvas - This is where the magic happens */}
        <div className="flex-1 overflow-y-auto">
          <NotebookCanvas 
            projectId={projectId}
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
          />
        </div>
      </div>
    </div>
  );
}