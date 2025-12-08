'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface Hypothesis {
  id: string;
  content: string;
  createdAt: string;
}

interface HypothesisTagSelectorProps {
  hypotheses: Hypothesis[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

function HypothesisTagSelector({
  hypotheses,
  selectedTags,
  onTagsChange,
}: HypothesisTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (hypotheses.length === 0) {
    return null;
  }

  const toggleTag = (hypothesisId: string) => {
    if (selectedTags.includes(hypothesisId)) {
      onTagsChange(selectedTags.filter(id => id !== hypothesisId));
    } else {
      onTagsChange([...selectedTags, hypothesisId]);
    }
  };

  const getHypothesisNumber = (hypothesisId: string): string => {
    const index = hypotheses.findIndex(h => h.id === hypothesisId);
    return index !== -1 ? `H${index + 1}` : '';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        Link to Hypothesis ({selectedTags.length})
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700">
                Select Hypotheses
              </p>
            </div>

            <div className="p-1">
  {hypotheses.map((hypothesis, index) => {
    const isSelected = selectedTags.includes(hypothesis.id);
    return (
      <button
        key={hypothesis.id}
        onClick={() => toggleTag(hypothesis.id)}
        className="w-full flex items-center gap-2 p-2 hover:bg-purple-50 rounded transition-colors"
      >
        <div
          className="flex-shrink-0 w-4 h-4 border-2 rounded flex items-center justify-center"
          style={{
            borderColor: isSelected ? '#9C27B0' : '#D1D5DB',
            backgroundColor: isSelected ? '#9C27B0' : 'white',
          }}
        >
          {isSelected && <Check size={12} className="text-white" />}
        </div>

        <span className="text-sm font-semibold text-purple-700">
          H{index + 1}
        </span>
      </button>
    );
  })}
</div>
          </div>
        </>
      )}

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedTags.map(tagId => (
            <span
              key={tagId}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: '#9C27B0' }}
            >
              {getHypothesisNumber(tagId)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default HypothesisTagSelector;