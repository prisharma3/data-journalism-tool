/**
 * TOULMIN EVALUATOR SERVICE
 * Orchestrates complete Toulmin argument evaluation
 */

import { ToulminDiagram, ClaimStructure, ArgumentStrength, ArgumentIssue, EvidenceGap } from '@/types/writing';
import { EvidenceRetrieval } from './evidenceRetrieval';
import { WarrantIdentifier } from './warrantIdentifier';
import { generateId } from '@/lib/utils/text';

interface NotebookContext {
  projectId: string;
  cells: any[];
  insights: any[];
  hypotheses: any[];
  dataset?: any;
}

export class ToulminEvaluator {
  private evidenceRetrieval: EvidenceRetrieval;
  private warrantIdentifier: WarrantIdentifier;
  
  constructor() {
    this.evidenceRetrieval = new EvidenceRetrieval();
    this.warrantIdentifier = new WarrantIdentifier();
  }
  
  /**
   * Evaluate a claim using Toulmin framework
   */
  evaluate(claim: ClaimStructure, notebookContext: NotebookContext): ToulminDiagram {
    // Step 1: Find evidence (grounds)
    const grounds = this.evidenceRetrieval.findEvidence(
      claim.text,
      notebookContext
    );
    
    // Step 2: Identify warrant
    const warrant = this.warrantIdentifier.identifyWarrant(
      claim.text,
      claim.type,
      grounds
    );
    
    // Step 3: Determine backing (simplified for now)
    const backing: any[] = [];
    
    // Step 4: Check for qualifiers
    const qualifier = this.analyzeQualifiers(claim.text, grounds);
    
    // Step 5: Identify potential rebuttals
    const rebuttal: any[] = [];
    
    // Step 6: Assess overall strength
    const { strength, overallScore } = this.assessStrength(grounds, warrant, qualifier);
    
    // Step 7: Identify issues
    const issues = this.identifyIssues(claim, grounds, warrant, qualifier);
    
    // Step 8: Find gaps
    const gaps = this.findGaps(claim, grounds, notebookContext);
    
    return {
      claimId: claim.id,
      claim: claim.text,
      grounds,
      warrant,
      backing,
      qualifier,
      rebuttal,
      strength,
      overallScore,
      issues,
      gaps,
      evaluatedAt: new Date(),
    };
  }
  
  /**
   * Analyze qualifiers in claim
   */
  private analyzeQualifiers(claimText: string, grounds: any[]) {
    const lower = claimText.toLowerCase();
    
    // Detect existing qualifiers
    const qualifierWords = ['some', 'many', 'most', 'often', 'typically', 'generally', 'likely', 'probably', 'might', 'could'];
    const absoluteWords = ['all', 'always', 'never', 'none', 'definitely', 'certainly', 'proves'];
    
    const detected = [];
    const missing = [];
    
    // Check for qualifiers
    for (const word of qualifierWords) {
      if (lower.includes(word)) {
        detected.push({
          text: word,
          position: { from: lower.indexOf(word), to: lower.indexOf(word) + word.length },
          strength: 'moderate' as const,
        });
      }
    }
    
    // Check for absolute language
    const hasAbsolute = absoluteWords.some(word => lower.includes(word));
    
    // Determine appropriateness
    const evidenceStrength = grounds.length > 0 
      ? grounds.reduce((sum, e) => sum + e.strengthScore, 0) / grounds.length 
      : 0;
    
    let appropriatenessScore = 0.5;
    
    if (hasAbsolute && evidenceStrength < 0.7) {
      // Absolute language but weak evidence - needs qualifiers
      appropriatenessScore = 0.2;
      missing.push({
        reason: 'Claim uses absolute language but evidence is not strong enough',
        suggestedPhrases: ['some', 'many', 'often', 'typically'],
        importance: 'critical' as const,
      });
    } else if (detected.length > 0 && evidenceStrength > 0.8) {
      // Has qualifiers with strong evidence - appropriate
      appropriatenessScore = 0.9;
    } else if (detected.length === 0 && evidenceStrength < 0.6) {
      // No qualifiers with weak evidence - needs qualifiers
      appropriatenessScore = 0.3;
      missing.push({
        reason: 'Evidence is limited, claim should be more qualified',
        suggestedPhrases: ['suggests', 'indicates', 'some', 'may'],
        importance: 'important' as const,
      });
    }
    
    return detected.length > 0 || missing.length > 0 ? {
      detected,
      missing,
      appropriatenessScore,
    } : null;
  }
  
