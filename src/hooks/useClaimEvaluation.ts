/**
 * CLAIM EVALUATION HOOK
 * Manages claim detection, evaluation, and suggestions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ClaimStructure, WritingSuggestion, RelevantAnalysis } from '@/types/writing';
import { debounce } from 'lodash';

interface UseClaimEvaluationProps {
  text: string;
  cursorPosition: number;
  projectId: string;
  notebookContext: any;
  activeHypothesis?: string;
  enabled?: boolean;
}

export function useClaimEvaluation({
  text,
  cursorPosition,
  projectId,
  notebookContext,
  activeHypothesis,
  enabled = true,
}: UseClaimEvaluationProps) {
  const [claims, setClaims] = useState<ClaimStructure[]>([]);
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [relevantAnalyses, setRelevantAnalyses] = useState<RelevantAnalysis[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoadingRelevant, setIsLoadingRelevant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastTextRef = useRef<string>('');

/**
   * Detect claims in text
   */
const detectClaims = useCallback(async () => {
  console.log('🔍 detectClaims called:', { 
      enabled, 
      textLength: text?.length, 
      lastTextLength: lastTextRef.current?.length,
      sameAsLast: text === lastTextRef.current 
    });
    
    if (!enabled) {
      console.log('❌ Detection disabled');
      return;
    }
    
    if (!text || text === lastTextRef.current) {
      console.log('❌ No text or same text');
      return;
    }
    
    console.log('✅ Starting claim detection...');
  
  setIsDetecting(true);
  setError(null);
  lastTextRef.current = text;

  try {
      console.log('📡 POST /api/claims/detect');
    const response = await fetch('/api/claims/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        projectId,
        cursorPosition,
        hypotheses: notebookContext.hypotheses,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to detect claims');
    }

    const data = await response.json();
    console.log('Claims detected:', data.claims.length); 
    setClaims(data.claims);
    
    // Auto-evaluate claims
    if (data.claims.length > 0) {
      console.log('Starting evaluation...');
    } else {
      setSuggestions([]);
    }
  } catch (err: any) {
    setError(err.message);
    console.error('Claim detection error:', err);
  } finally {
    setIsDetecting(false);
  }
}, []); // Empty dependencies - function will use latest values via closure

/**
   * Evaluate detected claims
   */
const evaluateClaims = useCallback(async (claimsToEvaluate: ClaimStructure[]) => {
  console.log('🔬 Starting evaluation for', claimsToEvaluate.length, 'claims');
  setIsEvaluating(true);
  const allSuggestions: WritingSuggestion[] = [];

  try {
    // Evaluate each claim
    for (const claim of claimsToEvaluate) {
      console.log('📡 POST /api/claims/evaluate for claim:', claim.text.substring(0, 50));
      
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
        console.log('✅ Evaluation response:', {
          suggestions: data.suggestions?.length || 0,
          issues: data.toulminDiagram?.issues?.length || 0
        });
        
        if (data.suggestions && data.suggestions.length > 0) {
          allSuggestions.push(...data.suggestions);
        }
      } else {
        console.error('❌ Evaluation failed:', response.status, await response.text());
      }
    }

    console.log('📊 Total suggestions collected:', allSuggestions.length);
    setSuggestions(allSuggestions);
  } catch (err: any) {
    console.error('Claim evaluation error:', err);
  } finally {
    setIsEvaluating(false);
  }
}, []); // Empty dependencies - will use latest notebookContext via closure


/**
   * Get relevant analyses (Remembrance Agent)
   */
const getRelevantAnalyses = useCallback(async () => {
  if (!enabled || !text) return;

  setIsLoadingRelevant(true);

  try {
    const response = await fetch('/api/remembrance/relevant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        cursorPosition,
        activeHypothesis,
        notebookContent: notebookContext,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get relevant analyses');
    }

    const data = await response.json();
    setRelevantAnalyses(data.relevantAnalyses);
  } catch (err: any) {
    console.error('Remembrance agent error:', err);
  } finally {
    setIsLoadingRelevant(false);
  }
}, []); // Empty dependencies

  /**
   * Generate claim modifications
   */
  const generateModifications = useCallback(async (
    claimText: string,
    evaluation: any,
    modificationType: 'weaken' | 'caveat' | 'reverse'
  ) => {
    try {
      const response = await fetch('/api/claims/suggest-modifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimText,
          toulminEvaluation: evaluation,
          modificationType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate modifications');
      }

      return await response.json();
    } catch (err: any) {
      console.error('Modification generation error:', err);
      throw err;
    }
  }, []);

  /**
   * Suggest missing analyses
   */
  const suggestAnalyses = useCallback(async (
    claimText: string,
    gaps: any[]
  ) => {
    try {
      const response = await fetch('/api/analysis/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimText,
          gaps,
          notebookContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to suggest analyses');
      }

      return await response.json();
    } catch (err: any) {
      console.error('Analysis suggestion error:', err);
      throw err;
    }
  }, [notebookContext]);

// Trigger detection when text changes - FIXED to avoid infinite loops
useEffect(() => {
  if (!enabled || !text) {
    if (text.length === 0) {
      lastTextRef.current = '';
    }
    return;
  }
  
  // Only detect if text actually changed
  if (text === lastTextRef.current) {
    return;
  }
  
  // Create a new debounced function for this effect
  const debouncedDetect = debounce(() => {
    detectClaims();
  }, 2000);
  
  // Trigger debounced detection
  debouncedDetect();
  
  // Cleanup
  return () => {
    debouncedDetect.cancel();
  };
}, [text, enabled, detectClaims]); // NOW it's safe to include detectClaims since it has stable reference

// Trigger remembrance agent when cursor moves - FIXED
useEffect(() => {
  if (!enabled || !text) return;
  
  const debouncedRelevant = debounce(() => {
    getRelevantAnalyses();
  }, 1500);
  
  debouncedRelevant();
  
  return () => {
    debouncedRelevant.cancel();
  };
}, [cursorPosition, enabled, text, getRelevantAnalyses]); // NOW safe

// Auto-evaluate claims when they are detected - FIXED
useEffect(() => {
  if (claims.length > 0 && enabled) {
    console.log('🔬 Auto-evaluating', claims.length, 'claims');
    evaluateClaims(claims);
  }
}, [claims.length, enabled, evaluateClaims]); // NOW safe
    
  return {
    // State
    claims,
    suggestions,
    relevantAnalyses,
    isDetecting,
    isEvaluating,
    isLoadingRelevant,
    error,

    // Actions
    detectClaims,
    generateModifications,
    suggestAnalyses,
    refreshRelevant: getRelevantAnalyses,
  };
}