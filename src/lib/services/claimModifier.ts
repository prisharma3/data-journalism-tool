/**
 * CLAIM MODIFIER SERVICE
 * Generates alternative phrasings for claims
 */

export interface ModificationSuggestion {
    text: string;
    explanation: string;
    confidence: number;
  }
  
  export class ClaimModifier {
    /**
     * Weaken a claim by replacing strong language
     */
    weakenClaim(claimText: string): ModificationSuggestion[] {
      const suggestions: ModificationSuggestion[] = [];
      
      // Define replacement mappings
      const replacements = [
        { from: 'definitely', to: ['suggests', 'indicates', 'appears to'], strength: 'strong' },
        { from: 'certainly', to: ['likely', 'probably', 'appears'], strength: 'strong' },
        { from: 'proves', to: ['suggests', 'indicates', 'shows'], strength: 'strong' },
        { from: 'always', to: ['often', 'typically', 'generally'], strength: 'strong' },
        { from: 'never', to: ['rarely', 'seldom', 'infrequently'], strength: 'strong' },
        { from: 'all', to: ['most', 'many', 'the majority of'], strength: 'moderate' },
        { from: 'causes', to: ['is associated with', 'correlates with', 'relates to'], strength: 'moderate' },
        { from: 'guarantees', to: ['suggests', 'indicates', 'may lead to'], strength: 'strong' },
      ];
      
      const lower = claimText.toLowerCase();
      
      for (const replacement of replacements) {
        const regex = new RegExp(`\\b${replacement.from}\\b`, 'gi');
        
        if (regex.test(claimText)) {
          for (const alternative of replacement.to) {
            let modified = claimText.replace(regex, alternative);
            
            // Fix grammar: if we replaced a verb, adjust following verb
            if (replacement.from === 'causes' && alternative.includes('associated')) {
              // "causes" -> "is associated with" 
              modified = modified.replace(/is associated with/i, 'are associated with');
            }
            
            suggestions.push({
              text: modified,
              explanation: `Replaced "${replacement.from}" with "${alternative}" to reduce claim strength`,
              confidence: 0.85,
            });
          }
        }
      }
      
      // If no direct replacements found, add general weakening phrases
      if (suggestions.length === 0) {
        suggestions.push({
          text: `The evidence suggests that ${claimText.toLowerCase()}`,
          explanation: 'Added qualifying phrase to indicate uncertainty',
          confidence: 0.7,
        });
        
        suggestions.push({
          text: `${claimText.replace(/\.$/, '')} in some cases.`,
          explanation: 'Added scope limitation',
          confidence: 0.7,
        });
      }
      
      return suggestions.slice(0, 5); // Return top 5
    }
    
    /**
     * Add caveats to a claim
     */
    addCaveats(claimText: string, evidenceLimitations: string[]): ModificationSuggestion[] {
      const suggestions: ModificationSuggestion[] = [];
      
      // Conditional caveats
      suggestions.push({
        text: `Based on the available data, ${claimText.toLowerCase()}`,
        explanation: 'Added caveat acknowledging data limitations',
        confidence: 0.9,
      });
      
      suggestions.push({
        text: `In this analysis, ${claimText.toLowerCase()}`,
        explanation: 'Limited scope to current analysis',
        confidence: 0.85,
      });
      
      // Add "some" qualifier if not present
      if (!claimText.toLowerCase().includes('some') && !claimText.toLowerCase().includes('many')) {
        const words = claimText.split(' ');
        if (words.length > 2) {
          // Insert "some" before the first noun (simplified heuristic)
          words.splice(1, 0, 'some');
          suggestions.push({
            text: words.join(' '),
            explanation: 'Added "some" to acknowledge not all cases apply',
            confidence: 0.8,
          });
        }
      }
      
      // Preliminary findings caveat
      suggestions.push({
        text: `Preliminary analysis suggests ${claimText.toLowerCase()}`,
        explanation: 'Framed as preliminary to acknowledge need for further validation',
        confidence: 0.8,
      });
      
      return suggestions;
    }
    
    /**
     * Reverse or remove a claim
     */
    reverseOrRemove(claimText: string, hasContradictoryEvidence: boolean): ModificationSuggestion[] {
      const suggestions: ModificationSuggestion[] = [];
      
      if (hasContradictoryEvidence) {
        // Try to reverse the claim
        const reversed = this.reverseStatement(claimText);
        if (reversed) {
          suggestions.push({
            text: reversed,
            explanation: 'Evidence suggests the opposite conclusion',
            confidence: 0.7,
          });
        }
      }
      
      // Suggest stating uncertainty
      suggestions.push({
        text: `It is unclear whether ${claimText.toLowerCase().replace(/\.$/, '')}.`,
        explanation: 'Acknowledged uncertainty due to insufficient evidence',
        confidence: 0.85,
      });
      
      // Suggest framing as question
      suggestions.push({
        text: `Does ${claimText.toLowerCase().replace(/\.$/, '')}?`,
        explanation: 'Reframed as research question rather than assertion',
        confidence: 0.8,
      });
      
      // Suggest removal
      suggestions.push({
        text: '[Consider removing this claim]',
        explanation: 'No supporting evidence found - consider removing entirely',
        confidence: 0.9,
      });
      
      return suggestions;
    }
    
    /**
     * Attempt to reverse a statement
     */
    private reverseStatement(statement: string): string | null {
      const lower = statement.toLowerCase();
      
      // Simple reversals
      if (lower.includes('increase')) {
        return statement.replace(/increase/gi, 'decrease');
      }
      if (lower.includes('decrease')) {
        return statement.replace(/decrease/gi, 'increase');
      }
      if (lower.includes('harm')) {
        return statement.replace(/harm/gi, 'benefit');
      }
      if (lower.includes('benefit')) {
        return statement.replace(/benefit/gi, 'harm');
      }
      if (lower.includes('positive')) {
        return statement.replace(/positive/gi, 'negative');
      }
      if (lower.includes('negative')) {
        return statement.replace(/negative/gi, 'positive');
      }
      
      // Add "not" before main verb (simplified)
      if (lower.includes(' is ') || lower.includes(' are ')) {
        return statement.replace(/(is|are)/i, '$1 not');
      }
      
      return null;
    }
    
    /**
     * Generate modifications based on issue type
     */
    generateModifications(
      claimText: string,
      issueType: string,
      context?: any
    ): ModificationSuggestion[] {
      switch (issueType) {
        case 'overclaim':
        case 'missing-qualifier':
          return this.weakenClaim(claimText);
        
        case 'weak-evidence':
          return this.addCaveats(claimText, []);
        
        case 'no-evidence':
          return this.reverseOrRemove(claimText, false);
        
        case 'causation-correlation':
          return this.weakenClaim(claimText);
        
        default:
          return this.weakenClaim(claimText);
      }
    }
  }