  /**
   * Assess overall argument strength
   */
  private assessStrength(grounds: any[], warrant: any, qualifier: any): { 
    strength: ArgumentStrength; 
    overallScore: number;
  } {
    let score = 0;
    
    // Evidence quality (40% of score)
    if (grounds.length === 0) {
      score += 0;
    } else if (grounds.length < 2) {
      score += 15;
    } else if (grounds.length < 4) {
      score += 25;
    } else {
      score += 40;
    }
    
    // Warrant strength (30% of score)
    score += warrant.confidence * 30;
    
    // Qualifier appropriateness (30% of score)
    if (qualifier) {
      score += qualifier.appropriatenessScore * 30;
    } else {
      score += 15; // Neutral if no qualifier analysis
    }
    
    // Determine strength category
    let strength: ArgumentStrength;
    if (score >= 80) strength = 'strong';
    else if (score >= 50) strength = 'moderate';
    else if (score >= 20) strength = 'weak';
    else strength = 'unsupported';
    
    return { strength, overallScore: Math.round(score) };
  }
  
  /**
   * Identify issues with the argument
   */
  private identifyIssues(claim: any, grounds: any[], warrant: any, qualifier: any): ArgumentIssue[] {
    const issues: ArgumentIssue[] = [];
    
    // No evidence
    if (grounds.length === 0) {
      issues.push({
        id: generateId('issue'),
        type: 'no-evidence',
        severity: 'critical',
        message: 'No evidence found to support this claim',
        explanation: 'This claim is not supported by any analysis in your notebook. Consider doing relevant analysis or removing this claim.',
      });
    }
    
    // Weak evidence
    else if (grounds.length < 2) {
      issues.push({
        id: generateId('issue'),
        type: 'weak-evidence',
        severity: 'warning',
        message: 'Limited evidence for this claim',
        explanation: 'Only one piece of supporting evidence was found. Consider adding more analysis to strengthen this claim.',
      });
    }
    
    // Missing qualifiers
    if (qualifier && qualifier.missing.length > 0) {
      issues.push({
        id: generateId('issue'),
        type: 'missing-qualifier',
        severity: qualifier.missing[0].importance === 'critical' ? 'critical' : 'warning',
        message: 'Claim needs qualifying language',
        explanation: qualifier.missing[0].reason,
      });
    }
    
    // Check for causation vs correlation
    if (claim.type === 'causal' && warrant.type === 'statistical') {
      const hasRegression = grounds.some(e => 
        e.extractedStatistics.some((s: any) => s.type === 'regression')
      );
      
      if (!hasRegression) {
        issues.push({
          id: generateId('issue'),
          type: 'causation-correlation',
          severity: 'warning',
          message: 'Causal claim based on correlation',
          explanation: 'This claim suggests causation but evidence shows correlation. Consider using language like "is associated with" instead of "causes".',
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Find evidence gaps
   */
  private findGaps(claim: any, grounds: any[], notebookContext: any): EvidenceGap[] {
    const gaps: EvidenceGap[] = [];
    
    // If no evidence, everything is a gap
    if (grounds.length === 0) {
      gaps.push({
        id: generateId('gap'),
        type: 'missing-variable',
        description: 'No analysis found related to this claim',
        missingConcepts: [claim.text],
        importance: 'critical',
      });
    }
    
    return gaps;
  }
}