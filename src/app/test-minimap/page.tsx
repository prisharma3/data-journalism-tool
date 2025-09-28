'use client';

import { useEffect, useState } from 'react';
import { Minimap } from '@/components/minimap/Minimap';
import { useProjectStore } from '@/stores/projectStore';
import { Project, Dataset, Hypothesis, Analysis, Insight, Tag } from '@/types';

export default function TestMinimapPage() {
  const [currentSection, setCurrentSection] = useState('dataset-section');
  const { 
    setCurrentProject, 
    setDatasets, 
    setHypotheses, 
    setAnalyses, 
    setInsights,
    setTags 
  } = useProjectStore();

  useEffect(() => {
    // Create mock project data
    const mockProject: Project = {
      id: 'test-project-1',
      name: 'Climate Change Data Analysis',
      description: 'Testing minimap with sample data',
      userId: 'test-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockDataset: Dataset = {
      id: 'dataset-1',
      projectId: 'test-project-1',
      fileName: 'climate_data.csv',
      fileSize: 2048576,
      columns: ['year', 'temperature', 'co2_levels', 'region'],
      rowCount: 1000,
      filePath: '/uploads/climate_data.csv',
      aiSummary: 'Climate data from 1990-2020 with temperature and CO2 measurements',
      uploadedAt: new Date().toISOString(),
    };

    const mockHypotheses: Hypothesis[] = [
      {
        id: 'hypothesis-1',
        projectId: 'test-project-1',
        content: 'Global temperatures have increased significantly over the past 30 years',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hypothesis-2',
        projectId: 'test-project-1',
        content: 'CO2 levels correlate strongly with temperature increases',
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockAnalyses: Analysis[] = [
      {
        id: 'analysis-1',
        projectId: 'test-project-1',
        hypothesisId: 'hypothesis-1',
        query: 'Show temperature trends over time',
        code: 'plt.plot(df["year"], df["temperature"])',
        explanation: 'Linear trend analysis of temperature data',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'analysis-2',
        projectId: 'test-project-1',
        hypothesisId: 'hypothesis-1',
        query: 'Regional temperature differences',
        code: 'df.groupby("region")["temperature"].mean()',
        explanation: 'Temperature comparison across regions',
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'analysis-3',
        projectId: 'test-project-1',
        hypothesisId: 'hypothesis-2',
        query: 'Correlation between CO2 and temperature',
        code: 'correlation = df["co2_levels"].corr(df["temperature"])',
        explanation: 'Pearson correlation analysis',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockTags: Tag[] = [
      {
        id: 'tag-1',
        projectId: 'test-project-1',
        name: 'Strong Evidence',
        color: '#10B981',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tag-2',
        projectId: 'test-project-1',
        name: 'Needs Investigation',
        color: '#F59E0B',
        createdAt: new Date().toISOString(),
      },
    ];

    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        projectId: 'test-project-1',
        analysisOutputId: 'output-1',
        tagId: 'tag-1',
        content: 'Temperature increase is clearly visible in the data',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'insight-2',
        projectId: 'test-project-1',
        analysisOutputId: 'output-2',
        tagId: 'tag-2',
        content: 'Regional differences need further analysis',
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Set mock data in store
    setCurrentProject(mockProject);
    setDatasets([mockDataset]);
    setHypotheses(mockHypotheses);
    setAnalyses(mockAnalyses);
    setTags(mockTags);
    setInsights(mockInsights);
  }, [setCurrentProject, setDatasets, setHypotheses, setAnalyses, setTags, setInsights]);

  const handleSectionClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    console.log('Clicked section:', sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Minimap */}
      <Minimap 
        onSectionClick={handleSectionClick}
        currentSection={currentSection}
      />
      
      {/* Main content area */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Minimap Test Page
          </h1>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current Section</h2>
            <div className="text-lg text-blue-600 font-medium">
              {currentSection}
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Instructions:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Click on different sections in the minimap to see them highlighted</li>
                <li>Notice the color-coding for different section types</li>
                <li>Hover over sections to see hover effects</li>
                <li>Check the browser console to see click events</li>
              </ul>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Color Legend:</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                  Dataset
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: '#F3E5F5'}}></div>
                  Hypothesis
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: '#E3F2FD'}}></div>
                  Analysis
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: '#FFFDE7'}}></div>
                  Output
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: '#FFF9C4'}}></div>
                  Insights
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}