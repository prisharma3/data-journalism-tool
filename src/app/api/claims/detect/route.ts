import { NextRequest, NextResponse } from 'next/server';
import { ClaimStructure } from '@/types/writing';
import { GeminiService } from '@/lib/services/geminiService';
import { generateId } from '@/lib/utils/text';

/**
 * POST /api/claims/detect
 * 
 * Detects claims using Gemini AI
 */
export async function POST(request: NextRequest) {
  try {
    const { text, cursorPosition, projectId, hypotheses } = await request.json();

    // Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Use Gemini to detect claims
    const gemini = new GeminiService();
    const projectContext = hypotheses ? { hypotheses } : undefined;
    const detectedClaims = await gemini.detectClaims(text, projectContext);

    // Convert to ClaimStructure format
    const claims: ClaimStructure[] = detectedClaims.map((detected: any) => ({
      id: generateId('claim'),
      text: detected.text,
      position: {
        from: detected.position.from,
        to: detected.position.to,
        paragraphIndex: 0, // Calculate if needed
      },
      type: detected.type,
      confidence: detected.confidence,
      detectedAt: new Date(),
      hypothesisLinks: [], // TODO: Implement hypothesis linking
      strongLanguage: detected.strongLanguage.map((marker: any) => ({
        word: marker.word,
        type: marker.type,
        position: { 
          from: detected.position.from, 
          to: detected.position.from + marker.word.length 
        },
        intensity: marker.intensity,
      })),
      status: 'detected' as const,
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      claims,
      processingTime,
    });

  } catch (error: any) {
    console.error('Claim detection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect claims' },
      { status: 500 }
    );
  }
}