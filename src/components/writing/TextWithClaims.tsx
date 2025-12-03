/**
 * TEXT WITH CLAIMS COMPONENT 
 * Renders text with claim underlines
 *
 */

import React, { useRef, useEffect } from 'react';
import { ClaimStructure, WritingSuggestion } from '@/types/writing';

interface TextWithClaimsProps {
  text: string;
  claims: ClaimStructure[];
  suggestions: WritingSuggestion[];
  onClaimClick: (claimId: string) => void;
  highlightedClaimId?: string | null; 
  onContentChange?: (newText: string, cursorPosition: number) => void;
  isEditable?: boolean;
  isEvaluating?: boolean;
}

export function TextWithClaims({
  text,
  claims,
  suggestions,
  onClaimClick,
  highlightedClaimId,
  onContentChange,
  isEditable = false,
  isEvaluating = false,
}: TextWithClaimsProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const lastRenderedTextRef = useRef(text);

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
      return 'decoration-green-500 decoration-2 decoration-solid';
    }
  
    const topSuggestion = claimSuggestions.sort((a, b) => b.priority - a.priority)[0];
  
    if (topSuggestion.type === 'remove-claim') {
      return 'decoration-red-500 decoration-wavy decoration-2';
    }
    if (topSuggestion.type === 'add-analysis') {
      return 'decoration-blue-500 decoration-2 decoration-solid';
    }
    if (topSuggestion.type === 'weaken-claim' || topSuggestion.type === 'add-qualifier') {
      return 'decoration-yellow-500 decoration-2 decoration-solid';
    }
    if (topSuggestion.type === 'add-caveat') {
      return 'decoration-orange-500 decoration-2 decoration-solid';
    }

    if (topSuggestion.type === 'correct-value') {
      return 'decoration-purple-500 decoration-2 decoration-solid';
    }
    
    if (topSuggestion.severity === 'critical') {
      return 'decoration-red-500 decoration-wavy decoration-2';
    }
    if (topSuggestion.severity === 'warning') {
      return 'decoration-orange-500 decoration-2 decoration-solid';
    }
    return 'decoration-blue-500 decoration-2 decoration-solid';
  };

  // Add this new function after the getTooltip function (around line 90)
  const getUnderlineStyle = (claim: ClaimStructure): string => {
    const claimSuggestions = suggestions.filter(s => s.claimId === claim.id);
    
    // Show gray/neutral color while evaluating
    if (isEvaluating) {
      return 'text-decoration: underline; text-decoration-color: rgb(156, 163, 175); text-decoration-thickness: 2px; text-decoration-style: dotted;';
    }
    
    if (claimSuggestions.length === 0) {
      return 'text-decoration: underline; text-decoration-color: rgb(34, 197, 94); text-decoration-thickness: 2px; text-decoration-style: solid;';
    }

  const topSuggestion = claimSuggestions.sort((a, b) => b.priority - a.priority)[0];

  // Remove claim - red wavy
  if (topSuggestion.type === 'remove-claim') {
    return 'text-decoration: underline; text-decoration-color: rgb(239, 68, 68); text-decoration-thickness: 2px; text-decoration-style: wavy;';
  }
  // Add analysis - blue solid
  if (topSuggestion.type === 'add-analysis') {
    return 'text-decoration: underline; text-decoration-color: rgb(59, 130, 246); text-decoration-thickness: 2px; text-decoration-style: solid;';
  }
  // Weaken claim or add qualifier - yellow solid
  if (topSuggestion.type === 'weaken-claim' || topSuggestion.type === 'add-qualifier') {
    return 'text-decoration: underline; text-decoration-color: rgb(234, 179, 8); text-decoration-thickness: 2px; text-decoration-style: solid;';
  }
  // Add caveat - orange solid
  if (topSuggestion.type === 'add-caveat') {
    return 'text-decoration: underline; text-decoration-color: rgb(249, 115, 22); text-decoration-thickness: 2px; text-decoration-style: solid;';
  }

// Correct value - purple solid
if (topSuggestion.type === 'correct-value') {
  return 'text-decoration: underline; text-decoration-color: rgb(147, 51, 234); text-decoration-thickness: 2px; text-decoration-style: solid;';
}
  
  // Fallback based on severity
  if (topSuggestion.severity === 'critical') {
    return 'text-decoration: underline; text-decoration-color: rgb(239, 68, 68); text-decoration-thickness: 2px; text-decoration-style: wavy;';
  }
  if (topSuggestion.severity === 'warning') {
    return 'text-decoration: underline; text-decoration-color: rgb(249, 115, 22); text-decoration-thickness: 2px; text-decoration-style: solid;';
  }
  return 'text-decoration: underline; text-decoration-color: rgb(59, 130, 246); text-decoration-thickness: 2px; text-decoration-style: solid;';
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
  if (!isEditable || !editorRef.current || !onContentChange || isComposingRef.current) return;
  
  // Get text content (innerText handles line breaks better)
  const newText = editorRef.current.innerText;
  
  // Get proper cursor position by walking through all text nodes
  const selection = window.getSelection();
  let cursorPos = newText.length; // Default to end
  
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    
    // Calculate cursor position by counting characters before cursor
    const preCaretRange = document.createRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    cursorPos = preCaretRange.toString().length;
  }
  
  // Update tracking ref AFTER getting cursor position
  lastRenderedTextRef.current = newText;
  
  onContentChange(newText, cursorPos);
};

