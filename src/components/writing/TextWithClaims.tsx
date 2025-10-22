/**
 * TEXT WITH CLAIMS COMPONENT
 * Renders text with claim underlines - now supports editing
 * FIXED: Underlines are now inline with text, not in overlay
 */

import React, { useRef, useEffect } from 'react';
import { ClaimStructure, WritingSuggestion } from '@/types/writing';

interface TextWithClaimsProps {
  text: string;
  claims: ClaimStructure[];
  suggestions: WritingSuggestion[];
  onClaimClick: (claimId: string) => void;
  onContentChange?: (newText: string, cursorPosition: number) => void;
  isEditable?: boolean;
}

export function TextWithClaims({
  text,
  claims,
  suggestions,
  onClaimClick,
  onContentChange,
  isEditable = false,
}: TextWithClaimsProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

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

  // Handle content changes in editable mode
  const handleInput = () => {
    if (!isEditable || !editorRef.current || !onContentChange) return;
    
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
      // Save cursor position
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const cursorOffset = range?.startOffset || 0;
      
      // Update will happen via re-render
      
      // Restore cursor after render
      setTimeout(() => {
        if (editorRef.current && selection) {
          try {
            const newRange = document.createRange();
            const textNode = editorRef.current.firstChild;
            if (textNode) {
              newRange.setStart(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0));
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          } catch (e) {
            console.error('Failed to restore cursor:', e);
          }
        }
      }, 0);
    }
  }, [text, isEditable]);

  if (isEditable) {
    return (
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onCompositionStart={() => { isComposingRef.current = true; }}
        onCompositionEnd={() => { 
          isComposingRef.current = false;
          handleInput();
        }}
        className="w-full min-h-[calc(100vh-200px)] p-6 text-base leading-relaxed focus:outline-none font-serif whitespace-pre-wrap"
        style={{
          lineHeight: '1.8',
          fontSize: '16px',
        }}
        suppressContentEditableWarning
      >
        {segments.map((segment, index) => {
          if (segment.claim) {
            return (
              <span
                key={index}
                className={`underline underline-offset-4 cursor-pointer hover:bg-gray-100 transition-colors ${getUnderlineClass(segment.claim)}`}
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
          return <React.Fragment key={index}>{segment.text}</React.Fragment>;
        })}
      </div>
    );
  }

  // Read-only mode
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