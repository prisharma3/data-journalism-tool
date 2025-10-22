import { NextRequest, NextResponse } from 'next/server';
import { ClaimEvaluationRequest, ClaimEvaluationResponse } from '@/types/writing';
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
    const toulminDiagram = {
        claimId: evaluationRequest.claim.id,
        claim: evaluationRequest.claim.text,
        grounds: geminiEvaluation.grounds.map((g: any) => ({
          id: generateId('evidence'),
          type: g.sourceType === 'insight' ? 'insight' : 'textual',
          sourceId: generateId('source'),
          sourceType: g.sourceType,
          content: g.content,
          relevanceScore: g.relevanceScore,
          strengthScore: g.strengthScore,
          recencyScore: 1.0,
          confidenceScore: g.strengthScore,
          hypothesisTags: [],
          extractedStatistics: [],
        })),
        warrant: {
          statement: geminiEvaluation.warrant.statement,
          type: geminiEvaluation.warrant.type,
          isExplicit: false,
          acceptanceLevel: geminiEvaluation.warrant.acceptanceLevel,
          needsBacking: geminiEvaluation.warrant.acceptanceLevel !== 'widely-accepted',
          confidence: geminiEvaluation.warrant.confidence,
        },
        backing: [],
        qualifier: geminiEvaluation.qualifier,
        rebuttal: [],
        strength: geminiEvaluation.strength,
        overallScore: geminiEvaluation.overallScore,
        issues: geminiEvaluation.issues.map((issue: any) => ({
          id: generateId('issue'),
          type: issue.type,
          severity: issue.severity,
          message: issue.message,
          explanation: issue.explanation,
        })),
        gaps: geminiEvaluation.gaps.map((gap: any) => ({
          id: generateId('gap'),
          type: gap.type,
          description: gap.description,
          missingConcepts: gap.missingConcepts,
          importance: gap.importance,
          suggestedQuery: gap.suggestedQuery,
        })),
        evaluatedAt: new Date(),
        recommendedAction: geminiEvaluation.recommendedAction,
        actionReasoning: geminiEvaluation.actionReasoning,
        modificationPaths: geminiEvaluation.modificationPaths,
      };

    // Generate suggestions based on issues
// Generate suggestions based on issues
// Generate suggestions based on recommendedAction from decision tree
const suggestions = [];

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
        gap.importance === 'critical' && !gap.suggestedQuery
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
            severity: gap.importance === 'critical' ? 'critical' : 'warning',
            message: gap.description,
            explanation: `Suggested analysis: "${gap.suggestedQuery}"`,
            position: evaluationRequest.claim.position,
            actions: [],
            priority: gap.importance === 'critical' ? 95 : 70,
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
    
    // Also add modification suggestions as backup options
    geminiEvaluation.issues.forEach((issue: any) => {
      const suggestionType = mapIssueToSuggestion(issue.type);
      
      suggestions.push({
        id: generateId('suggestion'),
        claimId: evaluationRequest.claim.id,
        type: suggestionType,
        severity: 'info', // Lower severity since analysis/removal is preferred
        message: issue.message,
        explanation: issue.explanation,
        position: evaluationRequest.claim.position,
        actions: [],
        priority: 30, // Lower priority than add-analysis or remove-claim
        createdAt: new Date(),
        status: 'active' as const,
      });
    });
  }

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

function mapIssueToSuggestion(issueType: string): string {
    const mapping: Record<string, string> = {
      'no-evidence': 'add-analysis',
      'weak-evidence': 'weak-support',
      'overclaim': 'weaken-claim',
      'missing-qualifier': 'add-qualifier',
      'causation-correlation': 'add-caveat',
    };
    return mapping[issueType] || 'clarity';
  }