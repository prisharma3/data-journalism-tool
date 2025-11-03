import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cell, dataset, hypotheses, allCells } = body;

    // Check if we have output to analyze
    if (!cell.output || cell.error) {
      return NextResponse.json({ insights: [] });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Build the prompt
    const prompt = buildInsightGenerationPrompt(cell, dataset, hypotheses, allCells);

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Parse insights
    const insights = parseInsightsFromResponse(generatedText, hypotheses);

    return NextResponse.json({
      insights,
      success: true,
    });

  } catch (error: any) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

function buildInsightGenerationPrompt(
  cell: any,
  dataset?: any,
  hypotheses?: any[],
  allCells?: any[]
): string {
  const contextParts = [];

  // Dataset context
  if (dataset?.summary) {
    contextParts.push(`DATASET CONTEXT:
- Filename: ${dataset.filename}
- Rows: ${dataset.summary.rows}
- Columns: ${dataset.summary.columnNames.join(', ')}
`);
  }

  // Research hypotheses context
  if (hypotheses && hypotheses.length > 0) {
    contextParts.push(`RESEARCH HYPOTHESES:
${hypotheses.map((h: any, i: number) => `H${i + 1}: ${h.content}`).join('\n')}
`);
  }

  // Previous analyses context
  if (allCells && allCells.length > 0) {
    const recentAnalyses = allCells
      .filter((c: any) => c.output && !c.error)
      .slice(-3)
      .map((c: any) => `- Query: ${c.query}\n  Result: ${c.output?.text?.substring(0, 150)}...`)
      .join('\n');
    
    if (recentAnalyses) {
      contextParts.push(`PREVIOUS ANALYSES:
${recentAnalyses}
`);
    }
  }

  // Current analysis
  contextParts.push(`CURRENT ANALYSIS:
Query: ${cell.query}
Code: ${cell.content}

Output:
${cell.output?.text || 'No text output'}
${cell.output?.plot ? '\n[Contains visualization/plot]' : ''}
`);

  const fullContext = contextParts.join('\n---\n');

  return `You are a data analysis expert helping a researcher extract meaningful insights from their analysis results.

  ${fullContext}
  
  Based on the analysis above, generate 1-3 high-quality insights that:
  1. Directly interpret the results in clear, accessible language
  2. Connect findings to the research hypotheses (if relevant)
  3. Highlight important patterns, trends, or statistical findings
  4. Are actionable and meaningful for the research
  
  For EACH insight, also suggest ONE alternative or follow-up analysis that would provide additional context or validation.
  
  Return your response as a JSON array with this structure:
  [
    {
      "content": "The main insight text here",
      "suggestedTag": "pattern" or "trend" or "finding" or "correlation",
      "relevantHypotheses": ["H1", "H2"],
      "confidence": 0.85,
      "alternativeAnalysis": "A natural language query for follow-up analysis (e.g., 'Show the correlation between age and income for different education levels')"
    }
  ]
  
  IMPORTANT for alternativeAnalysis:
  - Make it a specific, actionable natural language query
  - It should be ready to use for code generation
  - Focus on validation, deeper exploration, or alternative perspectives
  - Keep it concise but complete (one sentence)
  
  Return ONLY valid JSON, no other text.`;
}

function parseInsightsFromResponse(responseText: string, hypotheses?: any[]): any[] {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
  
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }
  
      // Map hypothesis references to IDs
      const insights = parsed.map((item: any) => {
        const relevantHypotheses: string[] = [];
        
        if (item.relevantHypotheses && hypotheses) {
          item.relevantHypotheses.forEach((ref: string) => {
            const match = ref.match(/H(\d+)/i);
            if (match) {
              const index = parseInt(match[1]) - 1;
              if (hypotheses[index]) {
                relevantHypotheses.push(hypotheses[index].id);
              }
            }
          });
        }
  
        return {
          content: item.content || '',
          suggestedTag: item.suggestedTag || 'For Review',
          relevantHypotheses,
          confidence: typeof item.confidence === 'number' ? item.confidence : 0.7,
          alternativeAnalysis: item.alternativeAnalysis || null, // NEW: alternative analysis suggestion
        };
      });
  
      return insights.filter((i: any) => i.content.trim().length > 0);
  
    } catch (error) {
      console.error('Error parsing insights:', error);
      return [];
    }
  }