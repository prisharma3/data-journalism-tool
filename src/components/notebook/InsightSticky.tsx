'use client';

import { useState } from 'react';
import { Edit2, Trash2, Save, X, Bookmark } from 'lucide-react';
import HypothesisTagSelector from './HypothesisTagSelector';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Insight {
  id: string;
  cellId: string;
  content: string;
  tagId: string;
  hypothesisTags?: string[];
  createdAt: Date;
}

interface InsightStickyProps {
    insights: Insight[];
    tags: Tag[];
    hypotheses: Array<{ id: string; content: string; createdAt: Date }>;
    onUpdate: (insightId: string, content: string, tagId: string, hypothesisTags?: string[]) => void;
    onDelete: (insightId: string) => void;
    onAddTag: (name: string, color: string) => string; // ADD THIS
  }
export default function InsightSticky({
  insights,
  tags,
  hypotheses,
  onUpdate,
  onDelete,
}: InsightStickyProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTagId, setEditTagId] = useState('');
  const [editHypothesisTags, setEditHypothesisTags] = useState<string[]>([]);

  const handleEdit = (insight: Insight) => {
    setEditingId(insight.id);
    setEditContent(insight.content);
    setEditTagId(insight.tagId);
    setEditHypothesisTags(insight.hypothesisTags || []);
    setExpandedId(insight.id);
  };

  const handleSave = (insightId: string) => {
    if (editContent.trim()) {
      onUpdate(insightId, editContent.trim(), editTagId, editHypothesisTags);
      setEditingId(null);
      setExpandedId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
    setExpandedId(null);
  };

  if (insights.length === 0) return null;

  return (
    <div className="absolute top-2 -right-10 flex flex-col gap-1 z-50">
      {insights.map(insight => {
        const tag = tags.find(t => t.id === insight.tagId);
        if (!tag) return null;

        const isExpanded = expandedId === insight.id;
        const isEditing = editingId === insight.id;

        return (
          <div key={insight.id} className="relative">
            {/* Collapsed Bookmark */}
            {!isExpanded && (
              <button
                onClick={() => setExpandedId(insight.id)}
                className="w-8 h-10 rounded-l-md shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                style={{
                  backgroundColor: tag.color,
                  borderRight: `3px solid ${tag.color}`,
                }}
                title={`${tag.name}: ${insight.content.substring(0, 50)}...`}
              >
                <Bookmark size={16} className="text-white" fill="white" />
              </button>
            )}

            {/* Expanded Sticky */}
            {isExpanded && (
              <div
                className="w-80 rounded-l-lg shadow-xl border-2 p-3 bg-white"
                style={{ borderColor: tag.color }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bookmark size={14} style={{ color: tag.color }} fill={tag.color} />
                    {isEditing ? (
                      <select
                        value={editTagId}
                        onChange={(e) => setEditTagId(e.target.value)}
                        className="text-xs font-semibold px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2"
                        style={{ color: tag.color }}
                      >
                        {tags.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: tag.color }}>
                        {tag.name}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(insight.id)}
                          className="p-1 hover:bg-green-100 rounded transition-colors"
                          title="Save"
                        >
                          <Save size={14} className="text-green-600" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={14} className="text-gray-600" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(insight)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => onDelete(insight.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                        <button
                          onClick={() => setExpandedId(null)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Collapse"
                        >
                          <X size={14} className="text-gray-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    placeholder="Write your insight..."
                  />
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{insight.content}</p>
                )}

                {/* Hypothesis Tags */}
                {isEditing && hypotheses.length > 0 && (
                  <div className="mt-2">
                    <HypothesisTagSelector
                      hypotheses={hypotheses}
                      selectedTags={editHypothesisTags}
                      onTagsChange={setEditHypothesisTags}
                    />
                  </div>
                )}

                {!isEditing && insight.hypothesisTags && insight.hypothesisTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {insight.hypothesisTags.map(hId => {
                      const hyp = hypotheses.find(h => h.id === hId);
                      if (!hyp) return null;
                      return (
                        <span
                          key={hId}
                          className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded"
                          title={hyp.content}
                        >
                          H{hypotheses.indexOf(hyp) + 1}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-[10px] text-gray-400 mt-2">
                  {new Date(insight.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}