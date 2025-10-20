import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/geminiService';
import { generateId } from '@/lib/utils/text';

/**
 * POST /api/analysis/suggest
 * 
 * Suggests analyses using Gemini AI to fill evidence gaps
 */
export async function POST(request: NextRequest) {
  try {
    const { claimText, gaps, datasetInfo, existingAnalyses, notebookContext } = await request.json();

    // Validation
    if (!claimText) {
      return NextResponse.json(
        { error: 'claimText is required' },
        { status: 400 }
      );
    }

    if (!gaps || !Array.isArray(gaps)) {
      return NextResponse.json(
        { error: 'gaps array is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Use Gemini to suggest analyses
    const gemini = new GeminiService();
    const suggestions = await gemini.suggestAnalysis(
      claimText,
      gaps,
      notebookContext || {
        dataset: datasetInfo,
        cells: existingAnalyses?.map((query: string) => ({ query })) || [],
      }
    );

    // Add IDs to suggestions
    const suggestionsWithIds = suggestions.map((s: any) => ({
      id: generateId('analysis-suggestion'),
      ...s,
    }));

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      suggestions: suggestionsWithIds,
      processingTime,
    });

  } catch (error: any) {
    console.error('Analysis suggestion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to suggest analysis' },
      { status: 500 }
    );
  }
}