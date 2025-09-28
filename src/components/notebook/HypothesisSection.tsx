'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useProjectStore } from '@/stores/projectStore';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Hypothesis } from '@/types';

interface HypothesisSectionProps {
  hypothesis: Hypothesis;
  index: number;
  isActive: boolean;
  onAddAnalysis: () => void;
}

export function HypothesisSection({ 
  hypothesis, 
  index, 
  isActive, 
  onAddAnalysis 
}: HypothesisSectionProps) {
  const [content, setContent] = useState(hypothesis.content);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const { 
    updateHypothesis, 
    removeHypothesis, 
    analyses 
  } = useProjectStore();

  // Get analyses for this hypothesis
  const hypothesisAnalyses = analyses.filter(a => a.hypothesisId === hypothesis.id);
  const hasAnalyses = hypothesisAnalyses.length > 0;

  // Auto-save functionality
  const { debouncedSave, saveNow } = useAutoSave({
    delay: 2000, // 2 seconds
    onSave: async (data: string) => {
      if (data.trim() !== hypothesis.content) {
        setIsSaving(true);
        try {
          // Update hypothesis in store
          updateHypothesis(hypothesis.id, {
            content: data.trim(),
            updatedAt: new Date().toISOString(),
          });
          
          // TODO: Save to database via API
          console.log('Auto-saving hypothesis:', data);
          
          setLastSaved(new Date().toLocaleTimeString());
        } catch (error) {
          console.error('Error saving hypothesis:', error);
        } finally {
          setIsSaving(false);
        }
      }
    },
  });

  // Trigger auto-save when content changes
  useEffect(() => {
    if (content.trim() && content !== hypothesis.content) {
      debouncedSave(content);
    }
  }, [content, hypothesis.content, debouncedSave]);

  // Handle manual save
  const handleManualSave = async () => {
    await saveNow(content);
  };

  // Handle delete hypothesis
  const handleDelete = () => {
    if (hasAnalyses) {
      alert('Cannot delete hypothesis with existing analyses. Delete analyses first.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this hypothesis?')) {
      removeHypothesis(hypothesis.id);
    }
  };

  return (
    <Card 
      className={`
        transition-all duration-200 border-l-4 border-l-purple-400
        ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{ backgroundColor: '#F3E5F5' }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <span>Hypothesis {index + 1}</span>
            {hasAnalyses && (
              <Badge variant="secondary">
                {hypothesisAnalyses.length} analysis{hypothesisAnalyses.length !== 1 ? 'es' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Auto-save indicator */}
            {isSaving && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Save className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            
            {lastSaved && !isSaving && (
              <div className="text-xs text-gray-500">
                Saved at {lastSaved}
              </div>
            )}

            {/* Manual save button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSave}
              disabled={isSaving || content === hypothesis.content}
            >
              <Save className="w-4 h-4" />
            </Button>

            {/* Delete button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={hasAnalyses}
              className={hasAnalyses ? 'opacity-50' : 'text-red-600 hover:text-red-700'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
        
        <CardDescription>
          Enter your research hypothesis. This will guide your data analysis.
          {hasAnalyses && ' (Cannot edit - analyses exist for this hypothesis)'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hypothesis Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Enter your research hypothesis... (e.g., 'Customers aged 25-35 have higher purchase amounts than other age groups')"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={hasAnalyses} // Lock editing if analyses exist
            className={`
              min-h-[120px] resize-none bg-white border-purple-200 focus:border-purple-400
              ${hasAnalyses ? 'bg-gray-50 cursor-not-allowed' : ''}
            `}
            rows={4}
          />
          
          {content.length > 0 && (
            <div className="text-xs text-gray-500">
              {content.length} characters
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-purple-200">
          <div className="text-sm text-gray-600">
            {content.trim() ? (
              hasAnalyses ? (
                'Hypothesis is locked - analyses exist'
              ) : (
                'Auto-saves after 2 seconds of no typing'
              )
            ) : (
              'Start typing your hypothesis...'
            )}
          </div>

          {/* Add Analysis Button */}
          {content.trim() && (
            <Button
              onClick={onAddAnalysis}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Analysis
            </Button>
          )}
        </div>

        {/* Existing Analyses Preview */}
        {hasAnalyses && (
          <div className="bg-white p-3 rounded border border-purple-200">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Analyses for this hypothesis:
            </div>
            <div className="space-y-1">
              {hypothesisAnalyses.map((analysis, analysisIndex) => (
                <div key={analysis.id} className="text-xs text-gray-600">
                  A{index + 1}.{analysisIndex + 1}: {analysis.query || 'Untitled analysis'}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}