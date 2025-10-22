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
      
      if (!enabled || !text || text === lastTextRef.current) {
        console.log('❌ Skipping detection');
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
  }, [text, projectId, cursorPosition, notebookContext, enabled]);

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
  }, [notebookContext]);

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
  }, [text, cursorPosition, activeHypothesis, notebookContext, enabled]);

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

  // Debounced claim detection (trigger after user stops typing)
  const debouncedDetect = useRef(
    debounce(() => {
      detectClaims();
    }, 2000) // 2 second delay
  ).current;

  // Debounced remembrance agent
  const debouncedRelevant = useRef(
    debounce(() => {
      getRelevantAnalyses();
    }, 1500) // 1.5 second delay
  ).current;

  // Trigger detection when text changes
  useEffect(() => {
    if (enabled && text) {
      debouncedDetect();
    }
  }, [text, enabled, debouncedDetect]);

  // Trigger remembrance agent when cursor moves
  useEffect(() => {
    if (enabled && text) {
      debouncedRelevant();
    }
  }, [cursorPosition, text, enabled, debouncedRelevant]);

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedDetect.cancel();
      debouncedRelevant.cancel();
    };
  }, [debouncedDetect, debouncedRelevant]);

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