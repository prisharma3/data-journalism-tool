import { create } from 'zustand';
import { Project, Dataset, Hypothesis, Analysis, Insight, Tag, WritingContent } from '@/types';

interface ProjectStore {
  // Current project data
  currentProject: Project | null;
  datasets: Dataset[];
  hypotheses: Hypothesis[];
  analyses: Analysis[];
  insights: Insight[];
  tags: Tag[];
  writingContent: WritingContent | null;
  articleContent: string; 

  
  // Notebook state (moved from NotebookCanvas local state)
  cells: any[];
  dataset: any | null;
  selectedCellId?: string;
  isExecutingAll: boolean;
  executionCounter: number;
  
  // Active context for writing
  activeHypothesisId: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Project actions
  setCurrentProject: (project: Project | null) => void;
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (datasetId: string) => void;
  
  setHypotheses: (hypotheses: Hypothesis[]) => void;
  addHypothesis: (hypothesis: Hypothesis) => void;
  updateHypothesis: (hypothesisId: string, updates: Partial<Hypothesis>) => void;
  removeHypothesis: (hypothesisId: string) => void;
  
  setAnalyses: (analyses: Analysis[]) => void;
  addAnalysis: (analysis: Analysis) => void;
  updateAnalysis: (analysisId: string, updates: Partial<Analysis>) => void;
  removeAnalysis: (analysisId: string) => void;
  
  setInsights: (insights: Insight[]) => void;
  addInsight: (insight: Insight) => void;
  updateInsight: (insightId: string, updates: Partial<Insight>) => void;
  removeInsight: (insightId: string) => void;
  
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  removeTag: (tagId: string) => void;
  
  setWritingContent: (content: WritingContent | null) => void;
  updateWritingContent: (updates: Partial<WritingContent>) => void;
  setArticleContent: (content: string) => void; 
  
  // Notebook cell actions
  setCells: (cells: any[]) => void;
  addCell: (cell: any) => void;
  updateCell: (cellId: string, updates: any) => void;
  removeCell: (cellId: string) => void;
  setSelectedCell: (cellId: string | undefined) => void;
  
  // Dataset action
  setDataset: (dataset: any | null) => void;
  
  // Execution state
  setIsExecutingAll: (isExecuting: boolean) => void;
  incrementExecutionCounter: () => void;
  
  // Active hypothesis
  setActiveHypothesis: (hypothesisId: string | null) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProject: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial state
  currentProject: null,
  datasets: [],
  hypotheses: [],
  analyses: [],
  insights: [],
  tags: [],
  writingContent: null,
  articleContent: '',
  isLoading: false,
  error: null,
  
  // Notebook state
  cells: [],
  dataset: null,
  selectedCellId: undefined,
  isExecutingAll: false,
  executionCounter: 0,
  
  // Active context
  activeHypothesisId: null,



  // Project actions
  setCurrentProject: (project) => set({ currentProject: project }),
  
  setDatasets: (datasets) => set({ datasets }),
  addDataset: (dataset) => set((state) => ({ 
    datasets: [...state.datasets, dataset] 
  })),
  removeDataset: (datasetId) => set((state) => ({ 
    datasets: state.datasets.filter(d => d.id !== datasetId) 
  })),
  
  setHypotheses: (hypotheses) => set({ hypotheses }),
  addHypothesis: (hypothesis) => set((state) => ({ 
    hypotheses: [...state.hypotheses, hypothesis] 
  })),
  updateHypothesis: (hypothesisId, updates) => set((state) => ({
    hypotheses: state.hypotheses.map(h => 
      h.id === hypothesisId ? { ...h, ...updates } : h
    )
  })),
  removeHypothesis: (hypothesisId) => set((state) => ({ 
    hypotheses: state.hypotheses.filter(h => h.id !== hypothesisId) 
  })),
  
  setAnalyses: (analyses) => set({ analyses }),
  addAnalysis: (analysis) => set((state) => ({ 
    analyses: [...state.analyses, analysis] 
  })),
  updateAnalysis: (analysisId, updates) => set((state) => ({
    analyses: state.analyses.map(a => 
      a.id === analysisId ? { ...a, ...updates } : a
    )
  })),
  removeAnalysis: (analysisId) => set((state) => ({ 
    analyses: state.analyses.filter(a => a.id !== analysisId) 
  })),
  
  setInsights: (insights) => set({ insights }),
  addInsight: (insight) => set((state) => ({ 
    insights: [...state.insights, insight] 
  })),
  updateInsight: (insightId, updates) => set((state) => ({
    insights: state.insights.map(i => 
      i.id === insightId ? { ...i, ...updates } : i
    )
  })),
  removeInsight: (insightId) => set((state) => ({ 
    insights: state.insights.filter(i => i.id !== insightId) 
  })),
  
  setTags: (tags) => set({ tags }),
  addTag: (tag) => set((state) => ({ 
    tags: [...state.tags, tag] 
  })),
  updateTag: (tagId, updates) => set((state) => ({
    tags: state.tags.map(t => 
      t.id === tagId ? { ...t, ...updates } : t
    )
  })),
  removeTag: (tagId) => set((state) => ({ 
    tags: state.tags.filter(t => t.id !== tagId) 
  })),
  
  setWritingContent: (content) => set({ writingContent: content }),
  updateWritingContent: (updates) => set((state) => ({
    writingContent: state.writingContent 
      ? { ...state.writingContent, ...updates }
      : null
  })),
  
  // Notebook cell actions
  setCells: (cells) => set({ cells }),
  addCell: (cell) => set((state) => ({ 
    cells: [...state.cells, cell] 
  })),
  updateCell: (cellId, updates) => set((state) => ({
    cells: state.cells.map(c => 
      c.id === cellId ? { ...c, ...updates } : c
    )
  })),
  removeCell: (cellId) => set((state) => ({ 
    cells: state.cells.filter(c => c.id !== cellId) 
  })),
  setSelectedCell: (cellId) => set({ selectedCellId: cellId }),
  
  // Dataset action
  setDataset: (dataset) => set({ dataset }),
  
  // Execution state
  setIsExecutingAll: (isExecuting) => set({ isExecutingAll: isExecuting }),
  incrementExecutionCounter: () => set((state) => ({ 
    executionCounter: state.executionCounter + 1 
  })),
  
  // Active hypothesis
  setActiveHypothesis: (hypothesisId) => set({ activeHypothesisId: hypothesisId }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),


  setArticleContent: (content) => set({ articleContent: content }),
  
  clearProject: () => set({
    currentProject: null,
    datasets: [],
    hypotheses: [],
    analyses: [],
    insights: [],
    tags: [],
    writingContent: null,
    articleContent: '',
    cells: [],
    dataset: null,
    selectedCellId: undefined,
    isExecutingAll: false,
    executionCounter: 0,
    activeHypothesisId: null,
    isLoading: false,
    error: null,
  }),
}));