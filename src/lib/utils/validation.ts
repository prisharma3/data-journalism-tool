/**
 * Validation utilities for claim evaluation system
 */

import { ClaimStructure, ToulminDiagram } from '@/types/writing';

/**
 * Validate claim structure
 */
export function validateClaim(claim: any): claim is ClaimStructure {
  if (!claim || typeof claim !== 'object') return false;
  if (typeof claim.id !== 'string') return false;
  if (typeof claim.text !== 'string' || claim.text.length === 0) return false;
  if (!claim.position || typeof claim.position !== 'object') return false;
  if (typeof claim.position.from !== 'number') return false;
  if (typeof claim.position.to !== 'number') return false;
  if (!['causal', 'comparative', 'predictive', 'descriptive'].includes(claim.type)) return false;
  return true;
}

/**
 * Validate embedding vector
 */
export function validateEmbedding(embedding: any): embedding is number[] {
  if (!Array.isArray(embedding)) return false;
  if (embedding.length !== 768) return false; // Gemini embeddings are 768-dimensional
  return embedding.every(val => typeof val === 'number' && !isNaN(val));
}

/**
 * Validate project ID format (UUID)
 */
export function validateProjectId(projectId: any): projectId is string {
  if (typeof projectId !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(projectId);
}

/**
 * Sanitize text input
 */
export function sanitizeText(text: string): string {
  // Remove potentially harmful characters
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/\x00/g, '') // Remove null bytes
    .trim();
}

/**
 * Validate score range (0-1)
 */
export function validateScore(score: any): score is number {
  return typeof score === 'number' && score >= 0 && score <= 1 && !isNaN(score);
}