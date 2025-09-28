// User and Authentication Types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
  }
  
  // Project Types
  export interface Project {
    id: string;
    name: string;
    description?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // Dataset Types
  export interface Dataset {
    id: string;
    projectId: string;
    fileName: string;
    fileSize: number;
    columns: string[];
    rowCount: number;
    filePath: string;
    aiSummary?: string;
    uploadedAt: string;
  }
  
  // Hypothesis Types
  export interface Hypothesis {
    id: string;
    projectId: string;
    content: string;
    position: number;
    createdAt: string;
    updatedAt: string;
  }
  
  // Analysis Types
  export interface Analysis {
    id: string;
    projectId: string;
    hypothesisId: string;
    query: string;
    code: string;
    explanation?: string;
    position: number;
    createdAt: string;
    updatedAt: string;
  }
  
  // Output Types
  export interface AnalysisOutput {
    id: string;
    analysisId: string;
    textOutput?: string;
    plotImage?: string;
    errorMessage?: string;
    executionTime: number;
    createdAt: string;
  }
  
  // Tag Types
  export interface Tag {
    id: string;
    projectId: string;
    name: string;
    color: string;
    createdAt: string;
  }
  
  // Insight Types
  export interface Insight {
    id: string;
    projectId: string;
    analysisOutputId: string;
    tagId: string;
    content: string;
    position: number;
    createdAt: string;
    updatedAt: string;
  }
  
  // Writing Types
  export interface WritingContent {
    id: string;
    projectId: string;
    content: string;
    wordCount: number;
    lastSaved: string;
    createdAt: string;
    updatedAt: string;
  }
  
  // AI Writing Suggestion Types
  export interface WritingSuggestion {
    id: string;
    projectId: string;
    textPosition: number;
    suggestionType: 'tone' | 'clarity' | 'relevant-analysis' | 'alternative';
    suggestionText: string;
    suggestionData?: any;
    isResolved: boolean;
    createdAt: string;
  }
  
  // Notebook State Types
  export interface NotebookState {
    currentSection: 'dataset' | 'hypothesis' | 'analysis' | 'insights';
    isAutoSaving: boolean;
    lastSaved?: string;
  }
  
  // Minimap Types
  export interface MinimapSection {
    id: string;
    type: 'dataset' | 'hypothesis' | 'analysis' | 'output' | 'insight';
    title: string;
    color: string;
    position: number;
    isActive: boolean;
  }
  
  // Export Types
  export interface ExportHistory {
    id: string;
    projectId: string;
    exportType: 'pdf' | 'docx' | 'html' | 'txt';
    filePath: string;
    createdAt: string;
  }
  
  // API Response Types
  export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  }