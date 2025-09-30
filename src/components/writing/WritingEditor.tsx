'use client';

import { useState, useEffect } from 'react';
import { Search, Lightbulb, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface WritingEditorProps {
  projectId: string;
}

interface WritingSuggestion {
  id: string;
  type: 'tone' | 'grammar' | 'evidence' | 'clarity';
  start: number;
  end: number;
  text: string;
  suggestion: string;
  color: string;
}

export default function WritingEditor({ projectId }: WritingEditorProps) {
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [showRemembranceAgent, setShowRemembranceAgent] = useState(false);
  const [showAlternativeAnalysis, setShowAlternativeAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load content from API or store
  useEffect(() => {
    // TODO: Fetch article content from API based on projectId
    // fetchArticleContent(projectId);
  }, [projectId]);

  // Analyze writing for suggestions
  useEffect(() => {
    if (content.trim().length > 50) {
      const timeoutId = setTimeout(() => {
        analyzeWriting();
      }, 1000); // Debounce analysis

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [content]);

  const analyzeWriting = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      // TODO: Call AI API to analyze writing
      // const analysis = await analyzeWritingContent(content, projectId);
      // setSuggestions(analysis.suggestions);
    } catch (error) {
      console.error('Writing analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    const beforeText = content.substring(0, suggestion.start);
    const afterText = content.substring(suggestion.end);
    const newContent = beforeText + suggestion.suggestion + afterText;
    
    setContent(newContent);
    setSuggestions(suggestions.filter(s => s.id !== suggestionId));
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // TODO: Auto-save content
    // autoSaveContent(projectId, newContent);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Writing Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Article Writing</h3>
        <p className="text-sm text-gray-500 mt-1">AI-assisted writing with real-time suggestions</p>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <Button
          onClick={() => setShowRemembranceAgent(!showRemembranceAgent)}
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>View Relevant Analysis</span>
        </Button>
        
        <Button
          onClick={() => setShowAlternativeAnalysis(!showAlternativeAnalysis)}
          variant="outline"
          size="sm"
          className="w-full flex items-center justify-center space-x-2"
        >
          <Lightbulb className="w-4 h-4" />
          <span>Suggest Alternative Analysis</span>
        </Button>
      </div>

      {/* Writing Area */}
      <div className="flex-1 flex flex-col">
        {/* Text Editor */}
        <div className="flex-1 p-4">
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your data journalism article..."
            className="w-full h-full resize-none font-serif text-base leading-relaxed"
            style={{ minHeight: '400px' }}
          />
          {isAnalyzing && (
            <div className="mt-2 text-xs text-gray-500">
              Analyzing writing...
            </div>
          )}
        </div>

        {/* Suggestions Panel */}
        {suggestions.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Writing Suggestions</h4>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: suggestion.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">"{suggestion.text}"</span>
                      </p>
                      <p className="text-xs text-gray-500 mb-2">{suggestion.suggestion}</p>
                      <Button
                        onClick={() => applySuggestion(suggestion.id)}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        Apply Suggestion
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Remembrance Agent Panel */}
      {showRemembranceAgent && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <div className="flex items-center space-x-2 mb-3">
            <Search className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">Relevant Analysis</h4>
          </div>
          <div className="space-y-2">
            {/* TODO: Load relevant analysis from context */}
            <p className="text-sm text-gray-600">
              No relevant analysis found yet. Start analyzing data in the notebook to see suggestions here.
            </p>
          </div>
        </div>
      )}

      {/* Alternative Analysis Panel */}
      {showAlternativeAnalysis && (
        <div className="border-t border-gray-200 p-4 bg-amber-50">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-medium text-amber-900">Suggested Analysis</h4>
          </div>
          <div className="space-y-2">
            {/* TODO: Generate analysis suggestions based on writing context */}
            <p className="text-sm text-gray-600">
              Start writing about your data to get analysis suggestions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}