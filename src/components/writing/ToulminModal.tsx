/**
 * TOULMIN MODAL COMPONENT
 * Shows detailed Toulmin diagram and evaluation for a claim
 */

import React from 'react';
import { X, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { ClaimStructure, WritingSuggestion } from '@/types/writing';

interface ToulminModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: ClaimStructure | null;
  evaluation: any | null;
  suggestions: WritingSuggestion[];
  onAcceptSuggestion: (suggestionId: string) => void;
}

export function ToulminModal({
  isOpen,
  onClose,
  claim,
  evaluation,
  suggestions,
  onAcceptSuggestion,
}: ToulminModalProps) {
  if (!isOpen || !claim) return null;

  const claimSuggestions = suggestions.filter(s => s.claimId === claim.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Claim Analysis
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Claim */}
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">
                Claim ({claim.type})
              </label>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-base text-gray-900 italic">"{claim.text}"</p>
              </div>
            </div>

            {/* Overall Assessment */}
            {evaluation && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Strength
                  </div>
                  <div className="text-2xl font-bold capitalize">
                    {evaluation.strength}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Overall Score
                  </div>
                  <div className="text-2xl font-bold">
                    {evaluation.overallScore}/100
                  </div>
                </div>
              </div>
            )}

            {/* Toulmin Framework */}
            {evaluation && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Toulmin Framework Analysis
                </h3>

                {/* Grounds (Evidence) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">
                      Grounds (Evidence)
                    </h4>
                  </div>
                  {evaluation.grounds && evaluation.grounds.length > 0 ? (
                    <div className="space-y-2">
                      {evaluation.grounds.map((ground: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <p className="text-sm text-gray-700">{ground.content}</p>
                          <div className="flex gap-3 mt-2 text-xs text-gray-500">
                            <span>Relevance: {Math.round(ground.relevanceScore * 100)}%</span>
                            <span>Strength: {Math.round(ground.strengthScore * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600 italic">
                      No evidence found in notebook
                    </p>
                  )}
                </div>

                {/* Warrant */}
                {evaluation.warrant && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-orange-600" />
                      <h4 className="font-medium text-gray-900">
                        Warrant (Logical Link)
                      </h4>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {evaluation.warrant.statement}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500">
                        <span className="capitalize">Type: {evaluation.warrant.type}</span>
                        <span>Confidence: {Math.round(evaluation.warrant.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Qualifier */}
                {evaluation.qualifier && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">Qualifier</h4>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                      {evaluation.qualifier.detected?.length > 0 && (
                        <div className="mb-2">
                          <span className="font-medium">Detected: </span>
                          {evaluation.qualifier.detected.join(', ')}
                        </div>
                      )}
                      {evaluation.qualifier.missing?.length > 0 && (
                        <div>
                          <span className="font-medium text-red-600">Missing: </span>
                          {evaluation.qualifier.missing.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Issues */}
            {claimSuggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Issues Found ({claimSuggestions.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {claimSuggestions.map((suggestion) => {
                    const severityColor = 
                      suggestion.severity === 'critical' ? 'red' :
                      suggestion.severity === 'warning' ? 'orange' : 'blue';

                    return (
                      <div
                        key={suggestion.id}
                        className={`p-4 bg-${severityColor}-50 border border-${severityColor}-200 rounded-lg`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className={`text-xs px-2 py-1 rounded bg-${severityColor}-100 text-${severityColor}-800 font-medium`}>
                              {suggestion.severity}
                            </span>
                            <h4 className="font-medium text-gray-900 mt-2">
                              {suggestion.message}
                            </h4>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {suggestion.explanation}
                        </p>
                        <button
                          onClick={() => onAcceptSuggestion(suggestion.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        >
                          Fix This Issue
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evidence Gaps */}
            {evaluation?.gaps && evaluation.gaps.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Evidence Gaps
                </h3>
                <div className="space-y-2">
                  {evaluation.gaps.map((gap: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {gap.description}
                      </p>
                      {gap.missingConcepts && gap.missingConcepts.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Missing: {gap.missingConcepts.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}