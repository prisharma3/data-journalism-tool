import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/embeddings/generate
 * 
 * Generates vector embedding for text using Gemini API
 * 
 * Request body:
 * {
 *   text: string,
 *   cacheKey?: string  // Optional key for caching
 * }
 * 
 * Response:
 * {
 *   embedding: number[],  // 768-dimensional vector
 *   dimensions: number,
 *   cached: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { text, cacheKey } = await request.json();

    // Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // TODO: Check cache first (implement in Phase 4)
    
    // Call Gemini Embedding API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text }],
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.embedding.values;

    // TODO: Cache the result (implement in Phase 4)

    return NextResponse.json({
      embedding,
      dimensions: embedding.length,
      cached: false,
    });

  } catch (error: any) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}