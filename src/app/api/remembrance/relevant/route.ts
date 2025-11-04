import { NextRequest, NextResponse } from 'next/server';
import { RemembranceAgent } from '@/lib/services/remembranceAgent';

// Single instance for the session
let agent: RemembranceAgent | null = null;

/**
 * POST /api/remembrance/relevant
 * 
 * Get relevant analyses for current writing context
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      text, 
      cursorPosition, 
      activeHypothesis,
      notebookContent 
    } = await request.json();

// Validation
if (!text || typeof text !== 'string') {
  console.error('Validation failed: text =', text);
  return NextResponse.json(
    { error: 'Text is required and must be a string' },
    { status: 400 }
  );
}

if (typeof cursorPosition !== 'number') {
  console.error('Validation failed: cursorPosition =', cursorPosition);
  return NextResponse.json(
    { error: 'Cursor position is required and must be a number' },
    { status: 400 }
  );
}

if (!notebookContent) {
  console.error('Validation failed: notebookContent is missing');
  return NextResponse.json(
    { error: 'Notebook context is required' },
    { status: 400 }
  );
}

console.log('Remembrance agent request:', { 
  textLength: text.length, 
  cursorPosition, 
  hasNotebook: !!notebookContent
});

    const startTime = Date.now();

    // Initialize agent if needed
    if (!agent) {
      agent = new RemembranceAgent();
    }

    // Helper function to generate embeddings
    const generateEmbedding = async (text: string): Promise<number[]> => {
      const response = await fetch(
        `${request.nextUrl.origin}/api/embeddings/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }
      
      const data = await response.json();
      return data.embedding;
    };

    // Get relevant analyses
    const relevantAnalyses = await agent.getRelevantAnalyses(
      text,
      cursorPosition,
      activeHypothesis,
      generateEmbedding,
      notebookContent
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      relevantAnalyses,
      context: agent.getCurrentContext(),
      indexStatus: agent.getIndexStatus(),
      processingTime,
    });

  } catch (error: any) {
    console.error('Remembrance agent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get relevant analyses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/remembrance/reindex
 * 
 * Force reindex of notebook
 */
export async function PUT(request: NextRequest) {
  try {
    const { notebookContent } = await request.json();

    if (!notebookContent) {
      return NextResponse.json(
        { error: 'Notebook context is required' },
        { status: 400 }
      );
    }

    if (!agent) {
      agent = new RemembranceAgent();
    }

    // Helper function to generate embeddings
    const generateEmbedding = async (text: string): Promise<number[]> => {
      const response = await fetch(
        `${request.nextUrl.origin}/api/embeddings/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }
      
      const data = await response.json();
      return data.embedding;
    };

    await agent.reindex(notebookContent, generateEmbedding);

    return NextResponse.json({
      success: true,
      indexStatus: agent.getIndexStatus(),
    });

  } catch (error: any) {
    console.error('Reindex error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reindex' },
      { status: 500 }
    );
  }
}