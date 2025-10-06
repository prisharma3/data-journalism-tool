'use client';

import { useState, useCallback } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HypothesisTagSelector from './HypothesisTagSelector';


interface Tag {
  id: string;
  name: string;
  color: string;
}

interface InsightCardProps {
    insight: {
      id: string;
      cellId: string;
      content: string;
      tagId: string;
      hypothesisTags?: string[];
      createdAt: Date;
    };
    tag: Tag;
    onUpdate: (insightId: string, content: string, tagId: string, hypothesisTags?: string[]) => void;
    onDelete: (insightId: string) => void;
    onClick?: () => void; 
    isHighlighted?: boolean;
    allTags: Tag[];
    hypotheses: Array<{ id: string; content: string; createdAt: Date }>;
  }

export default function InsightCard({
  insight,
  tag,
  onUpdate,
  onDelete,
  onClick, 
  isHighlighted = false, 
  hypotheses,
  allTags,
}: InsightCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(insight.content);
  const [editTagId, setEditTagId] = useState(insight.tagId);
  const [editHypothesisTags, setEditHypothesisTags] = useState<string[]>(insight.hypothesisTags || []);


  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(insight.id, editContent.trim(), editTagId, editHypothesisTags);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(insight.content);
    setEditTagId(insight.tagId);
    setEditHypothesisTags(insight.hypothesisTags || []);
    setIsEditing(false);
  };

  return (
<div
  className="rounded-lg border-2 p-3 shadow-sm transition-all hover:shadow-md cursor-pointer"
  onClick={onClick}
  style={{
    borderColor: isHighlighted ? '#fbbf24' : tag.color,
    backgroundColor: isHighlighted ? '#fef3c7' : `${tag.color}15`,
    boxShadow: isHighlighted ? '0 0 0 3px rgba(251, 191, 36, 0.3)' : undefined,
  }}
>
      {/* Tag Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {isEditing ? (
            <select
              value={editTagId}
              onChange={(e) => setEditTagId(e.target.value)}
              className="text-xs font-semibold px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2"
              style={{ color: tag.color }}
            >
              {allTags.map(t => (
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
                onClick={handleSave}
                className="p-1 hover:bg-white/50 rounded"
                title="Save"
              >
                <Save size={12} style={{ color: tag.color }} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-white/50 rounded"
                title="Cancel"
              >
                <X size={12} className="text-gray-600" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-white/50 rounded"
                title="Edit"
              >
                <Edit2 size={12} className="text-gray-600" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete this insight?')) {
                    onDelete(insight.id);
                  }
                }}
                className="p-1 hover:bg-white/50 rounded"
                title="Delete"
              >
                <Trash2 size={12} className="text-red-600" />
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
          className="w-full p-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 resize-none bg-white"
          rows={3}
          autoFocus
        />
      ) : (
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {insight.content}
        </p>
      )}

      {/* Hypothesis Tags */}
      <div className="mt-2 pt-2 border-t" style={{ borderColor: `${tag.color}40` }}>
        {isEditing ? (
          <HypothesisTagSelector
            hypotheses={hypotheses}
            selectedTags={editHypothesisTags}
            onTagsChange={setEditHypothesisTags}
          />
        ) : (
          insight.hypothesisTags && insight.hypothesisTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {insight.hypothesisTags.map((tagId, index) => {
                const hypIndex = hypotheses.findIndex(h => h.id === tagId);
                return hypIndex !== -1 ? (
                  <span
                    key={tagId}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: '#9C27B0' }}
                  >
                    H{hypIndex + 1}
                  </span>
                ) : null;
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}