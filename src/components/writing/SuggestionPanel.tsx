/**
 * SUGGESTION PANEL COMPONENT
 * Right sidebar showing suggestions and relevant analyses
 * FIXED: Tab state now persists when switching between main interface tabs
 */

import React, { useState, useEffect } from 'react';
import { WritingSuggestion, RelevantAnalysis } from '@/types/writing';
import { AlertCircle, AlertTriangle, Info, Lightbulb, ExternalLink, X } from 'lucide-react';

interface SuggestionPanelProps {
  suggestions: WritingSuggestion[];
  relevantAnalyses: RelevantAnalysis[];
  isLoadingSuggestions: boolean;
  isLoadingAnalyses: boolean;
  onAcceptSuggestion: (suggestionId: string) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onViewEvidence: (cellId: string) => void;
  expandedSuggestionId: string | null;
  analysisSuggestions: {[key: string]: any};
  modificationOptions: {[key: string]: any};
  onCloseExpanded: () => void;
  onSelectModification: (suggestionId: string, modificationIndex: number) => void;
  projectId?: string; // Add projectId for scoped localStorage
}

// Storage key for tab state
const getStorageKey = (projectId?: string) => {
  return projectId 
    ? `suggestionPanel_activeTab_${projectId}`
    : 'suggestionPanel_activeTab_global';
};

export function SuggestionPanel({
  suggestions,
  relevantAnalyses,
  isLoadingSuggestions,
  isLoadingAnalyses,
  onAcceptSuggestion,
  onDismissSuggestion,
  onViewEvidence,
  expandedSuggestionId,
  analysisSuggestions,
  modificationOptions,
  onCloseExpanded,
  onSelectModification,
  projectId,
}: SuggestionPanelProps) {
  // FIXED: Load initial state from localStorage to persist across navigation
  const [activeTab, setActiveTab] = useState<'suggestions' | 'relevant'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(getStorageKey(projectId));
      return (stored as 'suggestions' | 'relevant') || 'suggestions';
    }
    return 'suggestions';
  });

  // FIXED: Save tab state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getStorageKey(projectId), activeTab);
    }
  }, [activeTab, projectId]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      'missing-evidence': { text: 'Missing Evidence', color: 'bg-red-100 text-red-800' },
      'weak-support': { text: 'Weak Support', color: 'bg-orange-100 text-orange-800' },
      'strong-language': { text: 'Strong Language', color: 'bg-yellow-100 text-yellow-800' },
      'logical-issue': { text: 'Logical Issue', color: 'bg-purple-100 text-purple-800' },
      'add-analysis': { text: 'Missing Analysis', color: 'bg-blue-100 text-blue-800' },
      'clarity': { text: 'Clarity', color: 'bg-gray-100 text-gray-800' },
    };
    return labels[type] || { text: 'Suggestion', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col" style={{ height: '100%' }}>
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('suggestions')}
          >
            Issues ({suggestions.length})
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'relevant'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('relevant')}
          >
            Relevant
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
        {activeTab === 'suggestions' ? (
          <div className="p-4 space-y-4">
            {isLoadingSuggestions ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Analyzing claims...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No issues found</p>
                <p className="text-xs mt-1">Keep writing!</p>
              </div>
            ) : (
              suggestions
                .filter(s => s.status === 'active')
                .sort((a, b) => b.priority - a.priority)
                .map((suggestion) => (
                  <div key={suggestion.id}>
                    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        {getSeverityIcon(suggestion.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded ${getTypeLabel(suggestion.type).color}`}>
                              {getTypeLabel(suggestion.type).text}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            {suggestion.message}
                          </h4>
                        </div>
                      </div>

                      {/* Explanation */}
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.explanation}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {suggestion.type === 'add-analysis' ? (
                          <button
                            onClick={() => onAcceptSuggestion(suggestion.id)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          >
                            {expandedSuggestionId === suggestion.id ? 'Hide Suggestions' : 'Suggest Analysis'}
                          </button>
                        ) : (
                          <button
                            onClick={() => onAcceptSuggestion(suggestion.id)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          >
                            {expandedSuggestionId === suggestion.id ? 'Hide Options' : 'Fix It'}
                          </button>
                        )}
                        <button
                          onClick={() => onDismissSuggestion(suggestion.id)}
                          className="px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>

                    {/* Expanded Analysis Suggestions Section */}
                    {expandedSuggestionId === suggestion.id && analysisSuggestions[suggestion.id] && (
                      <div className="mt-2 border border-blue-200 rounded-lg bg-blue-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-900">Suggested Analyses</h5>
                          <button
                            onClick={onCloseExpanded}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {analysisSuggestions[suggestion.id].map((analysis: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white rounded border border-gray-200">
                              <p className="text-sm font-medium text-gray-900 mb-1">{analysis.query}</p>
                              <p className="text-xs text-gray-600">{analysis.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded Modification Options Section */}
                    {expandedSuggestionId === suggestion.id && modificationOptions[suggestion.id] && (
                      <div className="mt-2 border border-green-200 rounded-lg bg-green-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-900">Fix Options</h5>
                          <button
                            onClick={onCloseExpanded}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {modificationOptions[suggestion.id].suggestions.map((modSuggestion: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => onSelectModification(suggestion.id, idx)}
                              className="w-full p-3 bg-white rounded border border-gray-200 text-left hover:border-green-400 hover:bg-green-50 transition-colors"
                            >
                              <p className="text-gray-800 text-sm mb-2">{modSuggestion}</p>
                              {modificationOptions[suggestion.id].explanations[idx] && (
                                <p className="text-gray-600 text-xs italic">
                                  {modificationOptions[suggestion.id].explanations[idx]}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {isLoadingAnalyses ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Finding relevant analyses...
              </div>
            ) : relevantAnalyses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No relevant analyses</p>
                <p className="text-xs mt-1">Start writing to get suggestions</p>
              </div>
            ) : (
              relevantAnalyses.map((analysis) => (
                <div
                  key={analysis.cellId}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onViewEvidence(analysis.cellId)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {Math.round(analysis.overallScore * 100)}% relevant
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">{analysis.snippet}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}