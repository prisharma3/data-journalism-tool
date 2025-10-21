/**
 * TEXT WITH CLAIMS COMPONENT
 * Renders text with claim underlines
 */

import React from 'react';
import { ClaimStructure, WritingSuggestion } from '@/types/writing';

interface TextWithClaimsProps {
  text: string;
  claims: ClaimStructure[];
  suggestions: WritingSuggestion[];
  onClaimClick: (claimId: string) => void;
}

export function TextWithClaims({
  text,
  claims,
  suggestions,
  onClaimClick,
}: TextWithClaimsProps) {
  // Sort claims by position (earliest first)
  const sortedClaims = [...claims].sort((a, b) => a.position.from - b.position.from);

  // Build segments of text with claims
  const segments: Array<{ text: string; claim?: ClaimStructure }> = [];
  let lastIndex = 0;

  for (const claim of sortedClaims) {
    // Add text before claim
    if (claim.position.from > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, claim.position.from),
      });
    }

    // Add claim
    segments.push({
      text: text.substring(claim.position.from, claim.position.to),
      claim,
    });

    lastIndex = claim.position.to;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
    });
  }

  // Get underline style based on issues
  const getUnderlineClass = (claim: ClaimStructure) => {
    const claimSuggestions = suggestions.filter(s => s.claimId === claim.id);
    
    if (claimSuggestions.length === 0) {
      return 'decoration-green-500 decoration-dotted'; // No issues
    }

    const hasCritical = claimSuggestions.some(s => s.severity === 'critical');
    const hasWarning = claimSuggestions.some(s => s.severity === 'warning');

    if (hasCritical) {
      return 'decoration-red-500 decoration-wavy'; // Critical
    }
    if (hasWarning) {
      return 'decoration-orange-500 decoration-dashed'; // Warning
    }
    return 'decoration-blue-500 decoration-dotted'; // Info
  };

  const getTooltip = (claim: ClaimStructure) => {
    const claimSuggestions = suggestions.filter(s => s.claimId === claim.id);
    if (claimSuggestions.length === 0) {
      return 'Claim detected - click for details';
    }
    return claimSuggestions[0].message;
  };

  return (
    <div className="whitespace-pre-wrap leading-relaxed font-serif">
      {segments.map((segment, index) => {
        if (segment.claim) {
          return (
            <span
              key={index}
              className={`underline underline-offset-4 cursor-pointer hover:bg-gray-100 transition-colors ${getUnderlineClass(segment.claim)}`}
              onClick={() => onClaimClick(segment.claim!.id)}
              title={getTooltip(segment.claim)}
            >
              {segment.text}
            </span>
          );
        }
        return <span key={index}>{segment.text}</span>;
      })}
    </div>
  );
}