// In src/hooks/useProjectState.ts

import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';

export function useProjectState(projectId: string) {
  const { token } = useAuthStore();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);  // ADD THIS LINE
  
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
    clearProject,  
  } = useProjectStore();

  // Reset when projectId changes
  useEffect(() => {
    if (lastProjectIdRef.current !== null && lastProjectIdRef.current !== projectId) {
      // Project changed - clear the store and reset the loaded flag
      console.log('Project changed, clearing store. Old:', lastProjectIdRef.current, 'New:', projectId);
      clearProject();
      hasLoadedRef.current = false;
    }
    lastProjectIdRef.current = projectId;
  }, [projectId, clearProject]);

  // Load state from database
  const loadState = useCallback(async () => {
    if (!token || !projectId || hasLoadedRef.current) return;

    // IMPORTANT: Clear the store first to ensure new projects start empty
    clearProject();

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
        // If data.state is null/undefined, store remains cleared (empty project)
        hasLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to load project state:', error);
    }
  }, [token, projectId, setCells, setDataset, setHypotheses, setInsights, setTags, setArticleContent, clearProject]);

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