'use client';

import { useState } from 'react';
import { Filter, ChevronDown, ChevronRight, X } from 'lucide-react';

interface NotebookFilterProps {
  hypotheses: Array<{ id: string; content: string }>;
  tags: Array<{ id: string; name: string; color: string }>;
  selectedHypotheses: string[];
  selectedTags: string[];
  onHypothesesChange: (hypothesisIds: string[]) => void;
  onTagsChange: (tagIds: string[]) => void;
  onClearAll: () => void;
}

export default function NotebookFilter({
  hypotheses,
  tags,
  selectedHypotheses,
  selectedTags,
  onHypothesesChange,
  onTagsChange,
  onClearAll,
}: NotebookFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hypothesesExpanded, setHypothesesExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  const activeFilterCount = selectedHypotheses.length + selectedTags.length;

  const toggleHypothesis = (hypothesisId: string) => {
    if (selectedHypotheses.includes(hypothesisId)) {
      onHypothesesChange(selectedHypotheses.filter(id => id !== hypothesisId));
    } else {
      onHypothesesChange([...selectedHypotheses, hypothesisId]);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleClearAll = () => {
    onClearAll();
  };

  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filter Header */}
      <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg">
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="flex-1 flex items-center gap-2 text-left"
  >
    <Filter size={16} className="text-gray-600" />
    <span className="text-sm font-semibold text-gray-700">
      Filter Cells
    </span>
    {activeFilterCount > 0 && (
      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
        {activeFilterCount}
      </span>
    )}
  </button>
  <div className="flex items-center gap-2">
    {activeFilterCount > 0 && (
      <button
        onClick={handleClearAll}
        className="px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        Clear All
      </button>
    )}
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="p-1"
    >
      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
  </div>
</div>

      {/* Filter Content */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {/* Hypotheses Section */}
          <div className="mt-3">
            <button
              onClick={() => setHypothesesExpanded(!hypothesesExpanded)}
              className="flex items-center gap-2 w-full text-left mb-2"
            >
              {hypothesesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="text-sm font-semibold text-gray-700">Hypotheses</span>
              {selectedHypotheses.length > 0 && (
                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  {selectedHypotheses.length}
                </span>
              )}
            </button>

            {hypothesesExpanded && (
              <div className="ml-6 space-y-2">
                {hypotheses.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hypotheses defined</p>
                ) : (
                  hypotheses.map((hypothesis, index) => (
                    <label
                      key={hypothesis.id}
                      className="flex items-start gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedHypotheses.includes(hypothesis.id)}
                        onChange={() => toggleHypothesis(hypothesis.id)}
                        className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                        <span className="font-medium text-purple-600">H{index + 1}:</span>{' '}
                        {hypothesis.content.length > 60
                          ? `${hypothesis.content.substring(0, 60)}...`
                          : hypothesis.content}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="mt-4">
            <button
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="flex items-center gap-2 w-full text-left mb-2"
            >
              {tagsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="text-sm font-semibold text-gray-700">Insight Tags</span>
              {selectedTags.length > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {selectedTags.length}
                </span>
              )}
            </button>

            {tagsExpanded && (
              <div className="ml-6 space-y-2">
                {tags.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No tags created yet</p>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                        className="rounded border-gray-300 focus:ring-2"
                        style={{
                          accentColor: tag.color,
                        }}
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        {tag.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">Active Filters:</span>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedHypotheses.map((hypId) => {
                  const hypothesis = hypotheses.find(h => h.id === hypId);
                  const hypIndex = hypotheses.findIndex(h => h.id === hypId);
                  return hypothesis ? (
                    <span
                      key={hypId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                    >
                      H{hypIndex + 1}
                      <button
                        onClick={() => toggleHypothesis(hypId)}
                        className="hover:text-purple-900"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ) : null;
                })}
                {selectedTags.map((tagId) => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <span
                      key={tagId}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                      <button
                        onClick={() => toggleTag(tagId)}
                        className="hover:opacity-80"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}