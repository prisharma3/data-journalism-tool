'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Calendar, Settings, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APP_NAME } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { setTags } = useProjectStore();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Set up default tags for the project
    const defaultTags = [
      {
        id: 'tag-strong-evidence',
        projectId: 'demo-project',
        name: 'Strong Evidence',
        color: '#10B981',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tag-needs-investigation',
        projectId: 'demo-project',
        name: 'Needs Investigation',
        color: '#F59E0B',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tag-contradictory',
        projectId: 'demo-project',
        name: 'Contradictory Data',
        color: '#EF4444',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tag-neutral',
        projectId: 'demo-project',
        name: 'Neutral Finding',
        color: '#6B7280',
        createdAt: new Date().toISOString(),
      },
    ];

    setTags(defaultTags);
  }, [isAuthenticated, user, router, setTags]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Mock projects data
  const mockProjects = [
    {
      id: 'demo-project',
      name: 'Climate Data Analysis',
      description: 'Analyzing temperature and CO2 trends over the past 30 years',
      createdAt: '2025-01-01',
      status: 'active',
    },
    {
      id: 'sample-project',
      name: 'Customer Purchase Behavior',
      description: 'Understanding customer demographics and buying patterns',
      createdAt: '2024-12-15',
      status: 'draft',
    },
  ];

  // Show loading if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">{APP_NAME}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.firstName}!
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Projects</h2>
          <p className="text-gray-600">Create and manage your data journalism projects</p>
        </div>

        {/* Create New Project Button */}
        <div className="mb-6">
          <Button className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create New Project
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mock Project Cards */}
          {mockProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    {project.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/project/${project.id}/notebook`)}
                  >
                    <BookOpen className="w-4 h-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={project.status === 'active' ? 'default' : 'secondary'}
                      className={project.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {project.status === 'active' ? 'Active' : 'Draft'}
                    </Badge>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/project/${project.id}/notebook`)}
                      >
                        Open Notebook
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Quick Start Card */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Try the Demo</h3>
              <p className="text-gray-500 mb-4">
                Explore our computational notebook with sample data
              </p>
              <Button 
                onClick={() => router.push('/project/demo-project/notebook')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Open Demo Notebook
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Overview */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Computational Notebook Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                📁
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Dataset Upload</h4>
              <p className="text-sm text-gray-600">Upload CSV/Excel files with AI-powered summaries</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                💡
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Smart Hypotheses</h4>
              <p className="text-sm text-gray-600">Write research hypotheses with auto-save</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                🤖
              </div>
              <h4 className="font-medium text-gray-900 mb-1">AI Code Generation</h4>
              <p className="text-sm text-gray-600">Natural language to Python code with Gemini AI</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                📊
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Tagged Insights</h4>
              <p className="text-sm text-gray-600">Organize findings with custom color-coded tags</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}