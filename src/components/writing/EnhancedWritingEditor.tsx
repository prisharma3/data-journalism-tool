/**
 * ENHANCED WRITING EDITOR
 * TipTap editor with claim evaluation integration
 */

import React, { useState, useEffect} from 'react';
import { useClaimEvaluation } from '@/hooks/useClaimEvaluation';
import { SuggestionPanel } from './SuggestionPanel';
import { TextWithClaims } from './TextWithClaims';
import { ToulminModal } from './ToulminModal';

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
    const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
    
// Sync with initialContent whenever it changes (from store)
useEffect(() => {
    if (initialContent !== undefined) {
      setContent(initialContent);
    }
  }, [initialContent]);

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

// Handle content change from editor
// Handle content change from editor
const handleContentChange = (newContent: string, newPos?: number) => {
    setContent(newContent);
    if (newPos !== undefined) {
      setCursorPosition(newPos);
    }
    // Call parent's onChange if provided
    if (onContentChange) {
      onContentChange(newContent);
    }
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
          alert('Analysis suggestions generated! Check console for now.');
        } catch (err) {
          console.error('Failed to suggest analyses:', err);
        }
      }
    } else {
      // Generate claim modifications and apply to text
      const claim = claims.find(c => c.id === suggestion.claimId);
      if (!claim) return;
  
      try {
        const modificationType = 
          suggestion.type === 'weaken-claim' ? 'weaken' :
          suggestion.type === 'add-caveat' ? 'caveat' :
          suggestion.type === 'add-qualifier' ? 'weaken' :
          'weaken';
  
        // Get the full evaluation for this claim
        const evalResponse = await fetch('/api/claims/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            claim,
            notebookContext,
          }),
        });
  
        if (!evalResponse.ok) {
          throw new Error('Failed to evaluate claim');
        }
  
        const evalData = await evalResponse.json();
  
        // Generate modifications
        const result = await generateModifications(
          claim.text,
          evalData.toulminDiagram,
          modificationType as any
        );
  
        console.log('Modification suggestions:', result.suggestions);
  
        // Show user the options and let them pick one
        if (result.suggestions && result.suggestions.length > 0) {
          const choice = await showModificationChoice(result.suggestions, result.explanations);
          
          if (choice !== null) {
            // Replace the claim text with the selected suggestion
            const newText = 
              content.substring(0, claim.position.from) +
              result.suggestions[choice] +
              content.substring(claim.position.to);
            
            handleContentChange(newText, claim.position.from);
            
            // Show success message
            alert('Claim updated successfully!');
          }
        }
      } catch (err) {
        console.error('Failed to generate modifications:', err);
        alert('Failed to generate suggestions. Please try again.');
      }
    }
  };
  
  // Helper function to show modification choices
  const showModificationChoice = (suggestions: string[], explanations: string[]): Promise<number | null> => {
    return new Promise((resolve) => {
      const message = suggestions.map((s, i) => `${i + 1}. ${s}\n   ${explanations[i]}`).join('\n\n');
      const choice = prompt(`Choose a replacement (1-${suggestions.length}):\n\n${message}`);
      
      if (choice === null) {
        resolve(null);
      } else {
        const num = parseInt(choice) - 1;
        if (num >= 0 && num < suggestions.length) {
          resolve(num);
        } else {
          resolve(null);
        }
      }
    });
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const handleClaimClick = async (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;
  
    setSelectedClaimId(claimId);
    setIsModalOpen(true);
  
    // Fetch evaluation for this claim
    try {
      const response = await fetch('/api/claims/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim,
          notebookContext,
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        setSelectedEvaluation(data.toulminDiagram);
      }
    } catch (err) {
      console.error('Failed to load evaluation:', err);
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClaimId(null);
    setSelectedEvaluation(null);
  };

  const handleViewEvidence = (cellId: string) => {
    // TODO: Scroll to and highlight the evidence in notebook
    console.log('View evidence from cell:', cellId);
    alert(`Evidence viewing will open the notebook and highlight cell: ${cellId}`);
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
{/* Editor - Split View */}
<div className="flex-1 overflow-y-auto bg-white">
          <div className="grid grid-cols-2 gap-4 p-8 h-full">
            {/* Editable textarea */}
            <div className="relative">
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Edit Mode
              </label>
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
                className="w-full h-full p-4 text-base leading-relaxed resize-none focus:outline-none font-serif border border-gray-200 rounded-lg"
              />
            </div>

            {/* Preview with claim underlines */}
            <div className="relative border-l border-gray-200 pl-4">
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Preview with Claims ({claims.length})
              </label>
              <div className="p-4 bg-gray-50 rounded-lg min-h-full">
                <TextWithClaims
                  text={content}
                  claims={claims}
                  suggestions={suggestions}
                  onClaimClick={handleClaimClick}
                />
              </div>
            </div>
          </div>
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
  suggestions={suggestions.filter(s => !dismissedSuggestions.has(s.id))}
        relevantAnalyses={relevantAnalyses}
        isLoadingSuggestions={isEvaluating}
        isLoadingAnalyses={isLoadingRelevant}
        onAcceptSuggestion={handleAcceptSuggestion}
        onDismissSuggestion={handleDismissSuggestion}
        onViewEvidence={handleViewEvidence}
      />

      {/* Toulmin Modal */}
      <ToulminModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        claim={claims.find(c => c.id === selectedClaimId) || null}
        evaluation={selectedEvaluation}
        suggestions={suggestions.filter(s => !dismissedSuggestions.has(s.id))}
        onAcceptSuggestion={handleAcceptSuggestion}
      />
    </div>
  );
}