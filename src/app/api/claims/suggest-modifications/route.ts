import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/geminiService';

/**
 * POST /api/claims/suggest-modifications
 * 
 * Generates alternative phrasings using Gemini AI
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

    // Use Gemini to generate modifications
    const gemini = new GeminiService();
    const result = await gemini.generateModifications(
      claimText,
      toulminEvaluation,
      modificationType
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Modification suggestion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}