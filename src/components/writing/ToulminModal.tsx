/**
 * CLAIM FEEDBACK MODAL
 * Shows evaluation and suggestions for a claim (Toulmin is internal only)
 */

import React from 'react';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle, Lightbulb, TrendingUp } from 'lucide-react';
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

  // Get severity icon and color
  const getSeverityDisplay = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      case 'info':
        return { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      default:
        return { icon: Info, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    }
  };

  // Get strength color
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-700 bg-green-100';
      case 'moderate': return 'text-yellow-700 bg-yellow-100';
      case 'weak': return 'text-orange-700 bg-orange-100';
      case 'unsupported': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Claim Evaluation
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
            {/* Claim Display */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Your Claim
              </label>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-base text-gray-900">{claim.text}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Type: {claim.type}</p>
            </div>

            {/* Overall Strength Assessment */}
            {evaluation && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Evidence Strength</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStrengthColor(evaluation.strength)}`}>
                    {evaluation.strength}
                  </span>
                </div>
                
                {/* Score bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Score</span>
                    <span>{evaluation.overallScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        evaluation.overallScore >= 70 ? 'bg-green-500' :
                        evaluation.overallScore >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${evaluation.overallScore}%` }}
                    />
                  </div>
                </div>

                {/* Evidence count */}
                {evaluation.grounds && evaluation.grounds.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{evaluation.grounds.length} piece{evaluation.grounds.length !== 1 ? 's' : ''} of supporting evidence found</span>
                  </div>
                )}
              </div>
            )}

            {/* Issues/Suggestions */}
            {evaluation && evaluation.issues && evaluation.issues.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Issues & Suggestions</h3>
                <div className="space-y-3">
                  {evaluation.issues.map((issue: any, index: number) => {
                    const display = getSeverityDisplay(issue.severity);
                    const Icon = display.icon;
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border ${display.borderColor} ${display.bgColor}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 ${display.color} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1">
                            <p className={`font-medium ${display.color} mb-1`}>
                              {issue.message}
                            </p>
                            <p className="text-sm text-gray-700">
                              {issue.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evidence Gaps */}
            {evaluation && evaluation.gaps && evaluation.gaps.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Suggested Additional Analysis
                </h3>
                <div className="space-y-3">
                  {evaluation.gaps.map((gap: any, index: number) => (
                    <div 
                      key={index}
                      className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <p className="text-sm font-medium text-purple-900 mb-1">
                        {gap.description}
                      </p>
                      {gap.missingConcepts && gap.missingConcepts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {gap.missingConcepts.map((concept: string, i: number) => (
                            <span 
                              key={i}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Suggestions from SuggestionPanel */}
            {claimSuggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Recommended Actions
                </h3>
                <div className="space-y-2">
                  {claimSuggestions.map((suggestion) => (
                    <div 
                      key={suggestion.id}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {suggestion.message}
                          </p>
                          {suggestion.explanation && (
                            <p className="text-sm text-gray-600">
                              {suggestion.explanation}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => onAcceptSuggestion(suggestion.id)}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No issues - positive feedback */}
            {evaluation && 
             (!evaluation.issues || evaluation.issues.length === 0) && 
             (!claimSuggestions || claimSuggestions.length === 0) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    This claim looks well-supported! No issues detected.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}