'use client';

import { useState } from 'react';
import { FileOutput, Plus, Clock, AlertCircle, Image, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';

interface OutputSectionProps {
  analysisId: string;
  isActive: boolean;
}

// Mock output data - in real app, this would come from Pyodide execution
const mockOutput = {
  textOutput: `Correlation coefficient: 0.847
Statistical significance: p < 0.001

Dataset Summary:
- Total records: 1,000
- Mean age: 34.2 years
- Mean purchase amount: $124.50`,
  
  plotImage: '/api/placeholder/600/400', // Mock plot image
  
  executionTime: 1.23,
  
  error: null, // null means no error
};

export function OutputSection({ analysisId, isActive }: OutputSectionProps) {
  const [showInsightForm, setShowInsightForm] = useState(false);
  const [insightText, setInsightText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  
  const { 
    analyses, 
    insights,
    tags,
    addInsight 
  } = useProjectStore();

  // Find the analysis
  const analysis = analyses.find(a => a.id === analysisId);
  
  // Check if analysis has been executed (has code)
  const hasOutput = analysis?.code && analysis.code.trim().length > 0;
  
  // Mock output for demonstration
  const output = hasOutput ? mockOutput : null;

  // Handle insight creation
  const handleAddInsight = () => {
    if (!insightText.trim() || !selectedTag) {
      alert('Please enter insight text and select a tag');
      return;
    }

    const newInsight = {
      id: `insight-${Date.now()}`,
      projectId: analysis?.projectId || '',
      analysisOutputId: `output-${analysisId}`,
      tagId: selectedTag,
      content: insightText.trim(),
      position: insights.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addInsight(newInsight);
    setInsightText('');
    setSelectedTag('');
    setShowInsightForm(false);

    console.log('Added insight:', newInsight);
  };

  // Handle creating new tag
  const handleCreateTag = () => {
    // TODO: Implement tag creation modal
    console.log('Create new tag');
  };

  return (
    <Card 
      className={`
        transition-all duration-200 border-l-4 border-l-yellow-400
        ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{ backgroundColor: '#FFFDE7' }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileOutput className="w-5 h-5 text-yellow-600" />
            <span>Output</span>
            {hasOutput && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Executed
              </Badge>
            )}
          </div>
          
          {/* Add Insight Button */}
          {hasOutput && (
            <Button
              onClick={() => setShowInsightForm(true)}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Insight
            </Button>
          )}
        </CardTitle>
        
        <CardDescription>
          {hasOutput 
            ? 'Results from code execution - add insights about your findings'
            : 'Run the analysis code to see output here'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasOutput ? (
          /* No Output State */
          <div className="text-center py-8 text-gray-500">
            <FileOutput className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <div className="text-lg font-medium mb-2">No output yet</div>
            <div className="text-sm">
              Execute the analysis code above to see results here
            </div>
          </div>
        ) : (
          /* Output Display */
          <div className="space-y-4">
            {/* Execution Info */}
            <div className="flex items-center justify-between text-sm text-gray-600 bg-white p-3 rounded border">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Executed in {output?.executionTime}s</span>
                </div>
                <div className="text-green-600">✓ Success</div>
              </div>
              <div className="text-xs">
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Error Display */}
            {output?.error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <div className="flex items-center space-x-2 text-red-800 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Execution Error</span>
                </div>
                <pre className="text-sm text-red-700 whitespace-pre-wrap font-mono">
                  {output.error}
                </pre>
              </div>
            )}

            {/* Text Output */}
            {output?.textOutput && (
              <div className="bg-white border rounded">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Console Output</span>
                </div>
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-gray-800 overflow-x-auto">
                  {output.textOutput}
                </pre>
              </div>
            )}

            {/* Plot Output */}
            {output?.plotImage && (
              <div className="bg-white border rounded">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center space-x-2">
                  <Image className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Visualization</span>
                </div>
                <div className="p-4">
                  <div className="bg-gray-100 rounded h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Image className="w-12 h-12 mx-auto mb-2" />
                      <div>Matplotlib plot would appear here</div>
                      <div className="text-xs">
                        Integration with Pyodide will render actual plots
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insight Creation Form */}
        {showInsightForm && (
          <div className="bg-white p-4 border border-yellow-300 rounded">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Write your insight
                </label>
                <textarea
                  placeholder="What does this analysis tell you? What patterns do you see?"
                  value={insightText}
                  onChange={(e) => setInsightText(e.target.value)}
                  className="w-full min-h-[100px] p-3 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select tag
                </label>
                <div className="flex space-x-2">
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="">Choose a tag...</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                  
                  <Button
                    variant="outline"
                    onClick={handleCreateTag}
                    className="whitespace-nowrap"
                  >
                    New Tag
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInsightForm(false);
                    setInsightText('');
                    setSelectedTag('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddInsight}
                  disabled={!insightText.trim() || !selectedTag}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Save Insight
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Insights for this Output */}
        {insights
          .filter(insight => insight.analysisOutputId === `output-${analysisId}`)
          .map(insight => {
            const tag = tags.find(t => t.id === insight.tagId);
            return (
              <div 
                key={insight.id}
                className="bg-white p-3 rounded border"
                style={{ 
                  borderLeft: `4px solid ${tag?.color || '#gray'}`,
                  backgroundColor: `${tag?.color || '#gray'}10` 
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    style={{ 
                      backgroundColor: tag?.color || '#gray',
                      color: 'white' 
                    }}
                  >
                    {tag?.name || 'Unknown Tag'}
                  </Badge>
                  <div className="text-xs text-gray-500">
                    {new Date(insight.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm text-gray-800">
                  {insight.content}
                </div>
              </div>
            );
          })
        }
      </CardContent>
    </Card>
  );
}