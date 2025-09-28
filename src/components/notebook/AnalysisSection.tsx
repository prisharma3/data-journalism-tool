'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Play, Edit, Copy, Trash2, Code, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';
import { Analysis } from '@/types';
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded border flex items-center justify-center">
      <div className="text-gray-500">Loading code editor...</div>
    </div>
  ),
});

interface AnalysisSectionProps {
  analysis: Analysis;
  hypothesisIndex: number;
  analysisIndex: number;
  isActive: boolean;
}

export function AnalysisSection({ 
  analysis, 
  hypothesisIndex, 
  analysisIndex, 
  isActive 
}: AnalysisSectionProps) {
  const [mode, setMode] = useState<'query' | 'code'>('query');
  const [query, setQuery] = useState(analysis.query);
  const [code, setCode] = useState(analysis.code);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  
  const { 
    updateAnalysis, 
    removeAnalysis,
    datasets 
  } = useProjectStore();

  // Check if we have a dataset
  const hasDataset = datasets.length > 0;
  const isExecuted = analysis.code && analysis.code.length > 0;

  // Initialize mode based on existing data
  useEffect(() => {
    if (analysis.code) {
      setMode('code');
    }
  }, [analysis.code]);

  // Generate code from natural language query
  const handleGenerateCode = async () => {
    if (!query.trim()) {
      alert('Please enter a query first');
      return;
    }

    if (!hasDataset) {
      alert('Please upload a dataset first');
      return;
    }

    setIsGenerating(true);
    
    try {
      // TODO: Integrate with Google Gemini API
      // For now, generate mock Python code based on query
      const mockCode = generateMockCode(query, datasets[0]);
      
      setCode(mockCode);
      setMode('code');
      
      // Update analysis in store
      updateAnalysis(analysis.id, {
        query: query.trim(),
        code: mockCode,
        explanation: `Generated analysis for: ${query}`,
        updatedAt: new Date().toISOString(),
      });

      console.log('Generated code for query:', query);
      
    } catch (error) {
      console.error('Error generating code:', error);
      alert('Error generating code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute Python code
  const handleExecuteCode = async () => {
    if (!code.trim()) {
      alert('No code to execute');
      return;
    }

    setIsExecuting(true);
    
    try {
      // TODO: Integrate with Pyodide for real Python execution
      console.log('Executing code:', code);
      
      // Mock execution - in real app, this would use Pyodide
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Code executed successfully');
      
    } catch (error) {
      console.error('Error executing code:', error);
      alert('Error executing code. Check console for details.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard');
  };

  // Delete analysis
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      removeAnalysis(analysis.id);
    }
  };

  // Duplicate analysis
  const handleDuplicate = () => {
    // TODO: Implement duplication
    console.log('Duplicate analysis:', analysis.id);
  };

  return (
    <Card 
      className={`
        transition-all duration-200 border-l-4 border-l-blue-400
        ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{ backgroundColor: '#E3F2FD' }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Analysis {hypothesisIndex + 1}.{analysisIndex + 1}</span>
            {isExecuted && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Executed
              </Badge>
            )}
          </div>
          
          {/* Toolbar */}
          <div className="flex items-center space-x-2">
            {mode === 'code' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExecuteCode}
                  disabled={isExecuting || !code.trim()}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isExecuting ? 'Running...' : 'Run'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCodePanel(!showCodePanel)}
                >
                  <Code className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode(mode === 'query' ? 'code' : 'query')}
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              disabled={!code.trim()}
            >
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
        
        <CardDescription>
          {mode === 'query' 
            ? 'Describe the analysis you want to perform in natural language'
            : 'Generated Python code for your analysis'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {mode === 'query' ? (
          /* Query Mode */
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Describe the analysis you want to perform... (e.g., 'correlation between age and purchase amount')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateCode()}
                className="bg-white border-blue-200 focus:border-blue-400"
              />
              
              <div className="text-xs text-gray-500">
                Press Enter or click Generate to create Python code
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {!hasDataset && (
                  <span className="text-red-600">⚠ Upload a dataset first</span>
                )}
              </div>
              
              <Button
                onClick={handleGenerateCode}
                disabled={isGenerating || !query.trim() || !hasDataset}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? 'Generating...' : 'Generate Code'}
              </Button>
            </div>
          </div>
        ) : (
          /* Code Mode */
          <div className="space-y-4">
            {/* Query Display */}
            <div className="bg-white p-3 rounded border border-blue-200">
              <div className="text-sm font-medium text-gray-900 mb-1">Query:</div>
              <div className="text-sm text-gray-700">{query}</div>
            </div>

            {/* Code Editor */}
            <div className="bg-white rounded border border-blue-200 overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b border-blue-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Python Code</span>
                <div className="text-xs text-gray-500">
                  {code.split('\n').length} lines
                </div>
              </div>
              
              <MonacoEditor
                height="300px"
                defaultLanguage="python"
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  theme: 'vs-light',
                }}
              />
            </div>

            {/* Explanation */}
            {analysis.explanation && (
              <div className="bg-blue-50 p-3 rounded border-l-4 border-l-blue-400">
                <div className="text-sm font-medium text-blue-900 mb-1">Explanation</div>
                <div className="text-sm text-blue-800">{analysis.explanation}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock code generation function
function generateMockCode(query: string, dataset: any): string {
  const columns = dataset.columns || ['column1', 'column2'];
  
  // Simple code generation based on query keywords
  let code = `# Analysis: ${query}\nimport pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n`;
  
  if (query.toLowerCase().includes('correlation')) {
    code += `# Calculate correlation\ncorrelation = df['${columns[0]}'].corr(df['${columns[1] || columns[0]}']\nprint(f"Correlation coefficient: {correlation:.3f}")\n\n`;
    code += `# Create scatter plot\nplt.figure(figsize=(10, 6))\nsns.scatterplot(data=df, x='${columns[0]}', y='${columns[1] || columns[0]}')\nplt.title('${query}')\nplt.show()`;
  } else if (query.toLowerCase().includes('trend') || query.toLowerCase().includes('time')) {
    code += `# Time series analysis\nplt.figure(figsize=(12, 6))\nplt.plot(df['${columns[0]}'], df['${columns[1] || columns[0]}']\nplt.title('${query}')\nplt.xlabel('${columns[0]}')\nplt.ylabel('${columns[1] || columns[0]}')\nplt.show()`;
  } else {
    code += `# Descriptive statistics\nprint(df.describe())\n\n# Basic visualization\nplt.figure(figsize=(10, 6))\ndf['${columns[0]}'].hist(bins=20)\nplt.title('Distribution of ${columns[0]}')\nplt.show()`;
  }
  
  return code;
}