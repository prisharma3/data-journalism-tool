/**
 * CORE CLAIM STRUCTURE
 * Represents a detected claim in the user's writing
 */
export interface ClaimStructure {
    id: string;
    text: string; // The actual claim text
    position: {
      from: number; // Character offset start
      to: number;   // Character offset end
      paragraphIndex: number; // Which paragraph (for tracking)
    };
    type: ClaimType;
    confidence: number; // 0-1, how confident we are this is a claim
    detectedAt: Date;
    hypothesisLinks: HypothesisLink[]; // Which hypotheses this relates to
    strongLanguage: StrongLanguageMarker[]; // Detected absolute/hedge words
    status: 'detected' | 'evaluating' | 'evaluated' | 'actioned';
  }
  
  export type ClaimType = 
    | 'causal'       // "X causes Y"
    | 'comparative'  // "X is better than Y"
    | 'predictive'   // "X will happen"
    | 'descriptive'; // "X has property Y"
  
  export interface HypothesisLink {
    hypothesisId: string;
    matchType: 'explicit' | 'semantic' | 'keyword';
    confidence: number; // 0-1
  }
  
  export interface StrongLanguageMarker {
    word: string;
    type: 'absolute' | 'hedge' | 'causal' | 'comparative';
    position: { from: number; to: number };
    intensity: number; // 0-1, how strong the word is
  }
  
  /**
   * TOULMIN ARGUMENT STRUCTURE
   * Internal representation of argument evaluation
   */
  export interface ToulminDiagram {
    claimId: string;
    claim: string;
    
    grounds: Evidence[];
    warrant: Warrant;
    
    backing: Backing[];
    qualifier: Qualifier | null;
    rebuttal: Rebuttal[];
    
    strength: ArgumentStrength;
    issues: ArgumentIssue[];
    gaps: EvidenceGap[];
    
    evaluatedAt: Date;
    
    // NEW: Decision tree fields
    recommendedAction?: 'claim-is-fine' | 'claim-needs-change' | 'claim-might-need-change';
    actionReasoning?: string;
    modificationPaths?: {
      weaken?: string;
      caveat?: string;
      reverse?: string;
    };
  }
  
  /**
   * EVIDENCE (GROUNDS)
   * Evidence found in the notebook supporting the claim
   */
  export interface Evidence {
    id: string;
    type: EvidenceType;
    sourceId: string; // Cell ID or Insight ID
    sourceType: 'cell_output' | 'insight' | 'hypothesis' | 'dataset_summary';
    content: string; // The actual evidence text
    
    // Relevance scoring
    relevanceScore: number; // 0-1, how relevant to claim
    strengthScore: number;  // 0-1, how strong is the evidence itself
    recencyScore: number;   // 0-1, how recent
    confidenceScore: number; // 0-1, statistical confidence if applicable
    
    // Context
    hypothesisTags: string[];
    extractedStatistics: ExtractedStatistic[];
    
    // For linking back to notebook
    cellQuery?: string; // Natural language query that generated this
    plotUrl?: string;   // If this evidence includes a visualization
  }
  
  export type EvidenceType = 
    | 'statistical'    // Numbers, correlations, p-values
    | 'visual'         // Charts, graphs
    | 'textual'        // Descriptive outputs
    | 'insight'        // User-tagged insights
    | 'comparative';   // Comparison results
  
  export interface ExtractedStatistic {
    type: 'mean' | 'median' | 'correlation' | 'p-value' | 'percentage' | 'count' | 'regression';
    value: number;
    unit?: string;
    confidenceInterval?: { lower: number; upper: number };
    context: string; // The sentence containing this statistic
  }
  
  /**
   * WARRANT
   * The logical link between evidence and claim
   */
  export interface Warrant {
    statement: string; // The warrant in one sentence
    type: WarrantType;
    isExplicit: boolean; // Was it stated or inferred?
    acceptanceLevel: 'widely-accepted' | 'domain-specific' | 'controversial' | 'unknown';
    needsBacking: boolean;
    confidence: number; // 0-1
  }
  
  export type WarrantType =
    | 'causal'        // "X affects Y"
    | 'statistical'   // "Correlation implies relationship"
    | 'comparative'   // "Higher value means better"
    | 'definitional'  // "By definition, X is Y"
    | 'expert'        // "Experts agree that..."
    | 'logical';      // "It follows logically that..."
  
  /**
   * BACKING
   * Additional support for the warrant
   */
  export interface Backing {
    id: string;
    type: 'domain-knowledge' | 'previous-analysis' | 'external-source' | 'hypothesis';
    content: string;
    sourceId?: string; // If from notebook
    strength: number; // 0-1
  }
  
  /**
   * QUALIFIER
   * Words/phrases that limit the claim scope
   */
  export interface Qualifier {
    detected: QualifierPhrase[]; // What qualifiers are present
    missing: QualifierSuggestion[]; // What qualifiers should be added
    appropriatenessScore: number; // 0-1, how well qualifiers match evidence strength
  }
  
  export interface QualifierPhrase {
    text: string; // "some", "many", "likely"
    position: { from: number; to: number };
    strength: 'weak' | 'moderate' | 'strong'; // How much it qualifies
  }
  
  export interface QualifierSuggestion {
    reason: string; // Why this qualifier is needed
    suggestedPhrases: string[]; // "some", "in most cases", "typically"
    importance: 'critical' | 'important' | 'suggested';
  }
  
  /**
   * REBUTTAL
   * Counter-arguments or limitations
   */
  export interface Rebuttal {
    id: string;
    type: 'counter-evidence' | 'limitation' | 'alternative-explanation' | 'confounding-variable';
    content: string;
    sourceId?: string; // If from notebook
    strength: number; // 0-1, how strong is this rebuttal
    addressed: boolean; // Has user acknowledged this in their claim?
  }
  
  /**
   * ARGUMENT STRENGTH ASSESSMENT
   */
  export type ArgumentStrength = 
    | 'strong'       // 80-100: Well-supported, appropriate qualifiers
    | 'moderate'     // 50-79: Some support, could be more nuanced
    | 'weak'         // 20-49: Limited evidence, overclaimed
    | 'unsupported'; // 0-19: No evidence found
  
  export interface ArgumentIssue {
    id: string;
    type: ArgumentIssueType;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    affectedRange?: { from: number; to: number }; // Specific text that's problematic
    explanation: string; // Detailed explanation of the issue
  }
  
  export type ArgumentIssueType =
    | 'no-evidence'           // No grounds found
    | 'weak-evidence'         // Evidence exists but not strong enough
    | 'overclaim'             // Claim too strong for evidence
    | 'missing-qualifier'     // Needs "some", "many", etc.
    | 'unaddressed-rebuttal'  // Counter-argument exists but not acknowledged
    | 'weak-warrant'          // Logical link is questionable
    | 'causation-correlation' // Claiming causation from correlation
    | 'missing-hypothesis'    // Claim not linked to research question
    | 'contradictory';        // Evidence suggests opposite
  
  /**
   * EVIDENCE GAPS
   * What's missing to support the claim
   */
  export interface EvidenceGap {
    id: string;
    type: 'missing-variable' | 'missing-relationship' | 'confounding-variable' | 'temporal-issue' | 'fundamentally-unsupportable';
    description: string;
    missingConcepts: string[];
    importance: 'critical' | 'important' | 'optional';
    suggestedAnalysis?: string;
    suggestedQuery?: string | null; // NEW: Specific query or null if unsupportable
  }
  
  export type GapType =
    | 'missing-variable'      // Variable mentioned but never analyzed
    | 'missing-relationship'  // Relationship claimed but not tested
    | 'missing-subgroup'      // Specific group claimed but not filtered
    | 'temporal-mismatch'     // Claiming current but data is old
    | 'insufficient-sample'   // Too little data for claim
    | 'wrong-analysis-type';  // Need different analysis (e.g., regression vs correlation)
  
  /**
   * ANALYSIS SUGGESTION
   * Suggested analysis to fill evidence gap
   */
  export interface AnalysisSuggestion {
    id: string;
    title: string; // Short description
    naturalLanguageQuery: string; // What to ask the code generator
    explanation: string; // Why this analysis is needed
    expectedOutput: string; // What kind of results to expect
    priority: 'high' | 'medium' | 'low';
    estimatedComplexity: 'simple' | 'moderate' | 'complex';
    
    // For preview
    codePreview?: string; // Generated Python code preview
    relatedCells?: string[]; // Similar analyses already done
  }
  
  /**
   * WRITING SUGGESTIONS
   * Actionable feedback for the user
   */
  export interface WritingSuggestion {
    id: string;
    claimId: string;
    type: SuggestionType;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    explanation?: string;
    position: { from: number; to: number; paragraphIndex: number };
    actions: SuggestionAction[];
    priority: number;
    createdAt: Date;
    status: 'active' | 'dismissed' | 'accepted';
    
    // NEW: Metadata for analysis and removal suggestions
    metadata?: {
      suggestedQuery?: string;
      missingConcepts?: string[];
      gapType?: string;
      reason?: string;
    };
  }
  
  export type SuggestionType =
  | 'weaken-claim'
  | 'add-caveat'
  | 'add-qualifier'
  | 'remove-claim'
  | 'reverse-claim'
  | 'add-analysis'
  | 'cite-evidence'
  | 'acknowledge-limitation'
  | 'grammar'
  | 'relevance';
  
  export interface SuggestionAction {
    id: string;
    type: ActionType;
    label: string; // Button text
    description: string;
    
    // For text replacement actions
    replacementText?: string;
    
    // For analysis insertion actions
    analysisSuggestion?: AnalysisSuggestion;
    
    // For navigation actions
    targetCellId?: string;
  }
  
  export type ActionType =
    | 'replace-text'      // Replace claim with suggested text
    | 'insert-analysis'   // Add suggested analysis to notebook
    | 'view-evidence'     // Open focused view of relevant analyses
    | 'view-explanation'  // Show detailed explanation
    | 'dismiss';          // Ignore this suggestion
  
  /**
   * REMEMBRANCE AGENT RESULTS
   * Relevant analyses found for current writing context
   */
  export interface RelevantAnalysis {
    cellId: string;
    insightId?: string;
    type: 'analysis' | 'insight' | 'hypothesis';
    
    content: string; // The relevant text
    snippet: string; // Shortened version for display
    
    // Scoring
    relevanceScore: number; // 0-1, semantic similarity
    hypothesisAlignment: number; // 0-1, matches current hypothesis
    recencyScore: number; // 0-1, how recent
    overallScore: number; // 0-1, weighted combination
    
    // Context
    hypothesisTags: string[];
    query?: string; // Natural language query that generated this
    
    // For display
    highlightedTerms?: string[]; // Terms that match context
  }
  
  /**
   * WRITING CONTEXT
   * Current state of what user is writing about
   */
  export interface WritingContext {
    currentParagraph: string;
    currentSection: string;
    recentWords: string[]; // Last 100-200 words
    activeClaims: string[]; // Claim IDs in current context
    dominantConcepts: string[]; // Main topics being discussed
    activeHypothesis?: string; // Which hypothesis they're writing about
    embedding?: number[]; // Vector representation of context
    updatedAt: Date;
  }
  
  /**
   * CLAIM EVALUATION REQUEST
   * What gets sent to evaluation API
   */
  export interface ClaimEvaluationRequest {
    claim: ClaimStructure;
    notebookContext: {
      projectId: string;
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
        tagId: string;
        hypothesisTags?: string[];
      }>;
      hypotheses: Array<{
        id: string;
        content: string;
      }>;
      dataset?: {
        filename: string;
        summary?: any;
      };
    };
  }
  
  /**
   * CLAIM EVALUATION RESPONSE
   * What comes back from evaluation API
   */
  export interface ClaimEvaluationResponse {
    claimId: string;
    toulminDiagram: ToulminDiagram;
    suggestions: WritingSuggestion[];
    analysisGaps: EvidenceGap[];
    processingTime: number; // milliseconds
  }
  
  /**
   * USER ACTION TRACKING
   * Track how users respond to suggestions
   */
  export interface UserAction {
    id: string;
    userId: string;
    projectId: string;
    suggestionId: string;
    actionType: 'accepted' | 'dismissed' | 'modified';
    timestamp: Date;
    
    // For learning
    suggestionType: SuggestionType;
    suggestionSeverity: 'error' | 'warning' | 'info';
    timeToAction: number; // seconds from suggestion to action
  }