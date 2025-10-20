/**
 * CLAIM UNDERLINE COMPONENT
 * Grammarly-style underlines for claims with issues
 */

import React from 'react';
import { ClaimStructure, WritingSuggestion } from '@/types/writing';

interface ClaimUnderlineProps {
  claim: ClaimStructure;
  suggestions: WritingSuggestion[];
  onClick: () => void;
}

export function ClaimUnderline({ claim, suggestions, onClick }: ClaimUnderlineProps) {
  // Determine underline style based on severity
  const getUnderlineStyle = () => {
    if (suggestions.length === 0) {
      return 'decoration-green-500 decoration-dotted'; // No issues
    }

    const hasCritical = suggestions.some(s => s.severity === 'critical');
    const hasWarning = suggestions.some(s => s.severity === 'warning');

    if (hasCritical) {
      return 'decoration-red-500 decoration-wavy'; // Critical issues
    }
    if (hasWarning) {
      return 'decoration-orange-500 decoration-dashed'; // Warnings
    }
    return 'decoration-blue-500 decoration-dotted'; // Info
  };

  const getTooltipText = () => {
    if (suggestions.length === 0) {
      return 'Claim detected - click for details';
    }
    const topSuggestion = suggestions[0];
    return topSuggestion.message;
  };

  return (
    <span
      className={`underline underline-offset-4 ${getUnderlineStyle()} cursor-pointer hover:bg-gray-100 transition-colors relative group`}
      onClick={onClick}
    >
      {claim.text}
      
      {/* Tooltip on hover */}
      <span className="invisible group-hover:visible absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg whitespace-nowrap z-50">
        {getTooltipText()}
        <span className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></span>
      </span>
    </span>
  );
}