// Only update DOM when text changes from external source (not from typing)
useEffect(() => {
  if (!isEditable || !editorRef.current) return;
  
  const currentText = editorRef.current.innerText;
  
  // Only update if text changed externally (not from our own typing)
  if (text !== currentText && text !== lastRenderedTextRef.current) {
    lastRenderedTextRef.current = text;
    
    // Save cursor position
    const selection = window.getSelection();
    let cursorOffset = 0;
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorOffset = range.startOffset;
    }
    
    // Update the HTML
    editorRef.current.innerHTML = segments.map((segment) => {
      if (segment.claim) {
        const isHighlighted = highlightedClaimId === segment.claim.id;
        const underlineClass = getUnderlineClass(segment.claim);
        const tooltip = getTooltip(segment.claim);
        const highlightClass = isHighlighted ?
          'bg-yellow-100 ring-2 ring-yellow-400' : '';

        return `<span data-claim-id="${segment.claim.id}" class="underline underline-offset-4 ${underlineClass} cursor-pointer hover:bg-gray-100 transition-colors ${highlightClass}" title="${tooltip.replace(/"/g, '&quot;')}">${segment.text}</span>`;
      }
      return segment.text;
    }).join('');
    
    // Restore cursor
    requestAnimationFrame(() => {
      if (editorRef.current) {
        try {
          const range = document.createRange();
          const sel = window.getSelection();
          
          // Walk through text nodes to find cursor position
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let currentOffset = 0;
          let targetNode = null;
          let targetOffset = 0;
          
          while (walker.nextNode()) {
            const node = walker.currentNode;
            const nodeLength = node.textContent?.length || 0;
            
            if (currentOffset + nodeLength >= cursorOffset) {
              targetNode = node;
              targetOffset = cursorOffset - currentOffset;
              break;
            }
            
            currentOffset += nodeLength;
          }
          
          if (targetNode) {
            range.setStart(targetNode, targetOffset);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        } catch (e) {
          console.warn('Could not restore cursor:', e);
        }
      }
    });
  } else if (highlightedClaimId !== null) {
    // Just update the highlighting without changing text
    const allSpans = editorRef.current.querySelectorAll('[data-claim-id]');
    allSpans.forEach((span) => {
      const claimId = span.getAttribute('data-claim-id');
      if (claimId === highlightedClaimId) {
        span.classList.add('bg-yellow-100', 'ring-2', 'ring-yellow-400');
      } else {
        span.classList.remove('bg-yellow-100', 'ring-2', 'ring-yellow-400');
      }
    });
  }
}, [text, segments, highlightedClaimId, isEditable]);

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

