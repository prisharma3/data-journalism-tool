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
      })),
      evaluatedAt: new Date(),
    };

    // Generate suggestions based on issues
// Generate suggestions based on issues
const suggestions = geminiEvaluation.issues.map((issue: any) => {
    const suggestionType = mapIssueToSuggestion(issue.type);
    
    return {
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
    };
  });

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
      'no-evidence': 'missing-evidence',
      'weak-evidence': 'weak-support',
      'overclaim': 'strong-language',
      'missing-qualifier': 'strong-language',
      'causation-correlation': 'logical-issue',
    };
    return mapping[issueType] || 'clarity';
  }