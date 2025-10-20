import { NextRequest, NextResponse } from 'next/server';
import { ClaimEvaluationRequest, ClaimEvaluationResponse } from '@/types/writing';
import { ToulminEvaluator } from '@/lib/services/toulminEvaluator';

/**
 * POST /api/claims/evaluate
 * 
 * Evaluates a claim against notebook evidence using Toulmin framework
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

    // Evaluate claim using Toulmin framework
    const evaluator = new ToulminEvaluator();
    const toulminDiagram = evaluator.evaluate(
      evaluationRequest.claim,
      evaluationRequest.notebookContext
    );

    // Generate suggestions based on issues
    const suggestions = toulminDiagram.issues.map(issue => ({
      id: issue.id,
      claimId: evaluationRequest.claim.id,
      type: mapIssueToClaim(issue.type),
      severity: issue.severity,
      message: issue.message,
      explanation: issue.explanation,
      position: evaluationRequest.claim.position,
      actions: [],
      priority: issue.severity === 'critical' ? 90 : issue.severity === 'warning' ? 60 : 30,
      createdAt: new Date(),
      status: 'active' as const,
    }));

    const response: ClaimEvaluationResponse = {
      claimId: evaluationRequest.claim.id,
      toulminDiagram,
      suggestions,
      analysisGaps: toulminDiagram.gaps,
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

/**
 * Map issue type to suggestion type
 */
function mapIssueToClaim(issueType: string): string {
  const mapping: Record<string, string> = {
    'no-evidence': 'add-analysis',
    'weak-evidence': 'add-analysis',
    'overclaim': 'weaken-claim',
    'missing-qualifier': 'add-qualifier',
    'causation-correlation': 'weaken-claim',
  };
  
  return mapping[issueType] || 'grammar';
}