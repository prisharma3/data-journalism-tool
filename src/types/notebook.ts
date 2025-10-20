/**
 * NOTEBOOK TYPE DEFINITIONS
 * Complete type definitions for the computational notebook system
 * Includes support for claim evaluation and semantic search
 */

import { ExtractedStatistic } from './writing';

/**
 * CODE CELL TYPE
 * Represents a single code cell in the notebook
 */
export interface CodeCellType {
  id: string;
  type: 'dataset' | 'hypothesis' | 'analysis';
  
  // Code content
  query: string; // Natural language query from user
  content: string; // Generated Python code
  
  // Execution state
  isGenerating: boolean;
  isExecuting: boolean;
  executionCount: number;
  error?: string;
  
  // Output
  output?: {
    text: string;
    plot?: string; // Base64 or URL to plot image
    executionTime?: number;
    timestamp?: Date;
  };
  
  // Hypothesis linking
  hypothesisTags?: string[]; // Array of hypothesis IDs this cell relates to
  
  // For claim evaluation (NEW)
  embedding?: number[]; // 768-dimensional vector for semantic search
  extractedStatistics?: ExtractedStatistic[]; // Parsed statistics from output
  lastIndexed?: Date; // When this was last indexed for search
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DATASET
 * Information about uploaded dataset
 */
export interface Dataset {
  filename: string;
  data: string; // CSV or other format as string
  summary?: DatasetSummary;
  hypothesisTags?: string[]; // Which hypotheses use this dataset
  uploadedAt?: Date;
}

export interface DatasetSummary {
  rows: number;
  columns: number;
  columnNames: string[];
  columnTypes: Record<string, string>; // { columnName: type }
  missingValues?: Record<string, number>; // { columnName: count }
  sampleData?: any[]; // First few rows
  description?: string; // AI-generated summary
}

/**
 * HYPOTHESIS
 * Research questions/hypotheses for the analysis
 */
export interface Hypothesis {
  id: string;
  content: string; // The hypothesis text
  order: number; // H1, H2, H3, etc.
  color?: string; // Display color
  
  // For claim evaluation (NEW)
  embedding?: number[]; // Vector representation
  linkedClaims?: string[]; // Claim IDs that reference this hypothesis
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * INSIGHT
 * User-created insights from analysis results
 */
export interface Insight {
  id: string;
  cellId: string; // Which cell this insight is attached to
  content: string; // The insight text
  tagId: string; // Tag for categorization
  hypothesisTags?: string[]; // Which hypotheses this insight relates to
  plotThumbnail?: string; // Associated plot image
  
  // For claim evaluation (NEW)
  embedding?: number[]; // 768-dimensional vector for semantic search
  relevanceScores?: Record<string, number>; // Cached relevance scores for different contexts
  linkedClaims?: string[]; // Claim IDs that reference this insight
  lastIndexed?: Date; // When this was last indexed for search
  
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * TAG
 * Categorization tags for insights
 */
export interface Tag {
  id: string;
  name: string;
  color: string; // Hex color code
  description?: string;
  usageCount?: number; // How many insights use this tag
}

/**
 * NOTEBOOK STATE
 * Complete state of the notebook
 */
export interface NotebookState {
  // Core content
  cells: CodeCellType[];
  selectedCellId?: string;
  
  // Execution state
  isExecutingAll: boolean;
  executionCounter: number;
  
  // Data and context
  dataset: Dataset | null;
  hypotheses: Hypothesis[];
  insights: Insight[];
  tags: Tag[];
  
  // For claim evaluation (NEW)
  isIndexing?: boolean; // Whether we're currently building search index
  lastIndexedAt?: Date; // When notebook was last indexed
  indexedCellCount?: number; // How many cells are indexed
  indexedInsightCount?: number; // How many insights are indexed
}

/**
 * MINIMAP SECTION
 * Visual representation for minimap navigation
 */
export interface MinimapSection {
  id: string;
  type: 'dataset' | 'hypothesis' | 'analysis' | 'insight';
  title: string;
  color: string;
  position: number; // Pixel position in notebook
  height: number; // Height in pixels
  hypothesisId?: string; // If this section belongs to a hypothesis
}

/**
 * CELL EXECUTION RESULT
 * Result from executing Python code
 */
export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  plot?: string;
  executionTime: number;
  timestamp: Date;
  
