'use client';

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NaturalLanguageInputProps {
  onCodeGenerated: (code: string) => void;
  datasetInfo?: {
    rows: number;
    columns: number;
    columnNames: string[];
    columnTypes: Record<string, string>;
  } | null;
}

export default function NaturalLanguageInput({
  onCodeGenerated,
  datasetInfo,
}: NaturalLanguageInputProps) {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!query.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          datasetInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }

      const data = await response.json();
      onCodeGenerated(data.code);
      setQuery(''); // Clear input after successful generation
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="mb-4">
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">
            AI Code Generation
          </h3>
        </div>

        <div className="space-y-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the analysis you want... (e.g., 'Show the distribution of sepal length' or 'Create a correlation matrix')"
            className="w-full p-3 rounded border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none bg-white text-gray-900"
            rows={2}
            disabled={isGenerating}
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-700">
              Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-blue-800">Enter</kbd> to generate code
            </p>
            <Button
              onClick={handleGenerate}
              disabled={!query.trim() || isGenerating}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="mr-1" />
                  Generate Code
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!datasetInfo && (
            <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700">
                Upload a dataset first to get context-aware code generation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}