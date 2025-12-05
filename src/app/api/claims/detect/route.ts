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
// Convert to ClaimStructure format
const claims: ClaimStructure[] = detectedClaims.map((detected: any) => ({
  id: generateId('claim'),
  text: detected.text,
  position: {
    from: detected.position?.from ?? 0,
    to: detected.position?.to ?? detected.text?.length ?? 0,
    paragraphIndex: 0,
  },
  type: detected.type || 'descriptive',
  confidence: detected.confidence ?? 0.8,
  detectedAt: new Date(),
  hypothesisLinks: [],
  strongLanguage: (detected.strongLanguage || [])
    .filter((marker: any) => marker && marker.word)
    .map((marker: any) => ({
      word: marker.word,
      type: marker.type || 'absolute',
      position: { 
        from: detected.position?.from ?? 0, 
        to: (detected.position?.from ?? 0) + (marker.word?.length ?? 0)
      },
      intensity: marker.intensity ?? 0.5,
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