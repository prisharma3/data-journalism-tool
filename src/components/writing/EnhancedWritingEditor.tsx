/**
 * ENHANCED WRITING EDITOR
 * TipTap editor with claim evaluation integration
 */

import React, { useState } from 'react';
import { useClaimEvaluation } from '@/hooks/useClaimEvaluation';
import { SuggestionPanel } from './SuggestionPanel';

interface EnhancedWritingEditorProps {
  projectId: string;
  notebookContext: any;
  activeHypothesis?: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

export function EnhancedWritingEditor({
  projectId,
  notebookContext,
  activeHypothesis,
  initialContent = '',
  onContentChange,
}: EnhancedWritingEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [enabled, setEnabled] = useState(true);

  // Use claim evaluation hook
  const {
    claims,
    suggestions,
    relevantAnalyses,
    isDetecting,
    isEvaluating,
    isLoadingRelevant,
    error,
    generateModifications,
    suggestAnalyses,
    refreshRelevant,
  } = useClaimEvaluation({
    text: content,
    cursorPosition,
    projectId,
    notebookContext,
    activeHypothesis,
    enabled,
  });

  const handleContentChange = (newContent: string, newCursorPos: number) => {
    setContent(newContent);
    setCursorPosition(newCursorPos);
    onContentChange?.(newContent);
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    if (suggestion.type === 'add-analysis') {
      // Suggest analyses for missing evidence
      const claim = claims.find(c => c.id === suggestion.claimId);
      if (claim) {
        try {
          const result = await suggestAnalyses(claim.text, []);
          console.log('Analysis suggestions:', result.suggestions);
          // TODO: Show analysis suggestions modal
        } catch (err) {
          console.error('Failed to suggest analyses:', err);
        }
      }
    } else {
      // Generate claim modifications
      const claim = claims.find(c => c.id === suggestion.claimId);
      if (claim) {
        try {
          const modificationType = 
            suggestion.type === 'weaken-claim' ? 'weaken' :
            suggestion.type === 'add-caveat' ? 'caveat' :
            'reverse';

          const result = await generateModifications(
            claim.text,
            {}, // Would need full evaluation here
            modificationType as any
          );
          console.log('Modification suggestions:', result.suggestions);
          // TODO: Show modification suggestions modal
        } catch (err) {
          console.error('Failed to generate modifications:', err);
        }
      }
    }
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    // TODO: Mark suggestion as dismissed
    console.log('Dismissed suggestion:', suggestionId);
  };

  const handleViewEvidence = (cellId: string) => {
    // TODO: Open focused view of notebook cell
    console.log('View evidence from cell:', cellId);
  };

  return (
    <div className="flex h-full">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-gray-200 bg-white px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded"
              />
              Enable claim evaluation
            </label>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3 ml-auto text-xs text-gray-500">
            {isDetecting && (
              <span className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                Detecting...
              </span>
            )}
            {isEvaluating && (
              <span className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                Evaluating...
              </span>
            )}
            {claims.length > 0 && (
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">
                {claims.length} claims
              </span>
            )}
            {suggestions.length > 0 && (
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">
                {suggestions.length} issues
              </span>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto bg-white">
          <textarea
            value={content}
            onChange={(e) => {
              const newPos = e.target.selectionStart;
              handleContentChange(e.target.value, newPos);
            }}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart);
            }}
            placeholder="Start writing your article... Claims will be automatically detected and evaluated."
            className="w-full h-full p-8 text-base leading-relaxed resize-none focus:outline-none font-serif"
            style={{ minHeight: '600px' }}
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Error: {error}
          </div>
        )}
      </div>

      {/* Suggestion Panel */}
      <SuggestionPanel
        suggestions={suggestions}
        relevantAnalyses={relevantAnalyses}
        isLoadingSuggestions={isEvaluating}
        isLoadingAnalyses={isLoadingRelevant}
        onAcceptSuggestion={handleAcceptSuggestion}
        onDismissSuggestion={handleDismissSuggestion}
        onViewEvidence={handleViewEvidence}
      />
    </div>
  );
}