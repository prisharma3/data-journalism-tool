/**
 * TEXT WITH CLAIMS COMPONENT - FIXED
 * Renders text with claim underlines - now supports editing
 * FIXED: removeChild error by preventing React DOM conflicts
 */

import React, { useRef, useEffect, useState } from 'react';
import { ClaimStructure, WritingSuggestion } from '@/types/writing';

interface TextWithClaimsProps {
  text: string;
  claims: ClaimStructure[];
  suggestions: WritingSuggestion[];
  onClaimClick: (claimId: string) => void;
  highlightedClaimId?: string | null; 
  onContentChange?: (newText: string, cursorPosition: number) => void;
  isEditable?: boolean;
}

export function TextWithClaims({
  text,
  claims,
  suggestions,
  onClaimClick,
  highlightedClaimId,
  onContentChange,
  isEditable = false,
}: TextWithClaimsProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [isUpdating, setIsUpdating] = useState(false);

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
      return 'decoration-green-500 decoration-2'; // No issues - solid green
    }
  
    // Get highest priority suggestion
    const topSuggestion = claimSuggestions.sort((a, b) => b.priority - a.priority)[0];
  
    // Match colors to suggestion types (same as badge colors in SuggestionPanel)
    if (topSuggestion.type === 'remove-claim') {
      return 'decoration-red-500 decoration-wavy decoration-2'; // Red wavy for remove
    }
    if (topSuggestion.type === 'add-analysis') {
      return 'decoration-blue-500 decoration-2'; // Blue solid for add-analysis
    }
    if (topSuggestion.type === 'weaken-claim' || topSuggestion.type === 'add-qualifier') {
      return 'decoration-yellow-500 decoration-2'; // Yellow for weaken
    }
    if (topSuggestion.type === 'add-caveat') {
      return 'decoration-orange-500 decoration-2'; // Orange for caveat
    }
    
    // Fallback to severity
    if (topSuggestion.severity === 'critical') {
      return 'decoration-red-500 decoration-wavy decoration-2';
    }
    if (topSuggestion.severity === 'warning') {
      return 'decoration-orange-500 decoration-2';
    }
    return 'decoration-blue-500 decoration-2';
  };

  const getTooltip = (claim: ClaimStructure) => {
    const claimSuggestions = suggestions.filter(s => s.claimId === claim.id);
    if (claimSuggestions.length === 0) {
      return 'Claim detected - click for details';
    }
    return claimSuggestions[0].message;
  };

  // Handle content changes in editable mode
  const handleInput = () => {
    if (!isEditable || !editorRef.current || !onContentChange || isUpdating) return;
    
    const newText = editorRef.current.innerText;
    const selection = window.getSelection();
    const cursorPos = selection?.anchorOffset || 0;
    
    onContentChange(newText, cursorPos);
  };

  // Update content when text prop changes (but preserve cursor)
  useEffect(() => {
    if (!isEditable || !editorRef.current) return;
    
    const currentText = editorRef.current.innerText;
    if (currentText !== text) {
      // Prevent recursive updates
      setIsUpdating(true);
      
      // Save cursor position
      const selection = window.getSelection();
      let cursorOffset = 0;
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        cursorOffset = range.startOffset;
      }
      
      // Update will happen via re-render
      // The cursor restoration will happen after the render
      
      // Schedule cursor restoration after DOM update
      requestAnimationFrame(() => {
        if (editorRef.current) {
          try {
            const textNode = editorRef.current.firstChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              const range = document.createRange();
              const sel = window.getSelection();
              const offset = Math.min(cursorOffset, textNode.textContent?.length || 0);
              
              range.setStart(textNode, offset);
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          } catch (e) {
            // Ignore cursor restoration errors
            console.warn('Could not restore cursor:', e);
          }
        }
        setIsUpdating(false);
      });
    }
  }, [text, isEditable]);

  // Composition event handlers for IME input
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    handleInput();
  };

  if (!isEditable) {
    // Non-editable view with underlines
    return (
      <div className="prose max-w-none">
        {segments.map((segment, index) => {
          if (segment.claim) {
            const isHighlighted = highlightedClaimId === segment.claim.id;
            return (
              <span
                key={index}
                className={`underline underline-offset-4 ${getUnderlineClass(segment.claim)} cursor-pointer hover:bg-gray-100 transition-colors ${
                  isHighlighted ? 'bg-yellow-100 ring-2 ring-yellow-400' : ''
                }`}
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

  // Editable view
  return (
    <div
      ref={editorRef}
      contentEditable={true}
      suppressContentEditableWarning={true}
      onInput={handleInput}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className="prose max-w-none outline-none min-h-[200px] focus:outline-none"
      style={{ whiteSpace: 'pre-wrap' }}
    >
      {segments.map((segment, index) => {
        if (segment.claim) {
          const isHighlighted = highlightedClaimId === segment.claim.id;
          return (
            <span
              key={`${segment.claim.id}-${index}`}
              data-claim-id={segment.claim.id}
              className={`underline underline-offset-4 ${getUnderlineClass(segment.claim)} cursor-pointer hover:bg-gray-100 transition-colors ${
                isHighlighted ? 'bg-yellow-100 ring-2 ring-yellow-400' : ''
              }`}
              onClick={(e) => {
                e.preventDefault();
                onClaimClick(segment.claim!.id);
              }}
              title={getTooltip(segment.claim)}
            >
              {segment.text}
            </span>
          );
        }
        return <span key={`text-${index}`}>{segment.text}</span>;
      })}
    </div>
  );
}