  // For claim evaluation (NEW)
  extractedStatistics?: ExtractedStatistic[]; // Parsed from output
}

/**
 * CODE GENERATION REQUEST
 * Request to generate Python code from natural language
 */
export interface CodeGenerationRequest {
  query: string;
  datasetInfo?: DatasetSummary;
  hypothesisContext?: string;
  existingCode?: string[]; // Previous code cells for context
}

/**
 * CODE GENERATION RESPONSE
 * Response from code generation API
 */
export interface CodeGenerationResponse {
  code: string;
  explanation?: string;
  estimatedExecutionTime?: number;
  requiredLibraries?: string[];
}

/**
 * NOTEBOOK ANALYTICS
 * Statistics about the notebook
 */
export interface NotebookAnalytics {
  totalCells: number;
  cellsByType: Record<string, number>;
  totalExecutions: number;
  averageExecutionTime: number;
  totalInsights: number;
  insightsByTag: Record<string, number>;
  hypothesisCount: number;
  
  // For claim evaluation (NEW)
  totalEmbeddings: number;
  indexCoverage: number; // Percentage of content indexed (0-100)
  lastEvaluationTime?: Date;
}

/**
 * NOTEBOOK EXPORT OPTIONS
 * Configuration for exporting notebook
 */
export interface NotebookExportOptions {
  format: 'pdf' | 'html' | 'ipynb' | 'markdown';
  includeCode: boolean;
  includeOutputs: boolean;
  includeInsights: boolean;
  includePlots: boolean;
  hypothesisFilter?: string[]; // Export only specific hypotheses
}

/**
 * CELL MOVE DIRECTION
 * Direction to move a cell
 */
export type CellMoveDirection = 'up' | 'down';

/**
 * CELL INSERT POSITION
 * Where to insert a new cell
 */
export type CellInsertPosition = 'above' | 'below' | 'end';

/**
 * NOTEBOOK ERROR
 * Error that occurred in notebook operations
 */
export interface NotebookError {
  type: 'execution' | 'generation' | 'indexing' | 'embedding' | 'general';
  message: string;
  cellId?: string;
  timestamp: Date;
  stack?: string;
}

/**
 * CELL FILTER OPTIONS
 * Options for filtering cells in the notebook
 */
export interface CellFilterOptions {
  hypothesisIds?: string[]; // Filter by hypothesis tags
  type?: ('dataset' | 'hypothesis' | 'analysis')[]; // Filter by cell type
  hasOutput?: boolean; // Only cells with output
  hasInsights?: boolean; // Only cells with insights
  searchQuery?: string; // Text search in query or output
}

/**
 * INSIGHT FILTER OPTIONS
 * Options for filtering insights
 */
export interface InsightFilterOptions {
  hypothesisIds?: string[]; // Filter by hypothesis tags
  tagIds?: string[]; // Filter by tags
  cellIds?: string[]; // Filter by associated cells
  searchQuery?: string; // Text search in content
  hasPlot?: boolean; // Only insights with plots
}

/**
 * NOTEBOOK CONTEXT FOR CLAIM EVALUATION
 * Subset of notebook data sent to claim evaluation API
 */
export interface NotebookContextForEvaluation {
  projectId: string;
  
