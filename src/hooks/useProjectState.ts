import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';

export function useProjectState(projectId: string) {
  const { token } = useAuthStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  
  const {
    cells,
    dataset,
    hypotheses,
    insights,
    tags,
    articleContent,
    setCells,
    setDataset,
    setHypotheses,
    setInsights,
    setTags,
    setArticleContent,
  } = useProjectStore();

  // Load state from database
  const loadState = useCallback(async () => {
    if (!token || !projectId || hasLoadedRef.current) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/state`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.state) {
          const state = data.state;
          if (state.cells) setCells(state.cells);
          if (state.dataset) setDataset(state.dataset);
          if (state.hypotheses) setHypotheses(state.hypotheses);
          if (state.insights) setInsights(state.insights);
          if (state.tags) setTags(state.tags);
          if (state.articleContent) setArticleContent(state.articleContent);
        }
        hasLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to load project state:', error);
    }
  }, [token, projectId, setCells, setDataset, setHypotheses, setInsights, setTags, setArticleContent]);

  // Save state to database
  const saveState = useCallback(async () => {
    if (!token || !projectId) return;

    const state = {
      cells,
      dataset,
      hypotheses,
      insights,
      tags,
      articleContent,
    };

    try {
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ state }),
      });
    } catch (error) {
      console.error('Failed to save project state:', error);
    }
  }, [token, projectId, cells, dataset, hypotheses, insights, tags, articleContent]);

  // Auto-save with debounce (save 2 seconds after last change)
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveState();
    }, 2000);
  }, [saveState]);

  // Load state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Auto-save when state changes (after initial load)
  useEffect(() => {
    if (hasLoadedRef.current) {
      debouncedSave();
    }
  }, [cells, dataset, hypotheses, insights, tags, articleContent, debouncedSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Manual save function (for "Save & Return" button)
  const saveAndReturn = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveState();
  }, [saveState]);

  return {
    saveState,
    saveAndReturn,
    loadState,
  };
}