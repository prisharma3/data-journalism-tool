'use client';

import { useEffect, useState } from 'react';
import { TopNavigation } from '@/components/notebook/TopNavigation';
import { useProjectStore } from '@/stores/projectStore';
import { Project, Dataset, Hypothesis, Analysis, Insight, Tag } from '@/types';

export default function TestNavigationPage() {
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
    // Create mock project data (same as minimap test but more comprehensive)
    const mockProject: Project = {
      id: 'test-project-1',
      name: 'Climate Change Data Analysis',
      description: 'Testing navigation with sample data',
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
        content: 'Global temperatures have increased significantly over the past 30 years due to human activities',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hypothesis-2',
        projectId: 'test-project-1',
        content: 'CO2 levels correlate strongly with temperature increases across different regions',
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'hypothesis-3',
        projectId: 'test-project-1',
        content: 'Regional variations in temperature change show different patterns based on geography',
        position: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockAnalyses: Analysis[] = [
      // Analyses for Hypothesis 1
      {
        id: 'analysis-1',
        projectId: 'test-project-1',
        hypothesisId: 'hypothesis-1',
        query: 'Show temperature trends over time globally',
        code: 'plt.plot(df["year"], df["temperature"])',
        explanation: 'Linear trend analysis of global temperature data over 30 years',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'analysis-2',
        projectId: 'test-project-1',
        hypothesisId: 'hypothesis-1',
        query: 'Calculate temperature increase rate per decade',
        code: 'slope = np.polyfit(df["year"], df["temperature"], 1)[0]',
        explanation: 'Statistical analysis of temperature increase rate',
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Analyses for Hypothesis 2
      {
        id: 'analysis-3',
        projectId: 'test-project-1',
        hypothesisId: 'hypothesis-2',
        query: 'Correlation between CO2 and temperature',
        code: 'correlation = df["co2_levels"].corr(df["temperature"])',
        explanation: 'Pearson correlation analysis between CO2 levels and temperature',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'analysis-4',
        projectId: 'test-project-1',
        hypothesisId: 'hypothesis-2',
        query: 'Scatter plot of CO2 vs temperature with regression line',
        code: 'sns.regplot(x="co2_levels", y="temperature", data=df)',
        explanation: 'Visual correlation analysis with regression trend',
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Analyses for Hypothesis 3
      {
        id: 'analysis-5',
        projectId: 'test-project-1',
        hypothesisId: 'hypothesis-3',
        query: 'Regional temperature differences analysis',
        code: 'df.groupby("region")["temperature"].agg(["mean", "std"])',
        explanation: 'Statistical comparison of temperature patterns across regions',
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
      {
        id: 'tag-3',
        projectId: 'test-project-1',
        name: 'Contradictory Data',
        color: '#EF4444',
        createdAt: new Date().toISOString(),
      },
    ];

    const mockInsights: Insight[] = [
      {
        id: 'insight-1',
        projectId: 'test-project-1',
        analysisOutputId: 'output-1',
        tagId: 'tag-1',
        content: 'The linear trend clearly shows a 1.2°C increase over 30 years, providing strong evidence for global warming',
        position: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'insight-2',
        projectId: 'test-project-1',
        analysisOutputId: 'output-2',
        tagId: 'tag-1',
        content: 'CO2 correlation coefficient of 0.89 indicates very strong relationship with temperature',
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'insight-3',
        projectId: 'test-project-1',
        analysisOutputId: 'output-3',
        tagId: 'tag-2',
        content: 'Arctic regions show 2x faster warming than global average - requires deeper investigation',
        position: 2,
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
    console.log('Navigated to section:', sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNavigation 
        onSectionClick={handleSectionClick}
        currentSection={currentSection}
      />
      
      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Top Navigation Test Page
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Section</h2>
          <div className="text-lg text-blue-600 font-medium mb-4">
            {currentSection}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-900 mb-2">Dataset</h3>
              <p className="text-sm text-gray-600">1 dataset uploaded</p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <h3 className="font-medium text-gray-900 mb-2">Hypotheses</h3>
              <p className="text-sm text-gray-600">3 hypotheses created</p>
            </div>
            <div className="p-4 bg-blue-50 rounded">
              <h3 className="font-medium text-gray-900 mb-2">Analyses</h3>
              <p className="text-sm text-gray-600">5 analyses across hypotheses</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <h3 className="font-medium text-gray-900 mb-2">Insights</h3>
              <p className="text-sm text-gray-600">3 insights with 3 tags</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Click the <strong>Dataset</strong> button to navigate to dataset section</li>
            <li>Click <strong>Hypotheses</strong> dropdown to see all hypotheses and select one</li>
            <li>Click <strong>Analyses</strong> dropdown to see nested structure (grouped by hypothesis)</li>
            <li>Click <strong>Insights</strong> button to open the insights management panel</li>
            <li>Check the browser console for navigation events</li>
            <li>Notice the color-coding matches our design system</li>
          </ul>
        </div>
      </div>
    </div>
  );
}