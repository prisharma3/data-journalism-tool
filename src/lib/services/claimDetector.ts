/**
 * CLAIM DETECTOR SERVICE
 * Detects claims in text using NLP and pattern matching
 */

import nlp from 'compromise';

export interface DetectedClaim {
  text: string;
  position: { from: number; to: number };
  type: 'causal' | 'comparative' | 'predictive' | 'descriptive';
  confidence: number;
  strongLanguage: Array<{
    word: string;
    type: 'absolute' | 'hedge' | 'causal' | 'comparative';
    intensity: number;
  }>;
}

export class ClaimDetector {
  // Words that indicate claims
  private claimIndicators = [
    'shows', 'proves', 'demonstrates', 'indicates', 'suggests', 'reveals',
    'cause', 'causes', 'leads to', 'results in', 'affects', 'impacts',
    'more than', 'less than', 'better', 'worse',
    'will', 'would', 'should', 'perform'
  ];

  // Strong absolute language
  private absoluteWords = [
    'definitely', 'certainly', 'always', 'never', 'all', 'none',
    'proves', 'guarantees', 'ensures', 'must'
  ];

  // Hedge words (qualifiers)
  private hedgeWords = [
    'might', 'could', 'possibly', 'probably', 'likely',
    'suggests', 'indicates', 'some', 'many', 'often'
  ];

  /**
   * Detect claims in text
   */
  detectClaims(text: string): DetectedClaim[] {
    const claims: DetectedClaim[] = [];
    const doc = nlp(text);
    const sentences = doc.sentences().json();

    let currentPosition = 0;

    for (const sentence of sentences) {
      const sentenceText = sentence.text as string;
      const isClaim = this.isClaim(sentenceText);

      if (isClaim) {
        const from = text.indexOf(sentenceText, currentPosition);
        const to = from + sentenceText.length;

        claims.push({
          text: sentenceText,
          position: { from, to },
          type: this.classifyClaimType(sentenceText),
          confidence: this.calculateConfidence(sentenceText),
          strongLanguage: this.detectStrongLanguage(sentenceText, from),
        });
      }

      currentPosition += sentenceText.length;
    }

    return claims;
  }

  /**
   * Check if sentence is a claim
   */
  private isClaim(sentence: string): boolean {
    const lower = sentence.toLowerCase();
    
    // Check for claim indicators
    const hasIndicator = this.claimIndicators.some(indicator => 
      lower.includes(indicator)
    );

    // Check for strong assertions
    const hasAssertion = this.absoluteWords.some(word => 
      lower.includes(word)
    );

    return hasIndicator || hasAssertion;
  }

  /**
   * Classify claim type
   */
  private classifyClaimType(sentence: string): 'causal' | 'comparative' | 'predictive' | 'descriptive' {
    const lower = sentence.toLowerCase();

    // Causal
    if (lower.match(/causes?|leads? to|results? in|affects?|due to|because/)) {
      return 'causal';
    }

    // Comparative
    if (lower.match(/more|less|better|worse|higher|lower|greater|smaller/)) {
      return 'comparative';
    }

    // Predictive
    if (lower.match(/will|would|going to|expect|predict|forecast/)) {
      return 'predictive';
    }

    return 'descriptive';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(sentence: string): number {
    let score = 0.5; // Base confidence

    const lower = sentence.toLowerCase();

    // Increase confidence for claim indicators
    for (const indicator of this.claimIndicators) {
      if (lower.includes(indicator)) {
        score += 0.1;
      }
    }

    // Increase for absolute language
    for (const word of this.absoluteWords) {
      if (lower.includes(word)) {
        score += 0.15;
      }
    }

    // Decrease for hedge words
    for (const word of this.hedgeWords) {
      if (lower.includes(word)) {
        score -= 0.05;
      }
    }

    return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
  }

  /**
   * Detect strong language markers
   */
  private detectStrongLanguage(sentence: string, startOffset: number) {
    const markers: Array<{
      word: string;
      type: 'absolute' | 'hedge' | 'causal' | 'comparative';
      intensity: number;
    }> = [];

    const lower = sentence.toLowerCase();

    // Check absolute words
    for (const word of this.absoluteWords) {
      if (lower.includes(word)) {
        const index = lower.indexOf(word);
        markers.push({
          word,
          type: 'absolute',
          intensity: 0.9,
        });
      }
    }

    // Check hedge words
    for (const word of this.hedgeWords) {
      if (lower.includes(word)) {
        markers.push({
          word,
          type: 'hedge',
          intensity: 0.3,
        });
      }
    }

    return markers;
  }
}