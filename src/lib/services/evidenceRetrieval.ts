/**
 * EVIDENCE RETRIEVAL SERVICE
 * Finds evidence in notebook that supports/contradicts claims
 */

import { Evidence, ExtractedStatistic } from '@/types/writing';
import { generateId } from '@/lib/utils/text';
import { extractKeyTerms } from '@/lib/utils/text';

interface NotebookContent {
  cells: Array<{
    id: string;
    query: string;
    output?: {
      text: string;
      plot?: string;
    };
    hypothesisTags?: string[];
  }>;
  insights: Array<{
    id: string;
    content: string;
    cellId: string;
    hypothesisTags?: string[];
  }>;
  hypotheses: Array<{
    id: string;
    content: string;
  }>;
}

export class EvidenceRetrieval {
  /**
   * Find evidence supporting a claim
   */
  findEvidence(claimText: string, notebookContent: NotebookContent): Evidence[] {
    const evidence: Evidence[] = [];
    
    // Extract key terms from claim
    const claimTerms = extractKeyTerms(claimText);
    
    // Search through insights
    for (const insight of notebookContent.insights) {
      const relevance = this.calculateRelevance(claimText, insight.content, claimTerms);
      
      if (relevance > 0.3) { // Threshold for relevance
        evidence.push({
          id: generateId('evidence'),
          type: 'insight',
          sourceId: insight.id,
          sourceType: 'insight',
          content: insight.content,
          relevanceScore: relevance,
          strengthScore: 0.8, // Insights are strong (user-curated)
          recencyScore: 1.0, // TODO: Calculate based on timestamp
          confidenceScore: 0.7, // Default for insights
          hypothesisTags: insight.hypothesisTags || [],
          extractedStatistics: [],
          cellQuery: undefined,
        });
      }
    }
    
    // Search through cell outputs
    for (const cell of notebookContent.cells) {
      if (cell.output?.text) {
        const relevance = this.calculateRelevance(claimText, cell.output.text, claimTerms);
        
        if (relevance > 0.3) {
          evidence.push({
            id: generateId('evidence'),
            type: 'textual',
            sourceId: cell.id,
            sourceType: 'cell_output',
            content: cell.output.text,
            relevanceScore: relevance,
            strengthScore: 0.6, // Raw outputs less strong than insights
            recencyScore: 1.0,
            confidenceScore: 0.5,
            hypothesisTags: cell.hypothesisTags || [],
            extractedStatistics: this.extractStatistics(cell.output.text),
            cellQuery: cell.query,
            plotUrl: cell.output.plot,
          });
        }
      }
    }
    
    // Sort by relevance score (highest first)
    evidence.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Return top 10 most relevant pieces of evidence
    return evidence.slice(0, 10);
  }
  
/**
   * Calculate relevance between claim and evidence
   */
private calculateRelevance(claim: string, evidence: string, claimTerms: string[]): number {
    const evidenceLower = evidence.toLowerCase();
    const claimLower = claim.toLowerCase();
    
    let score = 0;
    
    // Check for exact phrase match (very strong signal)
    if (evidenceLower.includes(claimLower)) {
      return 1.0;
    }
    
    // Check for term overlap - more terms matched = higher relevance
    if (claimTerms.length === 0) {
      return 0;
    }
    
    let matchedTerms = 0;
    for (const term of claimTerms) {
      if (evidenceLower.includes(term)) {
        matchedTerms++;
      }
    }
    
    // Calculate percentage of terms matched
    const matchPercentage = matchedTerms / claimTerms.length;
    score = matchPercentage;
    
    // Bonus: if evidence and claim share multiple words in sequence
    const claimWords = claimLower.split(/\s+/);
    for (let i = 0; i < claimWords.length - 1; i++) {
      const bigram = claimWords[i] + ' ' + claimWords[i + 1];
      if (evidenceLower.includes(bigram)) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Extract statistics from text
   */
  private extractStatistics(text: string): ExtractedStatistic[] {
    const statistics: ExtractedStatistic[] = [];
    
    // Match percentages
    const percentageRegex = /(\d+(?:\.\d+)?)\s*%/g;
    let match;
    while ((match = percentageRegex.exec(text)) !== null) {
      statistics.push({
        type: 'percentage',
        value: parseFloat(match[1]),
        unit: '%',
        context: this.getContext(text, match.index),
      });
    }
    
    // Match correlations
    const correlationRegex = /correlation[:\s]+(-?\d+\.\d+)/gi;
    while ((match = correlationRegex.exec(text)) !== null) {
      statistics.push({
        type: 'correlation',
        value: parseFloat(match[1]),
        context: this.getContext(text, match.index),
      });
    }
    
    // Match p-values
    const pValueRegex = /p[:\s]*[=<>]\s*(\d+\.\d+)/gi;
    while ((match = pValueRegex.exec(text)) !== null) {
      statistics.push({
        type: 'p-value',
        value: parseFloat(match[1]),
        context: this.getContext(text, match.index),
      });
    }
    
    return statistics;
  }
  
  /**
   * Get surrounding context for a statistic
   */
  private getContext(text: string, position: number, contextLength: number = 100): string {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(text.length, position + contextLength);
    return text.substring(start, end).trim();
  }
}