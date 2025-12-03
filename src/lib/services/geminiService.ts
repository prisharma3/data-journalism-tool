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
  
private buildEvaluationPrompt(claim: ClaimStructure, notebookContext: any): string {
  return `You are a data journalism editor evaluating claims before publication.

**CLAIM TO EVALUATE:**
"${claim.text}"

**CLAIM TYPE:** ${claim.type}

---

**STEP 1: IS THIS ACTUALLY A CLAIM?**

If the text is a heading, transition, question, or method description, return:
{
"recommendedAction": "claim-is-fine",
"actionReasoning": "Not a substantive claim",
"toulminAnalysis": null,
"issues": [],
"gaps": [],
"modificationPaths": {}
}

---

**STEP 2: IF THIS IS A REAL CLAIM, PERFORM TOULMIN ANALYSIS**

Use this internal reasoning framework (the user will NOT see this analysis directly, but it guides your evaluation):

**GROUNDS** - What specific evidence from the notebook supports this claim?
- Look for: statistics, numbers, correlations, comparisons in the outputs
- Quote the exact text from notebook that serves as evidence
- If no evidence exists → claim has no grounds → "claim-might-need-change"

**WARRANT** - What unstated assumption links the grounds to the claim?
- Example: "Correlation in data implies real-world relationship"
- Example: "Sample results generalize to population"
- Is this warrant valid? Many warrants are flawed:
- "Correlation implies causation" (INVALID)
- "This sample represents all farmers" (OFTEN INVALID)
- "Statistical significance means practical importance" (OFTEN INVALID)

**BACKING** - What supports the warrant itself?
- Is there methodological justification?
- Is there domain knowledge that validates the logical leap?
- Example: If warrant is "midwest farmers represent US farmers", backing would need demographic similarity data

**QUALIFIER** - Does the claim have appropriate hedging?
- Look for: "suggests", "may", "in this sample", "among surveyed", "tends to"
- Missing qualifiers make claims too strong
- Absolute language ("all", "every", "proves", "always") needs strong justification

**REBUTTAL** - What conditions would make this claim false?
- Alternative explanations for the data?
- Confounding variables not controlled?
- Limitations in sample or methodology?
- If obvious rebuttals exist and aren't acknowledged, claim is overconfident

---

**AVAILABLE EVIDENCE FROM NOTEBOOK:**

Hypotheses:
${notebookContext.hypotheses?.map((h: any) => `- ${h.content}`).join('\n') || 'None'}

Analysis Results:
${notebookContext.cells?.map((c: any) => `
Query: ${c.query}
Output: ${c.output?.text || 'No output'}
`).join('\n') || 'None'}

Saved Insights:
${notebookContext.insights?.map((i: any) => `- ${i.content}`).join('\n') || 'None'}

---

**STEP 3: DECISION BASED ON TOULMIN ANALYSIS**

1. **"claim-is-fine"** 
 - Grounds exist and are relevant
 - Warrant is valid (or claim doesn't over-reach)
 - Qualifiers are appropriate
 - No obvious unaddressed rebuttals
 → Return empty issues array

2. **"claim-needs-change"**
 - Grounds exist BUT:
   - Warrant is invalid (e.g., claiming causation from correlation)
   - Qualifiers are missing (e.g., "all farmers" when data is midwest only)
   - Obvious rebuttals not acknowledged
 → Return specific issues with rewrites

3. **"claim-might-need-change"**
 - Grounds don't exist in notebook (no evidence found)
 - Can't evaluate warrant without evidence
 → Return gaps describing what analysis would provide grounds

---

**ISSUE TYPES:**

**CRITICAL** (claim is misleading):
- "invalid-warrant": Claim makes logical leap the evidence doesn't support (causation from correlation, generalization from limited sample)
- "no-grounds": No evidence in notebook supports this claim
- "contradicts-evidence": Claim says opposite of what data shows
- "unqualified-absolute": Uses "all/every/proves/always" without justification

**WARNING** (claim could be misread):
- "missing-qualifier": Should add "in this sample", "suggests", "among X group"
- "unacknowledged-rebuttal": Obvious alternative explanation not mentioned
- "weak-backing": Warrant relies on assumption that isn't justified

---

**GOOD ISSUE EXAMPLES:**

{
"severity": "critical",
"type": "invalid-warrant",
"message": "Correlation doesn't establish causation",
"explanation": "Your analysis shows correlation (r=-0.78) between tariffs and income, but the claim states tariffs 'cause' income loss. Other factors (weather, market prices, farm size) could explain this relationship.",
"suggestedFix": "Higher tariff exposure is associated with lower farmer income in our sample"
}

{
"severity": "critical",
"type": "incorrect-value",
"message": "Correlation value is factually incorrect",
"explanation": "The claim states a correlation of -0.92, but the notebook analysis shows the actual correlation between sepal width and sepal length is -0.1094 (a weak negative relationship).",
"suggestedFix": "However, sepal width and sepal length show a weak negative correlation of -0.11"
}

{
"severity": "critical", 
"type": "factual-error",
"message": "Dataset contains no psychological variables",
"explanation": "The iris dataset only contains flower measurements (sepal/petal dimensions). There are no personality or psychological variables to support this claim.",
"suggestedFix": null
}

{
"severity": "warning",
"type": "unacknowledged-rebuttal",
"message": "Acknowledge alternative explanation",
"explanation": "The income difference could also reflect regional economic factors unrelated to tariffs.",
"suggestedFix": "Income was 23% lower in high-tariff regions, though regional economic differences may also contribute"
}

---

**RETURN THIS JSON:**

{
"recommendedAction": "claim-is-fine" | "claim-needs-change" | "claim-might-need-change",
"actionReasoning": "One sentence explaining decision based on Toulmin analysis",
"toulminAnalysis": {
  "grounds": {
    "found": true | false,
    "evidence": ["Exact quotes from notebook"] | [],
    "strength": "strong" | "moderate" | "weak" | "none"
  },
  "warrant": {
    "impliedAssumption": "The unstated logical link",
    "isValid": true | false,
    "problem": "Why warrant fails (if invalid)" | null
  },
  "backing": {
    "exists": true | false,
    "description": "What supports the warrant" | null
  },
  "qualifier": {
    "present": ["qualifiers found in claim"],
    "missing": ["qualifiers that should be added"],
    "appropriate": true | false
  },
  "rebuttal": {
    "possibleRebuttals": ["Alternative explanations or limitations"],
    "acknowledged": true | false
  }
},
"issues": [
  {
    "severity": "critical" | "warning",
    "type": "invalid-warrant" | "no-grounds" | "contradicts-evidence" | "unqualified-absolute" | "missing-qualifier" | "unacknowledged-rebuttal" | "weak-backing" | "incorrect-value" | "factual-error",
    "message": "Direct instruction, 10 words max",
    "explanation": "Why this matters based on Toulmin analysis",
    "suggestedFix": "Complete rewritten claim with correct values"
  }
],
"gaps": [
    {
      "description": "What analysis is missing",
      "suggestedQuery": "Exact query to run" | null,
      "purpose": "strengthen" | "weaken" | "add-caveat" | "justify-removal",
      "explanation": "How running this analysis would help resolve the claim issue"
    }
  ],
  "modificationPaths": {
    "weaken": "Version with softer causal/absolute language",
    "caveat": "Version with scope limitations or qualifiers added",
    "remove": "What to write instead if claim should be cut entirely"
  }
}

**CRITICAL RULES - QUALITY OVER QUANTITY:**

1. ISSUE LIMITS:
   - Return MAXIMUM 1 issue per claim (only the single most important problem)
   - If claim is fine, return ZERO issues
   - Never return generic messages - every issue must be specific to THIS claim

2. INCORRECT VALUES vs UNSUPPORTABLE CLAIMS:
   - If a claim states a SPECIFIC NUMBER that contradicts the data, use type "incorrect-value"
     - Example: Claim says "correlation of -0.92" but data shows -0.11 → incorrect-value, NOT remove-claim
     - The suggestedFix MUST include the correct number from the notebook
   - If a claim references something OUTSIDE the dataset entirely, use type "factual-error" with canBeResolved: false
     - Example: "predicts personality traits" when dataset has no personality data → factual-error
   - ONLY suggest "remove-claim" when the entire premise is wrong, not just a number

3. MESSAGE QUALITY:
   - NEVER use generic messages like "This claim cannot be supported with available data"
   - Each message must reference the SPECIFIC problem (e.g., "No correlation data found for sepal width vs petal length")
   - Each explanation must cite SPECIFIC evidence from notebook or explain EXACTLY what's missing

4. WHEN TO RETURN ZERO ISSUES:
   - Claim is descriptive and matches data (e.g., "The dataset contains 150 samples")
   - Claim has appropriate qualifiers ("suggests", "may", "in this sample")
   - Evidence exists in notebook that supports the claim

5. FUNDAMENTALLY UNSUPPORTABLE - BE SPECIFIC:
   - Don't just say "cannot be supported" - explain WHY
   - Good: "The iris dataset contains no psychological variables, so personality predictions are impossible"
   - Bad: "This claim cannot be supported with available data"

6. GAPS MUST BE ACTIONABLE:
   - Only suggest analyses the user can actually run with their data
   - suggestedQuery must be a real, executable query
   - If no useful analysis is possible, set canBeResolved: false and explain why
- Return ONLY valid JSON`;
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
    return `You are an expert editor helping improve academic claims

**ORIGINAL CLAIM:**
"${claimText}"

**EVALUATION:**
- Strength: ${evaluation.strength}
- Issues: ${evaluation.issues?.map((i: any) => i.message).join(', ') || 'None'}

**MODIFICATION TYPE:** ${modificationType}

**YOUR TASK:**
Generate 1-3 alternative phrasings for this claim that address the issues.

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