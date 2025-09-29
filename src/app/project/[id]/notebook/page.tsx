'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APP_NAME } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

// Import the three main components (we'll create these next)
import Minimap from '@/components/notebook/Minimap';
import NotebookInterface from '@/components/notebook/NotebookInterface';
import WritingInterface from '@/components/notebook/WritingInterface';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function NotebookPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const { user, isAuthenticated, token } = useAuthStore();
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    if (projectId) {
      fetchProject();
    }
  }, [isAuthenticated, user, router, projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else if (response.status === 404) {
        setError('Project not found');
      } else {
        setError('Failed to load project');
      }
    } catch (error) {
      setError('Error loading project');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading notebook...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Project not found'}
          </h2>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600">Data Journalism Workspace</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Active</Badge>
              <span className="text-sm text-gray-600">
                {user.firstName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Three-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Minimap - Left Column */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <Minimap projectId={projectId} />
        </div>

        {/* Notebook Interface - Center Column */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          <NotebookInterface projectId={projectId} />
        </div>

        {/* Writing Interface - Right Column */}
        <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0">
          <WritingInterface projectId={projectId} />
        </div>
      </div>
    </div>
  );
}