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

const [loadingModifications, setLoadingModifications] = useState<Set<string>>(new Set());

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
      
        // CRITICAL FIX: Dismiss ALL suggestions for this claim
        const claimSuggestions = suggestions
          .filter(s => s.claimId === claim.id)
          .map(s => s.id);
        
        setDismissedSuggestions(prev => new Set([...prev, ...claimSuggestions]));
      }
      return;
    }
  
// Handle CORRECT VALUE
if (suggestion.type === 'correct-value') {
  const claim = claims.find(c => c.id === suggestion.claimId);
  if (!claim) return;
  
  const suggestedFix = suggestion.metadata?.suggestedFix;
  if (suggestedFix) {
    // Replace the claim text with the corrected version
    const newText = 
      content.substring(0, claim.position.from) +
      suggestedFix +
      content.substring(claim.position.to);
    
    // Mark this position as fixed
    setFixedPositions(prev => [...prev, {
      from: claim.position.from,
      to: claim.position.from + suggestedFix.length,
      fixedAt: new Date()
    }]);
    
    // Update content
    setContent(newText);
    if (onContentChange) {
      onContentChange(newText);
    }
    
    // Dismiss this suggestion
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
          
          console.log('Analysis suggestions set for:', suggestionId);
        } else {
          // Fallback: Use the suggestAnalyses API
          const result = await suggestAnalyses(claim.text, []);
          
          setAnalysisSuggestions(prev => ({
            ...prev,
            [suggestionId]: result.suggestions || []
          }));
          
          console.log('Total suggestions collected:', result.suggestions?.length || 0);
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

const handleGenerateModification = async (suggestionId: string) => {
  const suggestion = suggestions.find(s => s.id === suggestionId);
  if (!suggestion) return;

  const claim = claims.find(c => c.id === suggestion.claimId);
  if (!claim) return;

  // Add to loading set
  setLoadingModifications(prev => new Set([...prev, suggestionId]));
  setExpandedSuggestionId(suggestionId);

  try {
    const response = await fetch('/api/claims/suggest-modifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claimText: claim.text,
        toulminEvaluation: { overallScore: 50, strength: 'moderate', issues: [] }, // Minimal evaluation
        modificationType: suggestion.type,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate modifications');

    const data = await response.json();
    
    setModificationOptions(prev => ({
      ...prev,
      [suggestionId]: {
        claim,
        suggestions: data.suggestions,
        explanations: data.explanations,
      }
    }));
  } catch (error) {
    console.error('Error generating modifications:', error);
    alert('Failed to generate modification options. Please try again.');
    setExpandedSuggestionId(null);
  } finally {
    // Remove from loading set
    setLoadingModifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(suggestionId);
      return newSet;
    });
  }
};

const handleClaimClick = (claimId: string) => {
  console.log('=== handleClaimClick ===');
  console.log('Claim ID:', claimId);
  
  // Set highlight
  setHighlightedClaimId(claimId);
  
  // Scroll to the claim text in editor
  setTimeout(() => {
    const claimSpan = document.querySelector(`[data-claim-id="${claimId}"]`);
    if (claimSpan) {
      claimSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
  
  // ALSO scroll to the corresponding suggestion in the panel
  setTimeout(() => {
    const suggestionForClaim = suggestions.find(s => s.claimId === claimId);
    if (suggestionForClaim) {
      const suggestionElement = document.getElementById(`suggestion-${suggestionForClaim.id}`);
      console.log('Scrolling to suggestion:', suggestionForClaim.id, suggestionElement ? 'found' : 'not found');
      
      if (suggestionElement) {
        suggestionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, 100);
};

// Handle clicking suggestion in panel - should scroll to claim text
const handleSuggestionClick = (claimId: string) => {
  console.log('=== Suggestion clicked ===');
  console.log('Claim ID:', claimId);
  
  // Set highlight
  setHighlightedClaimId(claimId);
  
  // Scroll to the claim text in editor
  setTimeout(() => {
    const claimSpan = document.querySelector(`[data-claim-id="${claimId}"]`);
    if (claimSpan) {
      claimSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
};

  const handleViewEvidence = (cellId: string) => {
    // Dispatch custom event to highlight and scroll to the cell in notebook
    const event = new CustomEvent('highlight-section', {
      detail: { sectionId: cellId },
      bubbles: true,
    });
    window.dispatchEvent(event);
    
    console.log('✨ Highlighting cell in notebook:', cellId);
  };

  // Sync with initialContent whenever it changes (from store)

useEffect(() => {

  if (initialContent !== undefined) {

    setContent(initialContent);

  }

}, [initialContent]);



// Clear dismissed suggestions and other state when claims are re-detected

// This ensures new evaluations show fresh issues

useEffect(() => {

if (claims.length > 0) {

  // Clear dismissed suggestions since claim IDs are new

  setDismissedSuggestions(new Set());

  // Clear expanded state

  setExpandedSuggestionId(null);

  // Clear modification options

  setModificationOptions({});

  setAnalysisSuggestions({});

  // Clear fixed positions (they're no longer valid with new claim positions)

  setFixedPositions([]);

}

}, [claims]); // Trigger when claims array changes

  return (
      <div className="flex h-full overflow-hidden">
        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-200 bg-white px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
  type="checkbox"
  checked={enabled}
  onChange={(e) => {
    const newEnabled = e.target.checked;
    setEnabled(newEnabled);
    
    // If re-enabling, don't trigger full re-detection
    // The useClaimEvaluation hook will handle it
    console.log('Evaluation', newEnabled ? 'enabled' : 'disabled');
  }}
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
  {(() => {
    const activeIssuesCount = suggestions.filter(s => !dismissedSuggestions.has(s.id)).length;
    return activeIssuesCount > 0 ? (
      <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">
        {activeIssuesCount} issues
      </span>
    ) : null;
  })()}
</div>
        </div>

{/* Editor - Single editable view with inline claim highlights */}
<div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-8">
          
          {/* Underline legend */}
{claims.length > 0 && (
  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="underline decoration-green-500 decoration-2">Green</span>
        <span className="text-gray-600">- No issues</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="underline decoration-blue-500 decoration-2">Blue</span>
        <span className="text-gray-600">- Needs analysis</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="underline decoration-yellow-500 decoration-2">Yellow</span>
        <span className="text-gray-600">- Weaken language</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="underline decoration-orange-500 decoration-2">Orange</span>
        <span className="text-gray-600">- Add caveat</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="underline decoration-purple-500 decoration-2">Purple</span>
        <span className="text-gray-600">- Correct value</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="underline decoration-red-500 decoration-wavy decoration-2">Red wavy</span>
        <span className="text-gray-600">- Remove claim</span>
      </div>
    </div>
  </div>
)}

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
  isEvaluating={isEvaluating}
/>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Error: {error}
          </div>
        )}
      </div>

      <SuggestionPanel
projectId={projectId}
onSuggestionClick={handleSuggestionClick}  
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
  onGenerateModification={handleGenerateModification}
  expandedSuggestionId={expandedSuggestionId}
  analysisSuggestions={analysisSuggestions}
  modificationOptions={modificationOptions}
  onCloseExpanded={() => setExpandedSuggestionId(null)}
  loadingModifications={loadingModifications}
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
    
    // CRITICAL FIX: Dismiss ALL suggestions for this claim
    const claimSuggestions = suggestions
      .filter(s => s.claimId === claim.id)
      .map(s => s.id);
    
    setDismissedSuggestions(prev => new Set([...prev, ...claimSuggestions]));
    
    // Update content
    setContent(newText);
    if (onContentChange) {
      onContentChange(newText);
    }
    
    setExpandedSuggestionId(null);
  }}
/>
    </div>
  );
}