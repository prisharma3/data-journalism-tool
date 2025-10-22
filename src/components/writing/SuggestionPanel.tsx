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
      'add-analysis': { text: 'Run Analysis', color: 'bg-blue-100 text-blue-800' },
      'remove-claim': { text: 'Remove Claim', color: 'bg-red-100 text-red-800' },
      'weaken-claim': { text: 'Weaken Language', color: 'bg-yellow-100 text-yellow-800' },
      'add-caveat': { text: 'Add Caveat', color: 'bg-orange-100 text-orange-800' },
      'add-qualifier': { text: 'Add Qualifier', color: 'bg-yellow-100 text-yellow-800' },
      'cite-evidence': { text: 'Cite Evidence', color: 'bg-green-100 text-green-800' },
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
  <div 
    className={`rounded-lg p-4 transition-all ${
      suggestion.type === 'remove-claim' 
        ? 'bg-red-50 border-2 border-red-300 hover:shadow-lg' 
        : suggestion.type === 'add-analysis'
        ? 'bg-blue-50 border-2 border-blue-300 hover:shadow-lg'
        : 'border border-gray-200 hover:shadow-md'
    }`}
  >
    {/* Header */}
    <div className="flex items-start gap-3 mb-3">
      {getSeverityIcon(suggestion.severity)}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-1 rounded font-medium ${getTypeLabel(suggestion.type).color}`}>
            {getTypeLabel(suggestion.type).text}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-gray-900">
          {suggestion.message}
        </h4>
      </div>
      <button
        onClick={() => onDismissSuggestion(suggestion.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>

    {/* Explanation */}
    <p className="text-sm text-gray-600 mb-3">
      {suggestion.explanation}
    </p>

    {/* Special rendering for add-analysis with suggested query */}
    {suggestion.type === 'add-analysis' && suggestion.metadata?.suggestedQuery && (
      <div className="mb-3 p-3 bg-white rounded-lg border border-blue-200">
        <p className="text-xs font-semibold text-blue-900 mb-2">💡 Suggested Analysis:</p>
        <p className="text-sm text-blue-800 font-mono bg-blue-50 p-2 rounded">
          {suggestion.metadata.suggestedQuery}
        </p>
        {suggestion.metadata.missingConcepts && suggestion.metadata.missingConcepts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs text-gray-600">Missing:</span>
            {suggestion.metadata.missingConcepts.map((concept: string, idx: number) => (
              <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Special rendering for remove-claim */}
    {suggestion.type === 'remove-claim' && (
      <div className="mb-3 p-3 bg-white rounded-lg border border-red-200">
        <p className="text-xs font-semibold text-red-900 mb-2">⚠️ Why Remove This Claim?</p>
        <p className="text-xs text-red-700">
          {suggestion.metadata?.reason === 'fundamentally-unsupportable' 
            ? 'This claim requires data or methodology that is not available in your project. No amount of additional analysis can support this claim with your current dataset.'
            : 'There is insufficient evidence to support this claim, and the required evidence cannot be obtained from your data.'}
        </p>
      </div>
    )}

    {/* Actions */}
    <div className="flex gap-2">
      {suggestion.type === 'add-analysis' ? (
        <button
          onClick={() => onAcceptSuggestion(suggestion.id)}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          {expandedSuggestionId === suggestion.id ? '📊 Hide Analysis Options' : '📊 View Analysis Options'}
        </button>
      ) : suggestion.type === 'remove-claim' ? (
        <button
          onClick={() => onAcceptSuggestion(suggestion.id)}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          🗑️ Remove This Claim
        </button>
      ) : (
        <button
          onClick={() => onAcceptSuggestion(suggestion.id)}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          {expandedSuggestionId === suggestion.id ? 'Hide Options' : '✏️ Fix This Issue'}
        </button>
      )}
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
  <button
    key={idx}
    onClick={() => {
      // Copy the query to clipboard
      navigator.clipboard.writeText(analysis.naturalLanguageQuery || analysis.query);
      alert(`Analysis query copied to clipboard!\n\nNow go to your notebook and paste it to run the analysis.`);
    }}
    className="w-full p-3 bg-white rounded border border-gray-200 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
  >
    <p className="text-sm font-medium text-gray-900 mb-1">
      {analysis.title || analysis.query || analysis.naturalLanguageQuery}
    </p>
    <p className="text-xs text-gray-600 mb-2">
      {analysis.explanation}
    </p>
    <div className="flex items-center gap-2 text-xs text-blue-600">
      <span>📋 Click to copy query</span>
      {analysis.priority === 'high' && (
        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">High Priority</span>
      )}
    </div>
  </button>
))}

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