// Initialize editor content on first render and when text/segments change
useEffect(() => {
  if (!isEditable || !editorRef.current) return;
  
  const currentText = editorRef.current.innerText;
  
  // Check if claim IDs have changed (not just count)
  const existingClaimIds = Array.from(
    editorRef.current.querySelectorAll('[data-claim-id]')
  ).map(span => span.getAttribute('data-claim-id'));
  
  const currentClaimIds = claims.map(c => c.id);
  
  // Compare arrays - need to re-render if IDs are different
  const claimIdsChanged = 
    existingClaimIds.length !== currentClaimIds.length ||
    !existingClaimIds.every((id, idx) => id === currentClaimIds[idx]);
  
  const shouldUpdate = 
    currentText === '' || // Empty - need to initialize
    claimIdsChanged; // Claims changed (IDs or count) - need new underlines
  
  if (shouldUpdate) {
    console.log('🔄 Updating editor with', claims.length, 'claims');
    
    // Save cursor position BEFORE modifying DOM
    const selection = window.getSelection();
    let savedCursorPos = 0;
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = document.createRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      savedCursorPos = preCaretRange.toString().length;
    }
    
    lastRenderedTextRef.current = text;
    
    // Build HTML with underlined claim spans
    editorRef.current.innerHTML = segments.map((segment) => {
      if (segment.claim) {
        const underlineStyle = getUnderlineStyle(segment.claim);
        const tooltip = getTooltip(segment.claim);
        const highlightClass = highlightedClaimId === segment.claim.id 
          ? 'bg-yellow-100 ring-2 ring-yellow-400' 
          : '';
        
        return `<span data-claim-id="${segment.claim.id}" style="${underlineStyle}" class="cursor-pointer hover:bg-gray-100 transition-colors ${highlightClass}" title="${tooltip.replace(/"/g, '&quot;')}">${segment.text}</span>`;
      }
      return segment.text;
    }).join('');
    
    // Restore cursor position AFTER modifying DOM
    requestAnimationFrame(() => {
      if (!editorRef.current) return;
      
      try {
        const sel = window.getSelection();
        const range = document.createRange();
        
        // Walk through text nodes to find the right position
        const walker = document.createTreeWalker(
          editorRef.current,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let currentOffset = 0;
        let targetNode: Node | null = null;
        let targetOffset = 0;
        
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const nodeLength = node.textContent?.length || 0;
          
          if (currentOffset + nodeLength >= savedCursorPos) {
            targetNode = node;
            targetOffset = savedCursorPos - currentOffset;
            break;
          }
          
          currentOffset += nodeLength;
        }
        
        if (targetNode) {
          range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      } catch (e) {
        console.warn('Could not restore cursor:', e);
      }
    });
  }
}, [isEditable, text, segments, claims.length, claims, highlightedClaimId, suggestions]);

// Update underline colors when suggestions change
useEffect(() => {
  if (!isEditable || !editorRef.current) return;
  
  const allSpans = editorRef.current.querySelectorAll('[data-claim-id]');
  allSpans.forEach((span) => {
    const claimId = span.getAttribute('data-claim-id');
    const claim = claims.find(c => c.id === claimId);
    if (claim) {
      const underlineStyle = getUnderlineStyle(claim);
      (span as HTMLElement).setAttribute('style', underlineStyle);
    }
  });
}, [isEditable, suggestions, claims, isEvaluating]);

// Update highlighting when highlightedClaimId changes
useEffect(() => {
  if (!isEditable || !editorRef.current) return;
  
  const allSpans = editorRef.current.querySelectorAll('[data-claim-id]');
  allSpans.forEach((span) => {
    const claimId = span.getAttribute('data-claim-id');
    if (claimId === highlightedClaimId) {
      (span as HTMLElement).classList.add('bg-yellow-100', 'ring-2', 'ring-yellow-400');
    } else {
      (span as HTMLElement).classList.remove('bg-yellow-100', 'ring-2', 'ring-yellow-400');
    }
  });
}, [isEditable, highlightedClaimId]);

// Editable view - key forces re-render when claims change
return (
  <div
    key={`editor-${claims.length}-${claims.map(c => c.id).join(',')}`}
    ref={editorRef}
    contentEditable={true}
    suppressContentEditableWarning={true}
    onInput={handleInput}
    onCompositionStart={handleCompositionStart}
    onCompositionEnd={handleCompositionEnd}
    onBlur={handleInput}
    className="prose max-w-none outline-none min-h-[200px] focus:outline-none"
    style={{ whiteSpace: 'pre-wrap' }}
    onClick={(e) => {
      const target = e.target as HTMLElement;
      const claimSpan = target.closest('[data-claim-id]');
      if (claimSpan) {
        const claimId = claimSpan.getAttribute('data-claim-id');
        if (claimId) {
          e.preventDefault();
          onClaimClick(claimId);
        }
      }
    }}
  />
);

}