import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { query, datasetInfo } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Build the prompt with dataset context
    const prompt = buildPrompt(query, datasetInfo);

    // Generate code
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Extract code from the response
    const code = extractCode(generatedText);

    return NextResponse.json({
      code,
      explanation: generatedText,
    });
  } catch (error: any) {
    console.error('Code generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate code' },
      { status: 500 }
    );
  }
}

function buildPrompt(query: string, datasetInfo?: any): string {
    let prompt = `You are a Python data analysis expert. Generate clean, concise Python code for the following request.
  
  User Request: "${query}"
  `;
  
    if (datasetInfo && datasetInfo.columnNames) {
      prompt += `
  Dataset Context:
  - The variable 'dataset' is ALREADY LOADED as a pandas DataFrame
  - Rows: ${datasetInfo.rows}
  - Columns: ${datasetInfo.columns}
  - Column Names: ${datasetInfo.columnNames.join(', ')}
  - Column Types: ${JSON.stringify(datasetInfo.columnTypes, null, 2)}
  `;
    } else {
      prompt += `
  Note: The variable 'dataset' is available as a pandas DataFrame if the user has uploaded data.
  `;
    }
  
    prompt += `
    CRITICAL Requirements:
    1. The 'dataset' variable is ALREADY LOADED - DO NOT create dummy data or check if it exists
    2. Available libraries: pandas (as pd), numpy (as np), matplotlib.pyplot (as plt)
    3. DO NOT use seaborn - it's not available. Use matplotlib instead
    4. For matplotlib: DO NOT use plt.show() - the system automatically captures plots
    5. Write concise code with brief comments only for complex operations
    6. Use print() to display results and insights
    7. Handle edge cases (missing values, wrong column names) with try-except if needed
    8. Keep the code SHORT and focused on the specific request
    
    IMPORTANT: 
    - DO NOT include dummy data creation
    - DO NOT use plt.show()
    - DO NOT use seaborn (use matplotlib.pyplot instead)
    - DO NOT add verbose validation unless specifically requested
    - Assume 'dataset' is already available and valid
    
    Generate ONLY the Python code needed to fulfill the request. Add comments only for complex logic.
    `;
  
    return prompt;
  }

function extractCode(text: string): string {
  // Try to extract code from markdown code blocks
  const codeBlockMatch = text.match(/```python\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try without language specification
  const genericCodeBlock = text.match(/```\n([\s\S]*?)\n```/);
  if (genericCodeBlock) {
    return genericCodeBlock[1].trim();
  }

  // If no code blocks found, return the entire text (it might be just code)
  return text.trim();
}