/**
 * ENHANCED WRITING EDITOR
 * TipTap editor with claim evaluation integration
 */

import React, { useState, useEffect} from 'react';
import { useClaimEvaluation } from '@/hooks/useClaimEvaluation';
import { SuggestionPanel } from './SuggestionPanel';
import { TextWithClaims } from './TextWithClaims';

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

    const [highlightedClaimId, setHighlightedClaimId] = useState<string | null>(null);
const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

    const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);
const [analysisSuggestions, setAnalysisSuggestions] = useState<{[key: string]: any}>({});

const [modificationOptions, setModificationOptions] = useState<{[key: string]: any}>({});

const [fixedPositions, setFixedPositions] = useState<Array<{from: number, to: number, fixedAt: Date}>>([]);
    
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
const handleContentChange = (newContent: string, newPos?: number) => {
    setContent(newContent);
    if (newPos !== undefined) {
      setCursorPosition(newPos);
    }
    
    // Call parent's onContentChange if provided
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  const handleAcceptSuggestion = async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;
  
    // Handle REMOVE CLAIM
    if (suggestion.type === 'remove-claim') {
      const claim = claims.find(c => c.id === suggestion.claimId);
      if (!claim) return;
  
      // Confirm with user before removing
      const confirmed = window.confirm(
        `Are you sure you want to remove this claim?\n\n"${claim.text}"\n\nThis action cannot be undone.`
      );
  
      if (confirmed) {
        // Remove the claim text from content
        const newText = 
          content.substring(0, claim.position.from) +
          content.substring(claim.position.to);
  
        // Mark this position as fixed
        setFixedPositions(prev => [...prev, {
          from: claim.position.from,
          to: claim.position.from,
          fixedAt: new Date()
        }]);
  
        // Update content
        setContent(newText);
        if (onContentChange) {
          onContentChange(newText);
        }
  
        // Dismiss the suggestion
        setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
      }
      return;
    }
  
    // Handle ADD ANALYSIS
    if (suggestion.type === 'add-analysis') {
      // If already expanded, collapse it
      if (expandedSuggestionId === suggestionId) {
        setExpandedSuggestionId(null);
        return;
      }
  
      // Expand and fetch analysis suggestions
      setExpandedSuggestionId(suggestionId);
      
      const claim = claims.find(c => c.id === suggestion.claimId);
      if (claim) {
        try {
          // If we already have a suggested query in metadata, use it
          if (suggestion.metadata?.suggestedQuery) {
            // Create a single analysis suggestion from the metadata
            const analysisSuggestion = {
              title: `Analyze: ${suggestion.metadata.missingConcepts?.join(', ') || 'Evidence'}`,
              naturalLanguageQuery: suggestion.metadata.suggestedQuery,
              explanation: suggestion.explanation || 'Run this analysis to support your claim',
              expectedOutput: 'Data visualization and statistical results',
              priority: 'high' as const,
              estimatedComplexity: 'simple' as const,
              fillsGaps: [suggestion.metadata.gapType || 'missing-evidence'],
            };
  
            setAnalysisSuggestions(prev => ({
              ...prev,
              [suggestionId]: [analysisSuggestion]
            }));
          } else {
            // Fallback: Use the suggestAnalyses API
            const result = await suggestAnalyses(claim.text, []);
            console.log('Analysis suggestions:', result.suggestions);
            
            setAnalysisSuggestions(prev => ({
              ...prev,
              [suggestionId]: result.suggestions || []
            }));
          }
        } catch (err) {
          console.error('Failed to suggest analyses:', err);
          alert('Failed to generate analysis suggestions. Please try again.');
        }
      }
      return;
    }
  
    // Handle MODIFICATION SUGGESTIONS (weaken, caveat, etc.)
    // If already expanded with modifications, collapse it
    if (expandedSuggestionId === suggestionId && modificationOptions[suggestionId]) {
      setExpandedSuggestionId(null);
      return;
    }
  
    // Expand and fetch modification suggestions
    setExpandedSuggestionId(suggestionId);
  
    // Generate claim modifications
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
  
      // Store the modification options for this suggestion ID
      setModificationOptions(prev => ({
        ...prev,
        [suggestionId]: {
          suggestions: result.suggestions || [],
          explanations: result.explanations || [],
          claim: claim
        }
      }));
    } catch (err) {
      console.error('Failed to generate modifications:', err);
      alert('Failed to generate suggestions. Please try again.');
    }
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const handleClaimClick = (claimId: string) => {
    // Toggle highlight
    setHighlightedClaimId(prev => prev === claimId ? null : claimId);
    
    // Find and scroll to the suggestion for this claim
    const suggestionForClaim = suggestions.find(s => s.claimId === claimId);
    if (suggestionForClaim) {
      // Scroll suggestion into view
      const suggestionElement = document.getElementById(`suggestion-${suggestionForClaim.id}`);
      if (suggestionElement) {
        suggestionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
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

{/* Editor - Single editable view with inline claim highlights */}
<div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-8">
          <TextWithClaims
  text={content}
  claims={claims}
  suggestions={suggestions}
  onClaimClick={handleClaimClick}
  highlightedClaimId={highlightedClaimId}
  onContentChange={(newText, newCursor) => {
    handleContentChange(newText, newCursor);
  }}
  isEditable={true}
/>
            
            {/* Claim count indicator */}
            {claims.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                {claims.length} claim{claims.length !== 1 ? 's' : ''} detected • Click underlined text for details
              </div>
            )}
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
projectId={projectId}
onSuggestionClick={handleClaimClick}  
highlightedClaimId={highlightedClaimId} 
  suggestions={suggestions.filter(s => {
    // Filter out dismissed suggestions
    if (dismissedSuggestions.has(s.id)) return false;
    
    // Filter out suggestions for claims that were recently fixed
    const claim = claims.find(c => c.id === s.claimId);
    if (!claim) return true;
    
    const wasRecentlyFixed = fixedPositions.some(fixed => {
      const overlap = !(claim.position.to <= fixed.from || claim.position.from >= fixed.to);
      const recentlyFixed = (new Date().getTime() - fixed.fixedAt.getTime()) < 5000; // 5 seconds
      return overlap && recentlyFixed;
    });
    
    return !wasRecentlyFixed;
  })}
  relevantAnalyses={relevantAnalyses}
  isLoadingSuggestions={isEvaluating}
  isLoadingAnalyses={isLoadingRelevant}
  onAcceptSuggestion={handleAcceptSuggestion}
  onDismissSuggestion={handleDismissSuggestion}
  onViewEvidence={handleViewEvidence}
  expandedSuggestionId={expandedSuggestionId}
  analysisSuggestions={analysisSuggestions}
  modificationOptions={modificationOptions}
  onCloseExpanded={() => setExpandedSuggestionId(null)}
  onSelectModification={(suggestionId, modificationIndex) => {
    const options = modificationOptions[suggestionId];
    if (!options) return;
    
    const claim = options.claim;
    const replacement = options.suggestions[modificationIndex];
    
    // Create new text with replacement
    const newText = 
      content.substring(0, claim.position.from) +
      replacement +
      content.substring(claim.position.to);
    
    // Mark this position as fixed
    setFixedPositions(prev => [...prev, {
      from: claim.position.from,
      to: claim.position.from + replacement.length,
      fixedAt: new Date()
    }]);
    
    // Update content
    setContent(newText);
    if (onContentChange) {
      onContentChange(newText);
    }
    
    setExpandedSuggestionId(null);
    
    // Let TextWithClaims re-render with new content
    // The contentEditable div will update automatically
  }}
/>
    </div>
  );
}