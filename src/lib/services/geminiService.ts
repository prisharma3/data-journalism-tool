/**
 * GEMINI SERVICE
 * All AI-powered evaluation using Gemini API
 */

import { ToulminDiagram, ClaimStructure } from '@/types/writing';

export class GeminiService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }
  }
  
  /**
   * Call Gemini API with a prompt
   */
  private async callGemini(prompt: string): Promise<string> {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.2, // Lower = more deterministic
            maxOutputTokens: 2048,
          }
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
  
  /**
   * Evaluate claim using Toulmin framework with Gemini
   */
  async evaluateClaim(claim: ClaimStructure, notebookContext: any): Promise<any> {
    const prompt = this.buildEvaluationPrompt(claim, notebookContext);
    const response = await this.callGemini(prompt);
    
    // Parse JSON response from Gemini
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON in response');
    } catch (error) {
      console.error('Failed to parse Gemini response:', response);
      throw new Error('Invalid response format from Gemini');
    }
  }
  
  /**
   * Build evaluation prompt for Gemini
   */
  private buildEvaluationPrompt(claim: ClaimStructure, notebookContext: any): string {
    return `You are an expert research analyst evaluating claims using the Toulmin argumentation framework.

**CLAIM TO EVALUATE:**
"${claim.text}"

**CLAIM TYPE:** ${claim.type}

**NOTEBOOK CONTEXT:**

Hypotheses:
${notebookContext.hypotheses.map((h: any) => `- ${h.content}`).join('\n') || 'None'}

Analyses:
${notebookContext.cells.map((c: any) => `
Analysis: ${c.query}
Output: ${c.output?.text || 'No output'}
`).join('\n') || 'None'}

Insights:
${notebookContext.insights.map((i: any) => `- ${i.content}`).join('\n') || 'None'}

**YOUR TASK:**
Evaluate this claim using Toulmin's framework and return a JSON object with this EXACT structure:

{
  "grounds": [
    {
      "content": "specific evidence text from notebook",
      "sourceType": "insight" or "cell_output",
      "relevanceScore": 0.0-1.0,
      "strengthScore": 0.0-1.0
    }
  ],
  "warrant": {
    "statement": "one sentence explaining logical link between evidence and claim",
    "type": "causal" or "statistical" or "comparative" or "logical",
    "confidence": 0.0-1.0,
    "acceptanceLevel": "widely-accepted" or "domain-specific" or "controversial"
  },
  "overallScore": 0-100,
  "strength": "strong" or "moderate" or "weak" or "unsupported",
  "issues": [
    {
      "type": "no-evidence" or "weak-evidence" or "overclaim" or "missing-qualifier" or "causation-correlation",
      "severity": "critical" or "warning" or "info",
      "message": "short description",
      "explanation": "detailed explanation"
    }
  ],
  "gaps": [
    {
      "type": "missing-variable" or "missing-relationship",
      "description": "what analysis is missing",
      "missingConcepts": ["concept1", "concept2"],
      "importance": "critical" or "important" or "optional"
    }
  ],
  "qualifier": {
    "detected": ["existing qualifier words"],
    "missing": ["suggested qualifiers like 'some', 'many', 'likely'"],
    "appropriatenessScore": 0.0-1.0
  }
}

**IMPORTANT:**
- Be thorough in finding evidence from the notebook
- Score strength honestly based on evidence quality
- Identify ALL issues with the claim
- Return ONLY valid JSON, no other text`;
  }
  
  /**
   * Generate claim modifications using Gemini
   */
  async generateModifications(
    claimText: string,
    evaluation: any,
    modificationType: string
  ): Promise<{ suggestions: string[]; explanations: string[]; explanation: string }> {
    const prompt = this.buildModificationPrompt(claimText, evaluation, modificationType);
    const response = await this.callGemini(prompt);
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON in response');
    } catch (error) {
      console.error('Failed to parse Gemini response:', response);
      throw new Error('Invalid response format from Gemini');
    }
  }
  
  /**
   * Build modification prompt
   */
  private buildModificationPrompt(
    claimText: string,
    evaluation: any,
    modificationType: string
  ): string {
    return `You are an expert editor helping improve academic claims.

**ORIGINAL CLAIM:**
"${claimText}"

**EVALUATION:**
- Overall Score: ${evaluation.overallScore}/100
- Strength: ${evaluation.strength}
- Issues: ${evaluation.issues?.map((i: any) => i.message).join(', ') || 'None'}

**MODIFICATION TYPE:** ${modificationType}

**YOUR TASK:**
Generate 3-5 alternative phrasings for this claim that address the issues.

${modificationType === 'weaken' ? 'WEAKEN the claim by replacing absolute language with more cautious terms.' : ''}
${modificationType === 'caveat' ? 'ADD CAVEATS to acknowledge limitations in the data or analysis.' : ''}
${modificationType === 'reverse' ? 'REVERSE or REMOVE the claim if evidence is insufficient.' : ''}

Return a JSON object with this structure:
{
  "suggestions": ["alternative 1", "alternative 2", "alternative 3"],
  "explanations": ["why this works", "why this works", "why this works"],
  "explanation": "overall guidance for the user"
}

**IMPORTANT:**
- Suggestions must be grammatically correct
- Preserve the core meaning where possible
- Be specific about what you changed and why
- Return ONLY valid JSON, no other text`;
  }
}