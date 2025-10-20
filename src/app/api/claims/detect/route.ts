import { NextRequest, NextResponse } from 'next/server';
import { ClaimStructure } from '@/types/writing';
import { ClaimDetector } from '@/lib/services/claimDetector';
import { generateId } from '@/lib/utils/text';

/**
 * POST /api/claims/detect
 * 
 * Detects claims in the provided text
 */
export async function POST(request: NextRequest) {
  try {
    const { text, cursorPosition, projectId } = await request.json();

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

    // Detect claims using ClaimDetector
    const detector = new ClaimDetector();
    const detectedClaims = detector.detectClaims(text);

    // Convert to ClaimStructure format
    const claims: ClaimStructure[] = detectedClaims.map(detected => ({
      id: generateId('claim'),
      text: detected.text,
      position: {
        from: detected.position.from,
        to: detected.position.to,
        paragraphIndex: 0, // TODO: Calculate actual paragraph index
      },
      type: detected.type,
      confidence: detected.confidence,
      detectedAt: new Date(),
      hypothesisLinks: [], // TODO: Link to hypotheses in next step
      strongLanguage: detected.strongLanguage.map(marker => ({
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