  cells: Array<{
    id: string;
    query: string;
    output?: {
      text: string;
      plot?: string;
    };
    hypothesisTags?: string[];
    extractedStatistics?: ExtractedStatistic[];
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
    summary?: DatasetSummary;
  };
}

/**
 * INDEXING STATUS
 * Status of the semantic search indexing process
 */
export interface IndexingStatus {
  isIndexing: boolean;
  progress: number; // 0-100
  itemsProcessed: number;
  itemsTotal: number;
  currentItem?: string; // ID of item being processed
  estimatedTimeRemaining?: number; // seconds
  errors: string[];
}

/**
 * SEARCH INDEX ENTRY
 * Single entry in the semantic search index
 */
export interface SearchIndexEntry {
  id: string;
  type: 'cell' | 'insight' | 'hypothesis';
  content: string;
  embedding: number[];
  metadata: {
    cellId?: string;
    hypothesisTags?: string[];
    timestamp: Date;
  };
}

/**
 * NOTEBOOK VALIDATION RESULT
 * Result of validating notebook structure
 */
export interface NotebookValidationResult {
  isValid: boolean;
  errors: Array<{
    type: 'missing_dataset' | 'missing_hypothesis' | 'orphan_cell' | 'invalid_tag' | 'broken_link';
    message: string;
    cellId?: string;
    insightId?: string;
  }>;
  warnings: Array<{
    type: 'untagged_cell' | 'no_insights' | 'long_execution_time' | 'unused_hypothesis';
    message: string;
    cellId?: string;
  }>;
}

/**
 * UTILITY TYPE: Partial Notebook State
 * For updates that only modify part of the state
 */
export type PartialNotebookState = Partial<NotebookState>;

/**
 * UTILITY TYPE: Cell Update
 * For updating specific fields of a cell
 */
export type CellUpdate = Partial<Omit<CodeCellType, 'id' | 'createdAt'>>;

/**
 * UTILITY TYPE: Insight Update
 * For updating specific fields of an insight
 */
export type InsightUpdate = Partial<Omit<Insight, 'id' | 'createdAt'>>;

/**
 * Helper function types for notebook operations
 */
export type AddCellFunction = (id?: string, position?: CellInsertPosition) => void;
export type DeleteCellFunction = (id: string) => void;
export type UpdateCellFunction = (id: string, updates: CellUpdate) => void;
export type MoveCellFunction = (id: string, direction: CellMoveDirection) => void;
export type ExecuteCellFunction = (id: string) => Promise<void>;
export type GenerateCodeFunction = (cellId: string, query: string) => Promise<void>;

export type AddInsightFunction = (cellId: string, content: string, tagId: string, hypothesisTags?: string[]) => void;
export type DeleteInsightFunction = (insightId: string) => void;
export type UpdateInsightFunction = (insightId: string, content: string, tagId: string, hypothesisTags?: string[]) => void;

export type AddTagFunction = (name: string, color: string) => string;
export type DeleteTagFunction = (tagId: string) => void;

export type AddHypothesisFunction = (content: string) => void;
export type UpdateHypothesisFunction = (id: string, content: string) => void;
export type DeleteHypothesisFunction = (id: string) => void;

/**
 * NOTEBOOK HOOKS RETURN TYPE
 * Type for custom React hooks that manage notebook state
 */
export interface NotebookHookReturn {
  // State
  notebookState: NotebookState;
  
  // Cell operations
  addCell: AddCellFunction;
  deleteCell: DeleteCellFunction;
  updateCell: UpdateCellFunction;
  moveCell: MoveCellFunction;
  executeCell: ExecuteCellFunction;
  generateCode: GenerateCodeFunction;
  
  // Insight operations
  addInsight: AddInsightFunction;
  deleteInsight: DeleteInsightFunction;
  updateInsight: UpdateInsightFunction;
  
  // Tag operations
  addTag: AddTagFunction;
  deleteTag: DeleteTagFunction;
  
  // Hypothesis operations
  addHypothesis: AddHypothesisFunction;
  updateHypothesis: UpdateHypothesisFunction;
  deleteHypothesis: DeleteHypothesisFunction;
  
  // Dataset operations
  uploadDataset: (filename: string, data: string, summary?: DatasetSummary) => void;
  removeDataset: () => void;
  
  // Utility operations
  executeAll: () => Promise<void>;
  clearAllOutputs: () => void;
  validateNotebook: () => NotebookValidationResult;
  
  // Indexing operations (NEW)
  rebuildIndex: () => Promise<void>;
  getIndexingStatus: () => IndexingStatus;
}