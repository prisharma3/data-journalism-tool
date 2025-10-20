/**
 * REMEMBRANCE AGENT SERVICE
 * Continuously monitors writing context and suggests relevant analyses
 */

import { RelevantAnalysis, WritingContext } from '@/types/writing';
import { ContextMonitor } from './contextMonitor';
import { SemanticIndexer } from './semanticIndexer';
import { generateId } from '@/lib/utils/text';

export class RemembranceAgent {
  private contextMonitor: ContextMonitor;
  private indexer: SemanticIndexer;
  private isIndexed: boolean = false;
  
  constructor() {
    this.contextMonitor = new ContextMonitor();
    this.indexer = new SemanticIndexer();
  }
  
  /**
   * Index notebook content (call this when notebook changes)
   */
  async indexNotebook(
    notebookContent: any,
    generateEmbedding: (text: string) => Promise<number[]>
  ): Promise<void> {
    await this.indexer.indexNotebook(notebookContent, generateEmbedding);
    this.isIndexed = true;
  }
  
  /**
   * Get relevant analyses for current writing context
   */
  async getRelevantAnalyses(
    text: string,
    cursorPosition: number,
    activeHypothesis: string | undefined,
    generateEmbedding: (text: string) => Promise<number[]>,
    notebookContent: any
  ): Promise<RelevantAnalysis[]> {
    // Update context
    const context = this.contextMonitor.updateContext(
      text,
      cursorPosition,
      activeHypothesis
    );
    
    // Ensure notebook is indexed
    if (!this.isIndexed) {
      await this.indexNotebook(notebookContent, generateEmbedding);
    }
    
    // Generate embedding for current context
    const contextEmbedding = await generateEmbedding(context.currentParagraph);
    
    // Search for relevant content
    const searchResults = this.indexer.search(
      contextEmbedding,
      5, // Top 5 results
      {
        hypothesisIds: activeHypothesis ? [activeHypothesis] : undefined,
      }
    );
    
    // Convert to RelevantAnalysis format with scoring
    const relevantAnalyses: RelevantAnalysis[] = searchResults.map(result => {
      // Calculate scores
      const relevanceScore = result.similarity;
      const hypothesisAlignment = this.calculateHypothesisAlignment(
        result.metadata.hypothesisTags || [],
        activeHypothesis
      );
      const recencyScore = this.calculateRecencyScore(result.metadata.timestamp);
      
      // Overall score (weighted combination)
      const overallScore = 
        relevanceScore * 0.5 +           // 50% weight on semantic similarity
        hypothesisAlignment * 0.3 +      // 30% weight on hypothesis match
        recencyScore * 0.2;              // 20% weight on recency
      
      // Create snippet (truncated content)
      const snippet = result.content.length > 150
        ? result.content.substring(0, 150) + '...'
        : result.content;
      
      return {
        cellId: result.metadata.cellId || result.id,
        insightId: result.type === 'insight' ? result.id : undefined,
        type: result.type === 'hypothesis' ? 'hypothesis' : 
              result.type === 'insight' ? 'insight' : 'analysis',
        content: result.content,
        snippet,
        relevanceScore,
        hypothesisAlignment,
        recencyScore,
        overallScore,
        hypothesisTags: result.metadata.hypothesisTags || [],
        query: undefined, // Could extract from cell if needed
        highlightedTerms: context.dominantConcepts,
      };
    });
    
    // Sort by overall score
    relevantAnalyses.sort((a, b) => b.overallScore - a.overallScore);
    
    return relevantAnalyses;
  }
  
  /**
   * Calculate hypothesis alignment score
   */
  private calculateHypothesisAlignment(
    contentHypotheses: string[],
    activeHypothesis?: string
  ): number {
    if (!activeHypothesis) return 0.5; // Neutral if no active hypothesis
    
    return contentHypotheses.includes(activeHypothesis) ? 1.0 : 0.3;
  }
  
  /**
   * Calculate recency score (newer = higher score)
   */
  private calculateRecencyScore(timestamp: Date): number {
    const now = new Date();
    const ageInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    // Exponential decay: score = e^(-age/24)
    // Recent (< 1 hour) = 1.0
    // 1 day old = 0.37
    // 3 days old = 0.05
    return Math.exp(-ageInHours / 24);
  }
  
  /**
   * Get current context
   */
  getCurrentContext(): WritingContext | null {
    return this.contextMonitor.getCurrentContext();
  }
  
  /**
   * Get indexer status
   */
  getIndexStatus() {
    return this.indexer.getStatus();
  }
  
  /**
   * Clear and reindex
   */
  async reindex(
    notebookContent: any,
    generateEmbedding: (text: string) => Promise<number[]>
  ): Promise<void> {
    this.indexer.clear();
    await this.indexNotebook(notebookContent, generateEmbedding);
  }
}