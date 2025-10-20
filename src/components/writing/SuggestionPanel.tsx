/**
 * SUGGESTION PANEL COMPONENT
 * Right sidebar showing suggestions and relevant analyses
 */

import React, { useState } from 'react';
import { WritingSuggestion, RelevantAnalysis } from '@/types/writing';
import { AlertCircle, AlertTriangle, Info, Lightbulb, ExternalLink } from 'lucide-react';

interface SuggestionPanelProps {
  suggestions: WritingSuggestion[];
  relevantAnalyses: RelevantAnalysis[];
  isLoadingSuggestions: boolean;
  isLoadingAnalyses: boolean;
  onAcceptSuggestion: (suggestionId: string) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onViewEvidence: (cellId: string) => void;
}

export function SuggestionPanel({
  suggestions,
  relevantAnalyses,
  isLoadingSuggestions,
  isLoadingAnalyses,
  onAcceptSuggestion,
  onDismissSuggestion,
  onViewEvidence,
}: SuggestionPanelProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'relevant'>('suggestions');

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

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      warning: 'bg-orange-100 text-orange-800',
      info: 'bg-blue-100 text-blue-800',
    };
    return colors[severity as keyof typeof colors] || colors.info;
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'suggestions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('suggestions')}
          >
            Issues ({suggestions.length})
          </button>
          <button
            className={`flex-1 px-4 py-3 text-sm font-medium ${
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
      <div className="flex-1 overflow-y-auto">
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
                  <div
                    key={suggestion.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      {getSeverityIcon(suggestion.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-1 rounded ${getSeverityBadge(suggestion.severity)}`}>
                            {suggestion.severity}
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
                          Suggest Analysis
                        </button>
                      ) : (
                        <button
                          onClick={() => onAcceptSuggestion(suggestion.id)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        >
                          Fix It
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
                <ExternalLink className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No relevant analyses yet</p>
                <p className="text-xs mt-1">Start analyzing your data</p>
              </div>
            ) : (
                relevantAnalyses.map((analysis, index) => (  // Add index parameter
                    <div
                      key={`${analysis.cellId}-${index}`}  // Changed to include index
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onViewEvidence(analysis.cellId)}
                >
                  {/* Type badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
                      {analysis.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(analysis.overallScore * 100)}% relevant
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {analysis.snippet}
                  </p>

                  {/* Hypothesis tags */}
                  {analysis.hypothesisTags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {analysis.hypothesisTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}