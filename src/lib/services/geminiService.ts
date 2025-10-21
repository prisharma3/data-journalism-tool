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
            temperature: 0.2,
            maxOutputTokens: 8192,
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
 * Extract and parse JSON from Gemini response
 * IMPROVED: Handles markdown code blocks and gets complete JSON
 */
private parseGeminiJSON(response: string): any {
    try {
      // Remove markdown code blocks
      let cleaned = response.trim();
      cleaned = cleaned.replace(/```json\s*/gi, '');
      cleaned = cleaned.replace(/```\s*/g, '');
      cleaned = cleaned.trim();
      
      // Find the start of JSON
      const startIndex = cleaned.indexOf('{');
      if (startIndex === -1) {
        throw new Error('No JSON object found');
      }
      
      // Find the matching closing brace using a counter
      let braceCount = 0;
      let endIndex = -1;
      
      for (let i = startIndex; i < cleaned.length; i++) {
        if (cleaned[i] === '{') braceCount++;
        if (cleaned[i] === '}') braceCount--;
        
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
      
      if (endIndex === -1) {
        throw new Error('Unclosed JSON object');
      }
      
      const jsonStr = cleaned.substring(startIndex, endIndex);
      return JSON.parse(jsonStr);
      
    } catch (error) {
      console.error('Failed to parse Gemini response:', response);
      throw new Error('Invalid JSON response from Gemini');
    }
  }
  
  /**
   * Evaluate claim using Toulmin framework with Gemini
   */
  async evaluateClaim(claim: ClaimStructure, notebookContext: any): Promise<any> {
    const prompt = this.buildEvaluationPrompt(claim, notebookContext);
    const response = await this.callGemini(prompt);
    return this.parseGeminiJSON(response);
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
    return this.parseGeminiJSON(response);
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

  /**
   * Detect claims in text using Gemini
   */
  async detectClaims(text: string, projectContext?: any): Promise<any[]> {
    const prompt = this.buildClaimDetectionPrompt(text, projectContext);
    const response = await this.callGemini(prompt);
    
    console.log('Response length:', response.length);
    console.log('Response preview:', response.substring(0, 200));
    
    try {
      const result = this.parseGeminiJSON(response);
      console.log('Parsed successfully, claims count:', result.claims?.length || 0);
      return result.claims || [];
    } catch (error: any) {
      console.error('Parse error:', error.message);
      
      // Log where parsing failed
      const cleaned = response.trim()
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      console.log('Cleaned response ends with:', cleaned.substring(cleaned.length - 100));
      return [];
    }
  }
  
  /**
   * Build claim detection prompt
   */
  private buildClaimDetectionPrompt(text: string, projectContext?: any): string {
    return `You are an expert research analyst identifying claims in academic writing.

**TEXT TO ANALYZE:**
"${text}"

${projectContext?.hypotheses ? `
**RESEARCH CONTEXT:**
The author is investigating these research questions:
${projectContext.hypotheses.map((h: any) => `- ${h.content}`).join('\n')}
` : ''}

**YOUR TASK:**
Identify all claims (assertions that require evidence) in this text. A claim is a statement that:
1. Makes an assertion about reality, relationships, or outcomes
2. Requires evidence or data to support it
3. Is not merely a description of the data itself

**NOT CLAIMS:**
- Questions ("Does X affect Y?")
- Descriptions of data ("The dataset has 1000 rows")
- Methodological statements ("We used regression analysis")

Return a JSON object with this structure:
{
  "claims": [
    {
      "text": "the exact claim sentence",
      "type": "causal" or "comparative" or "predictive" or "descriptive",
      "position": {
        "from": character_offset_start,
        "to": character_offset_end
      },
      "confidence": 0.0-1.0,
      "reasoning": "why this is a claim",
      "strongLanguage": [
        {
          "word": "definitely",
          "type": "absolute" or "hedge" or "causal" or "comparative",
          "intensity": 0.0-1.0
        }
      ]
    }
  ]
}

**CLAIM TYPES:**
- causal: Claims X causes/affects Y
- comparative: Claims X is more/less/better than Y  
- predictive: Claims X will happen in the future
- descriptive: Claims X has property Y

**STRONG LANGUAGE:**
- absolute: definitely, certainly, always, never, proves, all, none
- hedge: might, could, possibly, likely, some, many
- causal: causes, leads to, results in, affects
- comparative: more, less, better, worse, higher, lower

**IMPORTANT:**
- Return ONLY valid JSON, no other text
- Be precise with character positions
- Only flag actual claims that need evidence support`;
  }

  /**
   * Generate analysis suggestions for gaps
   */
  async suggestAnalysis(
    claim: string,
    gaps: any[],
    notebookContext: any
  ): Promise<any[]> {
    const prompt = this.buildAnalysisSuggestionPrompt(claim, gaps, notebookContext);
    const response = await this.callGemini(prompt);
    
    try {
      const result = this.parseGeminiJSON(response);
      return result.suggestions || [];
    } catch (error) {
      console.error('Failed to parse analysis suggestions from Gemini');
      return [];
    }
  }
  
  /**
   * Build analysis suggestion prompt
   */
  private buildAnalysisSuggestionPrompt(
    claim: string,
    gaps: any[],
    notebookContext: any
  ): string {
    return `You are an expert data analyst helping users design analyses to support their claims.

**USER'S CLAIM:**
"${claim}"

**IDENTIFIED GAPS:**
${gaps.map(g => `- ${g.description} (missing: ${g.missingConcepts.join(', ')})`).join('\n')}

**AVAILABLE DATA:**
Dataset: ${notebookContext.dataset?.filename || 'Unknown'}
${notebookContext.dataset?.summary ? `
Columns: ${notebookContext.dataset.summary.columnNames?.join(', ') || 'Unknown'}
Rows: ${notebookContext.dataset.summary.rows || 'Unknown'}
` : ''}

**EXISTING ANALYSES:**
${notebookContext.cells.map((c: any) => `- ${c.query}`).join('\n') || 'None yet'}

**YOUR TASK:**
Generate 2-3 specific analysis suggestions that would fill these gaps and strengthen the claim.

Return a JSON object with this structure:
{
  "suggestions": [
    {
      "title": "Short descriptive title",
      "naturalLanguageQuery": "Specific query for code generation (e.g., 'Show correlation between X and Y for ages 18-25')",
      "explanation": "Why this analysis is needed (1-2 sentences)",
      "expectedOutput": "What kind of results to expect",
      "priority": "high" or "medium" or "low",
      "estimatedComplexity": "simple" or "moderate" or "complex",
      "fillsGaps": ["gap type 1", "gap type 2"]
    }
  ]
}

**GUIDELINES:**
- Be specific: mention exact variables, groups, or relationships to analyze
- Make queries actionable: they should be ready for code generation
- Prioritize analyses that directly test the claim
- Consider the available data columns
- Don't suggest analyses that already exist
- Return ONLY valid JSON, no other text`;
  }
}