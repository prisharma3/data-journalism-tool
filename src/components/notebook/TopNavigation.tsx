'use client';

import { useState } from 'react';
import { Database, Lightbulb, BarChart3, Bookmark, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useProjectStore } from '@/stores/projectStore';
import { Badge } from '@/components/ui/badge';

interface TopNavigationProps {
  onSectionClick: (sectionId: string) => void;
  currentSection?: string;
}

export function TopNavigation({ onSectionClick, currentSection }: TopNavigationProps) {
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  
  const { 
    datasets, 
    hypotheses, 
    analyses, 
    insights,
    tags 
  } = useProjectStore();

  // Group analyses by hypothesis
  const analysesByHypothesis = hypotheses.map(hypothesis => ({
    hypothesis,
    analyses: analyses.filter(analysis => analysis.hypothesisId === hypothesis.id)
  }));

  const handleDatasetClick = () => {
    onSectionClick('dataset-section');
  };

  const handleHypothesisClick = (hypothesisId: string) => {
    onSectionClick(`hypothesis-${hypothesisId}`);
  };

  const handleAnalysisClick = (analysisId: string) => {
    onSectionClick(`analysis-${analysisId}`);
  };

  const handleInsightsClick = () => {
    setShowInsightsPanel(!showInsightsPanel);
    onSectionClick('insights-section');
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Dataset Button */}
          <Button
            variant={currentSection === 'dataset-section' ? 'default' : 'ghost'}
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200"
            onClick={handleDatasetClick}
          >
            <Database className="w-4 h-4" />
            <span>
              Dataset {datasets.length > 0 && `(${datasets[0].fileName})`}
            </span>
          </Button>

          {/* Hypotheses Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 bg-purple-100 hover:bg-purple-200"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Hypotheses ({hypotheses.length})</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              {hypotheses.length === 0 ? (
                <DropdownMenuItem disabled>
                  No hypotheses yet
                </DropdownMenuItem>
              ) : (
                hypotheses.map((hypothesis, index) => (
                  <DropdownMenuItem
                    key={hypothesis.id}
                    onClick={() => handleHypothesisClick(hypothesis.id)}
                    className="flex-col items-start p-3"
                  >
                    <div className="font-medium text-sm">
                      H{index + 1}: {hypothesis.content.substring(0, 40)}...
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created {new Date(hypothesis.createdAt).toLocaleDateString()}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Analyses Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 bg-blue-100 hover:bg-blue-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analyses ({analyses.length})</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              {analysesByHypothesis.length === 0 ? (
                <DropdownMenuItem disabled>
                  No analyses yet
                </DropdownMenuItem>
              ) : (
                analysesByHypothesis.map((group, groupIndex) => (
                  <div key={group.hypothesis.id}>
                    {/* Hypothesis header */}
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                      H{groupIndex + 1}: {group.hypothesis.content.substring(0, 30)}...
                    </div>
                    
                    {/* Analyses for this hypothesis */}
                    {group.analyses.length === 0 ? (
                      <DropdownMenuItem disabled className="pl-6">
                        No analyses for this hypothesis
                      </DropdownMenuItem>
                    ) : (
                      group.analyses.map((analysis, analysisIndex) => (
                        <DropdownMenuItem
                          key={analysis.id}
                          onClick={() => handleAnalysisClick(analysis.id)}
                          className="flex-col items-start p-3 pl-6"
                        >
                          <div className="font-medium text-sm">
                            A{groupIndex + 1}.{analysisIndex + 1}: {analysis.query.substring(0, 35)}...
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {analysis.explanation || 'No explanation provided'}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Insights Button */}
          <Button
            variant={currentSection === 'insights-section' ? 'default' : 'ghost'}
            className="flex items-center space-x-2 bg-yellow-100 hover:bg-yellow-200"
            onClick={handleInsightsClick}
          >
            <Bookmark className="w-4 h-4" />
            <span>Insights ({insights.length})</span>
          </Button>

          {/* Project Actions */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {datasets.length > 0 ? 'Active' : 'No Data'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Insights Panel (when opened) */}
      {showInsightsPanel && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Insights Management</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowInsightsPanel(false)}
              >
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tags */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Tags ({tags.length})</h4>
                <div className="space-y-1">
                  {tags.length === 0 ? (
                    <div className="text-xs text-gray-500">No tags created</div>
                  ) : (
                    tags.map(tag => (
                      <div 
                        key={tag.id}
                        className="flex items-center space-x-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-xs">{tag.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Insights */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Insights</h4>
                <div className="space-y-2">
                  {insights.slice(0, 3).map(insight => (
                    <div 
                      key={insight.id}
                      className="text-xs text-gray-600 p-2 bg-white rounded border"
                    >
                      {insight.content.substring(0, 50)}...
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <div className="text-xs text-gray-500">No insights yet</div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Search Insights
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Create New Tag
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Export Insights
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}