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

// Check if we have a plot image to analyze
const hasPlot = !!cell.output?.plot;
const textOutput = cell.output?.text || '';
const isMinimalTextOutput = textOutput.length < 100 || 
  textOutput.toLowerCase().includes('successfully generated') ||
  textOutput.toLowerCase().includes('plot created') ||
  textOutput.toLowerCase().includes('chart created');

let result;

if (hasPlot && isMinimalTextOutput && cell.output.plot) {
  // Send image to Gemini for vision analysis
  try {
    // Handle base64 image data
    let imageData = cell.output.plot;
    let mimeType = 'image/png';
    
    // Check if it's a data URL and extract the base64 part
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageData = matches[2];
      }
    }
    
    // Create content with both text prompt and image
    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: mimeType,
      },
    };
    
    const imagePrompt = prompt + `

**IMPORTANT: A visualization/plot is attached. Please analyze the ACTUAL image to extract insights.**
Look for:
- Patterns, trends, clusters in the data
- Relationships between variables (correlation direction and strength)
- Outliers or anomalies
- Distribution characteristics
- Group differences (if colored by category)

Describe SPECIFIC observations from the plot with approximate values where visible.`;

    result = await model.generateContent([imagePrompt, imagePart]);
  } catch (imageError) {
    console.error('Error processing image, falling back to text-only:', imageError);
    result = await model.generateContent(prompt);
  }
} else {
  // Text-only analysis
  result = await model.generateContent(prompt);
}

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

6. **FOR DATA PREVIEWS (head, describe, info, shape, etc.)**
 - Generate descriptive insights about the data structure
 - GOOD: "Dataset contains 150 samples with 5 features: sepal_length, sepal_width, petal_length, petal_width, and species"
 - GOOD: "Three species are represented: setosa, versicolor, and virginica"
 - GOOD: "Sepal length ranges from 4.3 to 7.9 with a mean of 5.84"
 - These are valid insights for understanding the data

7. **ONLY RETURN EMPTY ARRAY IF:**
 - The output is an error message
 - The output is completely empty
 - The output shows only "success" or "complete" with no data

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