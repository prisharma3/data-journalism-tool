/**
 * WARRANT IDENTIFIER SERVICE
 * Identifies the logical link between evidence and claim
 */

import { Warrant, Evidence } from '@/types/writing';

export class WarrantIdentifier {
  /**
   * Identify warrant for a claim based on evidence
   */
  identifyWarrant(
    claimText: string,
    claimType: string,
    evidence: Evidence[]
  ): Warrant {
    // Determine warrant type based on claim type and evidence
    const warrantType = this.determineWarrantType(claimType, evidence);
    
    // Generate warrant statement
    const statement = this.generateWarrantStatement(claimText, claimType, evidence);
    
    // Assess acceptance level
    const acceptanceLevel = this.assessAcceptanceLevel(warrantType, evidence);
    
    return {
      statement,
      type: warrantType,
      isExplicit: false, // Most warrants are implicit
      acceptanceLevel,
      needsBacking: acceptanceLevel !== 'widely-accepted',
      confidence: this.calculateWarrantConfidence(evidence),
    };
  }
  
  /**
   * Determine warrant type
   */
  private determineWarrantType(
    claimType: string,
    evidence: Evidence[]
  ): 'causal' | 'statistical' | 'comparative' | 'definitional' | 'expert' | 'logical' {
    // Check if evidence contains statistics
    const hasStatistics = evidence.some(e => e.extractedStatistics.length > 0);
    
    if (claimType === 'causal') {
      return hasStatistics ? 'statistical' : 'causal';
    }
    
    if (claimType === 'comparative') {
      return 'comparative';
    }
    
    if (claimType === 'predictive') {
      return 'logical';
    }
    
    return hasStatistics ? 'statistical' : 'logical';
  }
  
  /**
   * Generate warrant statement
   */
  private generateWarrantStatement(
    claimText: string,
    claimType: string,
    evidence: Evidence[]
  ): string {
    const hasStatistics = evidence.some(e => e.extractedStatistics.length > 0);
    
    if (claimType === 'causal') {
      if (hasStatistics) {
        return 'Statistical correlation between variables suggests a causal relationship';
      }
      return 'Observed patterns indicate a cause-and-effect relationship';
    }
    
    if (claimType === 'comparative') {
      return 'Comparing values across groups reveals relative differences';
    }
    
    if (claimType === 'predictive') {
      return 'Historical trends and current data support future projections';
    }
    
    return 'The available evidence supports this assertion';
  }
  
  /**
   * Assess acceptance level
   */
  private assessAcceptanceLevel(
    warrantType: string,
    evidence: Evidence[]
  ): 'widely-accepted' | 'domain-specific' | 'controversial' | 'unknown' {
    // Statistical warrants with strong evidence are widely accepted
    if (warrantType === 'statistical' && evidence.length > 2) {
      return 'widely-accepted';
    }
    
    // Comparative warrants are generally accepted
    if (warrantType === 'comparative') {
      return 'widely-accepted';
    }
    
    // Causal warrants need strong evidence
    if (warrantType === 'causal') {
      return evidence.length > 3 ? 'domain-specific' : 'controversial';
    }
    
    return 'domain-specific';
  }
  
  /**
   * Calculate warrant confidence
   */
  private calculateWarrantConfidence(evidence: Evidence[]): number {
    if (evidence.length === 0) return 0.2;
    
    // Average the strength scores of evidence
    const avgStrength = evidence.reduce((sum, e) => sum + e.strengthScore, 0) / evidence.length;
    
    // Factor in quantity of evidence
    const quantityBonus = Math.min(evidence.length * 0.1, 0.3);
    
    return Math.min(avgStrength + quantityBonus, 1.0);
  }
}