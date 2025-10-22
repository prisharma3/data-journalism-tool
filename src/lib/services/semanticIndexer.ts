/**
 * SEMANTIC INDEXER SERVICE
 * Creates searchable index of notebook content
 */

import { SearchIndexEntry } from '@/types/notebook';
import { generateId } from '@/lib/utils/text';

export class SemanticIndexer {
  private index: SearchIndexEntry[] = [];
  private lastIndexTime: Date | null = null;
  
  /**
   * Index all notebook content
   */
  async indexNotebook(notebookContent: {
    cells: any[];
    insights: any[];
    hypotheses: any[];
  }, generateEmbedding: (text: string) => Promise<number[]>): Promise<void> {
    this.index = [];
    
    // Index hypotheses
    for (const hypothesis of notebookContent.hypotheses) {
      const embedding = await generateEmbedding(hypothesis.content);
      this.index.push({
        id: hypothesis.id,
        type: 'hypothesis',
        content: hypothesis.content,
        embedding,
        metadata: {
          hypothesisTags: [hypothesis.id],
          timestamp: new Date(),
        },
      });
    }
    
    // Index insights
    for (const insight of notebookContent.insights) {
      const embedding = await generateEmbedding(insight.content);
      this.index.push({
        id: insight.id,
        type: 'insight',
        content: insight.content,
        embedding,
        metadata: {
          cellId: insight.cellId,
          hypothesisTags: insight.hypothesisTags || [],
          timestamp: new Date(),
        },
      });
    }
    
    // Index cell outputs
    for (const cell of notebookContent.cells) {
      if (cell.output?.text) {
        // Index the query + output together for better context
        const content = `${cell.query}\n${cell.output.text}`;
        const embedding = await generateEmbedding(content);
        this.index.push({
          id: cell.id,
          type: 'cell',
          content,
          embedding,
          metadata: {
            cellId: cell.id,
            hypothesisTags: cell.hypothesisTags || [],
            timestamp: new Date(),
          },
        });
      }
    }
    
    // Update last index time
    this.lastIndexTime = new Date();
  }
  
  /**
   * Search index by embedding similarity
   */
  search(
    queryEmbedding: number[],
    topK: number = 5,
    filters?: {
      hypothesisIds?: string[];
      contentTypes?: ('cell' | 'insight' | 'hypothesis')[];
    }
  ): Array<SearchIndexEntry & { similarity: number }> {
    // Apply filters
    let filteredIndex = this.index;
    
    if (filters?.hypothesisIds && filters.hypothesisIds.length > 0) {
      filteredIndex = filteredIndex.filter(entry => 
        entry.metadata.hypothesisTags?.some(tag => filters.hypothesisIds!.includes(tag))
      );
    }
    
    if (filters?.contentTypes && filters.contentTypes.length > 0) {
      filteredIndex = filteredIndex.filter(entry => 
        filters.contentTypes!.includes(entry.type)
      );
    }
    
    // Calculate similarities
    const results = filteredIndex.map(entry => ({
      ...entry,
      similarity: this.cosineSimilarity(queryEmbedding, entry.embedding),
    }));
    
    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Return top K
    return results.slice(0, topK);
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  /**
   * Get index status
   */
  getStatus(): {
    itemsIndexed: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {
      cell: 0,
      insight: 0,
      hypothesis: 0,
    };
    
    for (const entry of this.index) {
      byType[entry.type]++;
    }
    
    return {
      itemsIndexed: this.index.length,
      byType,
    };
  }
  
  /**
   * Get index size
   * ADDED: This method was missing
   */
  getIndexSize(): number {
    return this.index.length;
  }
  
  /**
   * Get last index time
   * ADDED: This method was missing
   */
  getLastIndexTime(): Date | null {
    return this.lastIndexTime;
  }
  
  /**
   * Clear index
   */
  clear(): void {
    this.index = [];
    this.lastIndexTime = null;
  }
}