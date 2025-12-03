import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cell, dataset, hypotheses, allCells, tags } = body;

    // Check if we have output to analyze
    if (!cell.output || cell.error) {
      return NextResponse.json({ insights: [] });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Build the prompt
    const prompt = buildInsightGenerationPrompt(cell, dataset, hypotheses, allCells, tags);

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

// function buildInsightGenerationPrompt(
//     cell: any,
//     dataset?: any,
//     hypotheses?: any[],
//     allCells?: any[],
//     tags?: any[]
//   ): string {
//   const contextParts = [];

//   // Dataset context
//   if (dataset?.summary) {
//     contextParts.push(`DATASET CONTEXT:
// - Filename: ${dataset.filename}
// - Rows: ${dataset.summary.rows}
// - Columns: ${dataset.summary.columnNames.join(', ')}
// `);
//   }

//   // Research hypotheses context
//   if (hypotheses && hypotheses.length > 0) {
//     contextParts.push(`RESEARCH HYPOTHESES:
// ${hypotheses.map((h: any, i: number) => `H${i + 1}: ${h.content}`).join('\n')}
// `);
//   }

//   // Previous analyses context
//   if (allCells && allCells.length > 0) {
//     const recentAnalyses = allCells
//       .filter((c: any) => c.output && !c.error)
//       .slice(-3)
//       .map((c: any) => `- Query: ${c.query}\n  Result: ${c.output?.text?.substring(0, 150)}...`)
//       .join('\n');
    
//     if (recentAnalyses) {
//       contextParts.push(`PREVIOUS ANALYSES:
// ${recentAnalyses}
// `);
//     }
//   }

//   // Current analysis
//   contextParts.push(`CURRENT ANALYSIS:
// Query: ${cell.query}
// Code: ${cell.content}

// Output:
// ${cell.output?.text || 'No text output'}
// ${cell.output?.plot ? '\n[Contains visualization/plot]' : ''}
// `);

//   const fullContext = contextParts.join('\n---\n');

//   // Add existing tags information
//   const existingTagsInfo = tags && tags.length > 0 
//     ? `\n\nEXISTING TAGS IN PROJECT:\n${tags.map((t: any) => `- ${t.name}`).join('\n')}\n\nIMPORTANT: First check if any existing tags are appropriate before suggesting a new tag. Only suggest a new tag if none of the existing tags fit well.`
//     : '';

//   return `You are a data analysis expert helping a researcher extract meaningful insights from their analysis results.

//   ${fullContext}
  
//   Based on the analysis above, generate 1-3 high-quality insights that:
//   1. Directly interpret the results in clear, accessible language
//   2. Connect findings to the research hypotheses (if relevant)
//   3. Highlight important patterns, trends, or statistical findings
//   4. Are actionable and meaningful for the research
  
//   For EACH insight, also suggest ONE alternative or follow-up analysis that would provide additional context or validation.
  
//   Return your response as a JSON array with this structure:
//   [
// {
//   "content": "The main insight text here",
// "suggestedTag": "Pattern" or "Trend" or "Finding" or "Correlation" (ALWAYS capitalize the first letter of tags),
//   "relevantHypotheses": ["H1", "H2"],
//   "confidence": 0.85,
//   "alternativeAnalysis": "A natural language query for follow-up analysis"
// }
//   ]
  
//   IMPORTANT for alternativeAnalysis:
//   - Make it a specific, actionable natural language query
//   - It should be ready to use for code generation
//   - Focus on validation, deeper exploration, or alternative perspectives
//   - Keep it concise but complete (one sentence)
  
//   Return ONLY valid JSON, no other text.`;
// }

function buildInsightGenerationPrompt(
  cell: any,
  dataset?: any,
  hypotheses?: any[],
  allCells?: any[],
  tags?: any[]
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

// Add existing tags information
const existingTagsInfo = tags && tags.length > 0 
  ? `\n\nEXISTING TAGS IN PROJECT:\n${tags.map((t: any) => `- ${t.name}`).join('\n')}\n\nIMPORTANT: First check if any existing tags are appropriate before suggesting a new tag. Only suggest a new tag if none of the existing tags fit well.`
  : '';

return `You are a senior data journalist editor reviewing analysis results. Your job is to extract ONLY insights that would survive editorial review at a major publication.

${fullContext}
${existingTagsInfo}

**YOUR TASK:**
Generate 1-3 insights from the analysis output. Each insight must pass this test: "Would a busy editor keep this or delete it as filler?"

**RULES FOR GOOD INSIGHTS:**

1. **CITE SPECIFIC NUMBERS** - Every insight must reference actual values from the output
 - BAD: "There is a significant correlation between X and Y"
 - GOOD: "X and Y show a correlation of r=0.78 (p<0.01)"

2. **STATE THE FINDING, NOT THE METHOD**
 - BAD: "The analysis reveals interesting patterns in the data"
 - GOOD: "Income drops 23% in high-tariff regions compared to low-tariff regions"

3. **NO FILLER PHRASES** - Delete these patterns:
 - "Interestingly...", "It's worth noting that...", "The data suggests..."
 - "This is significant because...", "This finding indicates..."
 - Just state the fact directly.

4. **ONE FACT PER INSIGHT** - Don't cram multiple findings together
 - BAD: "Income drops 23% and younger farmers are more affected and the trend is accelerating"
 - GOOD: "Income drops 23% in high-tariff regions" (separate insight for age effect)

5. **QUANTIFY COMPARISONS**
 - BAD: "Younger farmers are more affected than older farmers"
 - GOOD: "Farmers under 40 show 35% income decline vs 15% for those over 40"

6. **IF THE OUTPUT HAS NO CLEAR FINDING, RETURN EMPTY ARRAY**
 - Don't invent insights from ambiguous results
 - "No significant pattern found" is not an insight worth saving

**EXAMPLES OF GOOD INSIGHTS:**
- "Correlation between tariff_exposure and income: r=-0.78, p<0.01"
- "Mean income in high-tariff regions: $42,300 vs $54,800 in low-tariff regions (23% gap)"
- "35% of farmers under 40 reported income decline >20%, compared to 12% of farmers over 60"

**EXAMPLES OF BAD INSIGHTS (DO NOT GENERATE THESE):**
- "The analysis shows a clear relationship between variables" (no numbers)
- "This finding has important implications for policy" (editorializing)
- "The data reveals interesting patterns worth further investigation" (filler)
- "There appears to be a negative correlation" (vague, no values)

Return your response as a JSON array:
[
{
  "content": "The specific finding with numbers",
  "suggestedTag": "Pattern" or "Correlation" or "Comparison" or "Outlier" or "Trend",
  "relevantHypotheses": ["H1"],
  "confidence": 0.85,
  "alternativeAnalysis": "Specific follow-up query to validate or extend this finding"
}
]

**CRITICAL:**
- If the output doesn't contain clear, quantifiable findings, return an empty array: []
- Never pad with vague insights just to return something
- Return ONLY valid JSON, no other text`;
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
          suggestedTag: item.suggestedTag 
          ? item.suggestedTag.charAt(0).toUpperCase() + item.suggestedTag.slice(1).toLowerCase()
          : 'For Review',
          relevantHypotheses,
          confidence: typeof item.confidence === 'number' ? item.confidence : 0.7,
          alternativeAnalysis: item.alternativeAnalysis || null, 
        };
      });
  
      return insights.filter((i: any) => i.content.trim().length > 0);
  
    } catch (error) {
      console.error('Error parsing insights:', error);
      return [];
    }
  }