'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatasetSection } from './DatasetSection';
import { HypothesisSection } from './HypothesisSection';
import { AnalysisSection } from './AnalysisSection';
import { OutputSection } from './OutputSection';
import { InsightSection } from './InsightSection';
import { useProjectStore } from '@/stores/projectStore';

interface NotebookCanvasProps {
  projectId: string;
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function NotebookCanvas({ 
  projectId, 
  currentSection, 
  onSectionChange 
}: NotebookCanvasProps) {
  const { 
    datasets, 
    hypotheses, 
    analyses, 
    insights,
    addHypothesis,
    addAnalysis 
  } = useProjectStore();

  // Handle adding new hypothesis
  const handleAddHypothesis = () => {
    const newHypothesis = {
      id: `hypothesis-${Date.now()}`,
      projectId,
      content: '',
      position: hypotheses.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addHypothesis(newHypothesis);
    onSectionChange(`hypothesis-${newHypothesis.id}`);
  };

  // Handle adding new analysis
  const handleAddAnalysis = (hypothesisId: string) => {
    const newAnalysis = {
      id: `analysis-${Date.now()}`,
      projectId,
      hypothesisId,
      query: '',
      code: '',
      explanation: '',
      position: analyses.filter(a => a.hypothesisId === hypothesisId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addAnalysis(newAnalysis);
    onSectionChange(`analysis-${newAnalysis.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Dataset Section - Always present */}
      <div id="dataset-section">
        <DatasetSection 
          projectId={projectId}
          isActive={currentSection === 'dataset-section'}
        />
      </div>

      {/* Hypothesis Sections */}
      {hypotheses.map((hypothesis, index) => (
        <div key={hypothesis.id}>
          <div id={`hypothesis-${hypothesis.id}`}>
            <HypothesisSection
              hypothesis={hypothesis}
              index={index}
              isActive={currentSection === `hypothesis-${hypothesis.id}`}
              onAddAnalysis={() => handleAddAnalysis(hypothesis.id)}
            />
          </div>

          {/* Analysis Sections for this hypothesis */}
          {analyses
            .filter(analysis => analysis.hypothesisId === hypothesis.id)
            .map((analysis, analysisIndex) => (
              <div key={analysis.id}>
                {/* Analysis Section */}
                <div id={`analysis-${analysis.id}`}>
                  <AnalysisSection
                    analysis={analysis}
                    hypothesisIndex={index}
                    analysisIndex={analysisIndex}
                    isActive={currentSection === `analysis-${analysis.id}`}
                  />
                </div>

                {/* Output Section */}
                <div id={`output-${analysis.id}`}>
                  <OutputSection
                    analysisId={analysis.id}
                    isActive={currentSection === `output-${analysis.id}`}
                  />
                </div>
              </div>
            ))
          }
        </div>
      ))}

      {/* Add Hypothesis Button */}
      <div className="flex justify-center py-8">
        <Button
          onClick={handleAddHypothesis}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Hypothesis</span>
        </Button>
      </div>

      {/* Insights Section - Show if any insights exist */}
      {insights.length > 0 && (
        <div id="insights-section">
          <InsightSection
            projectId={projectId}
            isActive={currentSection === 'insights-section'}
          />
        </div>
      )}

      {/* Empty State */}
      {hypotheses.length === 0 && datasets.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-500 mb-4">
            Start by uploading a dataset, then create your first hypothesis.
          </div>
        </div>
      )}
    </div>
  );
}