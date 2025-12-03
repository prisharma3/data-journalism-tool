import { NextRequest, NextResponse } from 'next/server';
import { ClaimEvaluationRequest, ClaimEvaluationResponse, SuggestionType } from '@/types/writing';
import { GeminiService } from '@/lib/services/geminiService';
import { generateId } from '@/lib/utils/text';

/**
 * POST /api/claims/evaluate
 * 
 * Evaluates a claim using Gemini AI and Toulmin framework
 */
export async function POST(request: NextRequest) {
  try {
    const evaluationRequest: ClaimEvaluationRequest = await request.json();

    // Validation
    if (!evaluationRequest.claim) {
      return NextResponse.json(
        { error: 'Claim is required' },
        { status: 400 }
      );
    }

    if (!evaluationRequest.notebookContext) {
      return NextResponse.json(
        { error: 'Notebook context is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Use Gemini to evaluate
    const gemini = new GeminiService();
    const geminiEvaluation = await gemini.evaluateClaim(
      evaluationRequest.claim,
      evaluationRequest.notebookContext
    );

    // Build Toulmin diagram from Gemini response
    // Handle both old and new response structures
    const toulminAnalysis = geminiEvaluation.toulminAnalysis || {};
    
    const toulminDiagram = {
      claimId: evaluationRequest.claim.id,
      claim: evaluationRequest.claim.text,
      grounds: (toulminAnalysis.grounds?.evidence || []).map((evidence: string, idx: number) => ({
        id: generateId('evidence'),
        type: 'textual',
        sourceId: generateId('source'),
        sourceType: 'cell_output',
        content: evidence,
        relevanceScore: 1.0,
        strengthScore: toulminAnalysis.grounds?.strength === 'strong' ? 1.0 : 
                       toulminAnalysis.grounds?.strength === 'moderate' ? 0.6 : 0.3,
        recencyScore: 1.0,
        confidenceScore: 0.8,
        hypothesisTags: [],
        extractedStatistics: [],
      })),
      warrant: {
        statement: toulminAnalysis.warrant?.impliedAssumption || '',
        type: 'logical' as const,
        isExplicit: false,
        acceptanceLevel: 'domain-specific' as const,
        needsBacking: !toulminAnalysis.backing?.exists,
        confidence: toulminAnalysis.warrant?.isValid ? 0.8 : 0.3,
      },
      backing: toulminAnalysis.backing?.exists ? [{
        id: generateId('backing'),
        content: toulminAnalysis.backing.description || '',
        type: 'domain-knowledge' as const,
        strength: 0.7,
      }] : [],
      qualifier: {
        detected: (toulminAnalysis.qualifier?.present || []).map((q: string) => ({
          text: q,
          position: { from: 0, to: 0 },
          strength: 'moderate' as const,
        })),
        missing: (toulminAnalysis.qualifier?.missing || []).map((q: string) => ({
          reason: `Missing qualifier: ${q}`,
          suggestedPhrases: [q],
          importance: 'suggested' as const,
        })),
        appropriatenessScore: toulminAnalysis.qualifier?.appropriate ? 0.8 : 0.3,
      },
      rebuttal: (toulminAnalysis.rebuttal?.possibleRebuttals || []).map((r: string) => ({
        id: generateId('rebuttal'),
        type: 'limitation' as const,
        content: r,
        strength: 0.5,
        addressed: toulminAnalysis.rebuttal?.acknowledged || false,
      })),
      strength: toulminAnalysis.grounds?.strength || 'unsupported',
      issues: (geminiEvaluation.issues || []).map((issue: any) => ({
        id: generateId('issue'),
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        explanation: issue.explanation,
        suggestedFix: issue.suggestedFix,
      })),
      gaps: (geminiEvaluation.gaps || []).map((gap: any) => ({
        id: generateId('gap'),
        description: gap.description,
        purpose: gap.purpose,
        suggestedQuery: gap.suggestedQuery,
        canBeResolved: gap.canBeResolved,
      })),
      evaluatedAt: new Date(),
      recommendedAction: geminiEvaluation.recommendedAction,
      actionReasoning: geminiEvaluation.actionReasoning,
      modificationPaths: geminiEvaluation.modificationPaths || {},
    };

    // Generate suggestions based on recommendedAction from decision tree
    const suggestions: Array<{
      id: string;
      claimId: string;
      type: SuggestionType;
      severity: 'critical' | 'warning' | 'info';
      message: string;
      explanation: string;
      position: { from: number; to: number; paragraphIndex: number };
      actions: never[];
      priority: number;
      createdAt: Date;
      status: 'active';
      metadata?: {
        reason?: string;
        suggestedQuery?: string;
        missingConcepts?: string[];
        gapType?: string;
      };
    }> = [];

    if (geminiEvaluation.recommendedAction === 'claim-is-fine') {
      // No suggestions needed - claim is good!
      // Don't add any issues or suggestions
      
    } else if (geminiEvaluation.recommendedAction === 'claim-needs-change') {
      // Evidence exists but claim needs modification
      // Add suggestions for weaken/caveat/reverse based on issues
      
      geminiEvaluation.issues.forEach((issue: any) => {
        const suggestionType = mapIssueToSuggestion(issue.type);
        
        suggestions.push({
          id: generateId('suggestion'),
          claimId: evaluationRequest.claim.id,
          type: suggestionType,
          severity: issue.severity,
          message: issue.message,
          explanation: issue.explanation,
          position: evaluationRequest.claim.position,
          actions: [],
          priority: issue.severity === 'critical' ? 90 : issue.severity === 'warning' ? 60 : 30,
          createdAt: new Date(),
          status: 'active' as const,
        });
      });
      
    } else if (geminiEvaluation.recommendedAction === 'claim-might-need-change') {
      // Missing evidence - need to determine if analysis can help or claim should be removed
      
      // Check if AI thinks claim is fundamentally unsupportable
      const isFundamentallyUnsupportable = geminiEvaluation.gaps && 
        geminiEvaluation.gaps.some((gap: any) => 
          !gap.canBeResolved
        );
      
      if (isFundamentallyUnsupportable) {
        // Claim cannot be supported even with more analysis - suggest removal
        suggestions.push({
          id: generateId('suggestion'),
          claimId: evaluationRequest.claim.id,
          type: 'remove-claim',
          severity: 'critical',
          message: 'This claim cannot be supported with available data',
          explanation: geminiEvaluation.modificationPaths?.reverse || 
            'The evidence needed to support this claim is not available in your dataset or methodology',
          position: evaluationRequest.claim.position,
          actions: [],
          priority: 95,
          createdAt: new Date(),
          status: 'active' as const,
          metadata: {
            reason: 'fundamentally-unsupportable',
          },
        });
      } else if (geminiEvaluation.gaps && geminiEvaluation.gaps.length > 0) {
        // Analysis could help - suggest specific analyses
        geminiEvaluation.gaps.forEach((gap: any) => {
          if (gap.suggestedQuery) {
            // AI provided a specific query - user can run analysis
            suggestions.push({
              id: generateId('suggestion'),
              claimId: evaluationRequest.claim.id,
              type: 'add-analysis',
              severity: (gap.purpose === 'justify-removal' || !gap.canBeResolved) ? 'critical' : 'warning',
              message: gap.description,
              explanation: `Suggested analysis: "${gap.suggestedQuery}"`,
              position: evaluationRequest.claim.position,
              actions: [],
              priority: (gap.purpose === 'justify-removal' || !gap.canBeResolved) ? 95 : 70,
              createdAt: new Date(),
              status: 'active' as const,
              metadata: {
                suggestedQuery: gap.suggestedQuery,
                missingConcepts: gap.missingConcepts,
                gapType: gap.type,
              },
            });
          }
        });
      }
    }

    // Return response (moved outside the conditionals)
    const response: ClaimEvaluationResponse = {
      claimId: evaluationRequest.claim.id,
      toulminDiagram,
      suggestions,
      analysisGaps: geminiEvaluation.gaps,
      processingTime: Date.now() - startTime,
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Claim evaluation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to evaluate claim' },
      { status: 500 }
    );
  }
}

function mapIssueToSuggestion(issueType: string): SuggestionType {
  const mapping: Record<string, SuggestionType> = {
    'no-evidence': 'add-analysis',
    'weak-evidence': 'add-analysis',
    'overclaim': 'weaken-claim',
    'missing-qualifier': 'add-qualifier',
    'causation-correlation': 'add-caveat',
    'invalid-warrant': 'add-caveat',
    'no-grounds': 'add-analysis',
    'contradicts-evidence': 'remove-claim',
    'unqualified-absolute': 'add-qualifier',
    'unacknowledged-rebuttal': 'acknowledge-limitation',
    'weak-backing': 'add-caveat',
  };
  return mapping[issueType] || 'add-caveat';
}