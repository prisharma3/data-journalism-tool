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
    onSuggestionClick?: (claimId: string) => void; 
    highlightedClaimId?: string | null; 
    expandedSuggestionId: string | null;
    analysisSuggestions: {[key: string]: any};
    modificationOptions: {[key: string]: any};
    onCloseExpanded: () => void;
    onSelectModification: (suggestionId: string, modificationIndex: number) => void;
    onGenerateModification: (suggestionId: string) => void;
    projectId?: string;
    loadingModifications: Set<string>;
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
    onSuggestionClick, 
    highlightedClaimId,  
    expandedSuggestionId,
    analysisSuggestions,
    modificationOptions,
    onCloseExpanded,
    onSelectModification,
    onGenerateModification,
    projectId,
    loadingModifications,
  }: SuggestionPanelProps) {

 // No tab state needed - we only show issues now   

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
      <div className="w-64 border-l border-gray-200 bg-white flex flex-col" style={{ height: '100vh' }}>
        {/* Header */}
        <div className="border-b border-gray-200 px-3 py-2.5 bg-gray-50 flex-shrink-0">
          <h3 className="text-xs font-medium text-gray-700">
            Issues ({suggestions.length})
          </h3>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">

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
                  id={`suggestion-${suggestion.id}`}
                  onClick={() => {
                    if (onSuggestionClick) {
                      onSuggestionClick(suggestion.claimId);
                    }
                  }}
                  className={`rounded-lg p-4 transition-all cursor-pointer ${
                    highlightedClaimId === suggestion.claimId
                      ? 'ring-2 ring-yellow-400 shadow-lg'
                      : ''
                  } ${
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissSuggestion(suggestion.id);
                      }}
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
  
{/* Special rendering for add-analysis with suggested query
{suggestion.type === 'add-analysis' && suggestion.metadata?.suggestedQuery && (
  <div className="mb-3 p-3 bg-white rounded-lg border border-blue-200">
    <div className="flex items-start gap-2">
      <span className="text-lg">💡</span>
      <div className="flex-1">
        <p className="text-sm text-blue-800 font-mono bg-blue-50 p-2 rounded">
          {suggestion.metadata.suggestedQuery}
        </p>
      </div>
    </div>
    {suggestion.metadata.missingConcepts && suggestion.metadata.missingConcepts.length > 0 && (
      <div className="mt-2">
        <p className="text-xs text-gray-600">Missing concepts:</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {suggestion.metadata.missingConcepts.map((concept, idx) => (
            <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
              {concept}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
)} */}
  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                  {suggestion.type === 'add-analysis' && suggestion.metadata?.suggestedQuery && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(suggestion.metadata.suggestedQuery);
      alert('Analysis query copied! Paste it in the notebook to run.');
    }}
    className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
  >
    📋 Copy Query
  </button>
)}
                    
                    {(suggestion.type === 'weaken-claim' || suggestion.type === 'add-caveat' || suggestion.type === 'add-qualifier') && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onGenerateModification(suggestion.id);
    }}
    disabled={loadingModifications.has(suggestion.id)}
    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
  >
    {loadingModifications.has(suggestion.id) ? (
      <>
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
        <span>Loading...</span>
      </>
    ) : (
      <>✏️ Fix This Issue</>
    )}
  </button>
)}
                  </div>
  
                  {/* Modification Options - Show when expanded */}
                  {expandedSuggestionId === suggestion.id && modificationOptions[suggestion.id] && (
                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700">Suggested Modifications:</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloseExpanded();
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {modificationOptions[suggestion.id].suggestions.map((modSuggestion: string, index: number) => (
                          <div
                            key={index}
                            className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectModification(suggestion.id, index);
                            }}
                          >
                            <p className="text-sm text-gray-900 mb-1">{modSuggestion}</p>
                            {/* {modificationOptions[suggestion.id].explanations[index] && (
                              <p className="text-xs text-gray-600">
                                {modificationOptions[suggestion.id].explanations[index]}
                              </p>
                            )} */}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}