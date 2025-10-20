/**
 * CONTEXT MONITOR SERVICE
 * Tracks what user is currently writing about
 */

import { WritingContext } from '@/types/writing';
import { extractKeyTerms } from '@/lib/utils/text';

export class ContextMonitor {
  private currentContext: WritingContext | null = null;
  
  /**
   * Update context based on current writing
   */
  updateContext(
    text: string,
    cursorPosition: number,
    activeHypothesis?: string
  ): WritingContext {
    // Extract current paragraph (text around cursor)
    const currentParagraph = this.extractCurrentParagraph(text, cursorPosition);
    
    // Extract recent words (last 100-200 words)
    const recentWords = this.extractRecentWords(text, cursorPosition, 200);
    
    // Extract dominant concepts
    const dominantConcepts = extractKeyTerms(currentParagraph);
    
    // Get active claims (would need claim IDs from detection)
    const activeClaims: string[] = [];
    
    this.currentContext = {
      currentParagraph,
      currentSection: this.extractCurrentSection(text, cursorPosition),
      recentWords,
      activeClaims,
      dominantConcepts,
      activeHypothesis,
      updatedAt: new Date(),
    };
    
    return this.currentContext;
  }
  
  /**
   * Get current context
   */
  getCurrentContext(): WritingContext | null {
    return this.currentContext;
  }
  
  /**
   * Extract paragraph around cursor
   */
  private extractCurrentParagraph(text: string, cursorPosition: number): string {
    // Find paragraph boundaries (double newlines or single newline with significant spacing)
    const before = text.substring(0, cursorPosition);
    const after = text.substring(cursorPosition);
    
    // Find start of paragraph (last double newline before cursor)
    const paragraphStart = Math.max(
      before.lastIndexOf('\n\n'),
      0
    );
    
    // Find end of paragraph (next double newline after cursor)
    const afterNewline = after.indexOf('\n\n');
    const paragraphEnd = afterNewline === -1 
      ? text.length 
      : cursorPosition + afterNewline;
    
    return text.substring(paragraphStart, paragraphEnd).trim();
  }
  
  /**
   * Extract current section (heading or context)
   */
  private extractCurrentSection(text: string, cursorPosition: number): string {
    // Look backwards for headings (lines starting with # or all caps)
    const before = text.substring(0, cursorPosition);
    const lines = before.split('\n');
    
    // Find last heading
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('#') || (line === line.toUpperCase() && line.length > 0)) {
        return line.replace(/^#+\s*/, '');
      }
    }
    
    return 'Introduction'; // Default section
  }
  
  /**
   * Extract recent words around cursor
   */
  private extractRecentWords(text: string, cursorPosition: number, wordCount: number): string[] {
    const before = text.substring(0, cursorPosition);
    const words = before.split(/\s+/).filter(w => w.length > 0);
    
    // Return last N words
    return words.slice(-wordCount);
  }
  
  /**
   * Check if context has changed significantly
   */
  hasContextChanged(newContext: WritingContext): boolean {
    if (!this.currentContext) return true;
    
    // Check if dominant concepts changed
    const oldConcepts = new Set(this.currentContext.dominantConcepts);
    const newConcepts = new Set(newContext.dominantConcepts);
    
    // Calculate overlap
    const intersection = new Set([...oldConcepts].filter(x => newConcepts.has(x)));
    const overlap = intersection.size / Math.max(oldConcepts.size, newConcepts.size);
    
    // If less than 50% overlap, context has changed
    return overlap < 0.5;
  }
}