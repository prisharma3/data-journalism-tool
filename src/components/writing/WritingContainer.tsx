'use client';

import { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { EnhancedWritingEditor } from './EnhancedWritingEditor';
import { useAutoSave } from '@/hooks/useAutoSave';

interface WritingContainerProps {
  projectId: string;
}

export default function WritingContainer({ projectId }: WritingContainerProps) {
    const { token } = useAuthStore();
    const {
      cells,
      dataset,
      hypotheses,
      insights,
      activeHypothesisId,
      articleContent: storedContent,  // Get from store
      setArticleContent: setStoredContent,  // Get action from store
    } = useProjectStore();
  
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wordCount, setWordCount] = useState(0);

// Track which project we've loaded content for
const loadedProjectRef = useRef<string | null>(null);

// Load article content on mount or when project changes
useEffect(() => {
    const loadArticle = async () => {
      // Skip loading if we already loaded for this project
      if (loadedProjectRef.current === projectId && storedContent !== undefined) {
        setIsLoading(false);
        return;
      }
  
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/article`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          throw new Error('Failed to load article');
        }
  
        const data = await response.json();
        setStoredContent(data.article.content || '');
        setWordCount(data.article.word_count || 0);
        loadedProjectRef.current = projectId;
      } catch (err: any) {
        console.error('Error loading article:', err);
        setError(err.message || 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };
  
    if (projectId && token) {
      loadArticle();
    }
  }, [projectId, token, setStoredContent, storedContent]);

  // Auto-save article content
  const saveArticle = async (content: string, wordCount: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/article`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          word_count: wordCount,
          auto_save: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save article');
      }

      return true;
    } catch (err: any) {
      console.error('Error saving article:', err);
      return false;
    }
  };

// Use auto-save hook
const { debouncedSave } = useAutoSave<string>({
  delay: 3000,
  onSave: async (content: string) => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    await saveArticle(content, words.length);
  },
  dependencies: [storedContent],
});

// Handle content change from editor
const handleContentChange = (newContent: string) => {
    setStoredContent(newContent); // Save to store immediately
    
    // Calculate word count (simple approach)
    const words = newContent.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  // Transform notebook state into the format EnhancedWritingEditor expects
  const notebookContext = {
    projectId,
    hypotheses: hypotheses.map(h => ({
      id: h.id,
      content: h.content,
    })),
    cells: cells.map(cell => ({
      id: cell.id,
      query: cell.query || '',
      output: cell.output ? {
        text: cell.output.text || '',
        plot: cell.output.plot,
      } : undefined,
      hypothesisTags: cell.hypothesisTags || [],
    })),
    insights: insights.map(insight => ({
      id: insight.id,
      content: insight.content,
      cellId: insight.cellId,
      tagId: insight.tagId,
      hypothesisTags: insight.hypothesisTags || [],
    })),
    dataset: dataset ? {
      filename: dataset.filename,
      summary: dataset.summary,
    } : undefined,
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main editor
  return (
    <div className="h-full flex flex-col bg-white">
{/* Header with word count */}
<div className="px-3 py-5 border-b border-gray-200 flex-shrink-0 bg-white flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Writing
        </h3>

        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>{wordCount} words</span>
          {hypotheses.length > 0 && (
            <span className="text-gray-400">|</span>
          )}
          {hypotheses.length > 0 && activeHypothesisId && (
            <span className="text-purple-600">
              Active: H{hypotheses.findIndex(h => h.id === activeHypothesisId) + 1}
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
      <EnhancedWritingEditor
  projectId={projectId}
  notebookContext={notebookContext}
  activeHypothesis={activeHypothesisId || undefined}
  initialContent={storedContent}
  onContentChange={handleContentChange}
/>
      </div>
    </div>
  );
}