/**
 * Text processing utilities for claim evaluation
 */

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Calculate SHA-256 hash of text (for caching)
   */
  export async function hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Truncate text to specified length with ellipsis
   */
  export function truncate(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Extract sentences from text
   */
  export function extractSentences(text: string): string[] {
    // Simple sentence splitting (will be improved with NLP library)
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
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
   * Extract key terms from text (simple version)
   */
  export function extractKeyTerms(text: string): string[] {
    // Remove common stop words and extract unique terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
      'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ]);
  
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .filter((word, index, self) => self.indexOf(word) === index);
  }
  
  /**
   * Normalize whitespace in text
   */
  export function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }