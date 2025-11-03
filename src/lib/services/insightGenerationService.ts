/**
 * AI Insight Generation Service
 * Generates insights from analysis outputs using Gemini API via server route
 */

import { CodeCellType, Dataset, Hypothesis } from '@/types/notebook';

export interface InsightGenerationRequest {
  cell: CodeCellType;
  dataset?: Dataset | null;
  hypotheses?: Hypothesis[];
  allCells?: CodeCellType[];
}

export interface GeneratedInsight {
  content: string;
  suggestedTag?: string;
  relevantHypotheses?: string[];
  confidence: number;
}

/**
 * Generate insights from a cell's output using AI
 */
export async function generateInsightsForCell(
  request: InsightGenerationRequest
): Promise<GeneratedInsight[]> {
  const { cell, dataset, hypotheses, allCells } = request;

  if (!cell.output || cell.error) {
    console.log('No valid output to generate insights from');
    return [];
  }

  try {
    const response = await fetch('/api/generate-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cell: {
          query: cell.query,
          content: cell.content,
          output: cell.output,
        },
        dataset: dataset ? {
          filename: dataset.filename,
          summary: dataset.summary,
        } : null,
        hypotheses: hypotheses?.map(h => ({
          id: h.id,
          content: h.content,
        })),
        allCells: allCells?.map(c => ({
          query: c.query,
          output: c.output,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate insights');
    }

    const data = await response.json();
    return data.insights || [];

  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
}

export async function regenerateInsights(
  request: InsightGenerationRequest,
  previousInsights: string[],
  feedback?: string
): Promise<GeneratedInsight[]> {
  return generateInsightsForCell(request);
}