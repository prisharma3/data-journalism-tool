import { NextRequest, NextResponse } from 'next/server';
import { ToulminDiagram } from '@/types/writing';
import { ClaimModifier } from '@/lib/services/claimModifier';

/**
 * POST /api/claims/suggest-modifications
 * 
 * Generates alternative phrasings for a claim based on evaluation
 */
export async function POST(request: NextRequest) {
  try {
    const { claimText, toulminEvaluation, modificationType } = await request.json();

    // Validation
    if (!claimText || !toulminEvaluation || !modificationType) {
      return NextResponse.json(
        { error: 'claimText, toulminEvaluation, and modificationType are required' },
        { status: 400 }
      );
    }

    const modifier = new ClaimModifier();
    let suggestions: any[] = [];
    let explanation = '';

    // Generate suggestions based on modification type
    switch (modificationType) {
      case 'weaken':
        suggestions = modifier.weakenClaim(claimText);
        explanation = 'These alternatives use more cautious language to better match your evidence strength.';
        break;
      
      case 'caveat':
        suggestions = modifier.addCaveats(claimText, []);
        explanation = 'These alternatives add caveats to acknowledge limitations in your data or analysis.';
        break;
      
      case 'reverse':
        suggestions = modifier.reverseOrRemove(claimText, false);
        explanation = 'Consider these alternatives when evidence is insufficient or contradictory.';
        break;
      
      default:
        // Auto-detect based on issues
        const hasNoEvidence = toulminEvaluation.issues?.some((i: any) => i.type === 'no-evidence');
        const needsQualifier = toulminEvaluation.issues?.some((i: any) => i.type === 'missing-qualifier');
        
        if (hasNoEvidence) {
          suggestions = modifier.reverseOrRemove(claimText, false);
          explanation = 'No evidence found. Consider these alternatives.';
        } else if (needsQualifier) {
          suggestions = modifier.weakenClaim(claimText);
          explanation = 'Claim needs qualifying language.';
        } else {
          suggestions = modifier.addCaveats(claimText, []);
          explanation = 'Consider adding caveats to strengthen your argument.';
        }
    }

    return NextResponse.json({
      suggestions: suggestions.map(s => s.text),
      explanations: suggestions.map(s => s.explanation),
      explanation,
    });

  } catch (error: any) {
    console.error('Modification suggestion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}