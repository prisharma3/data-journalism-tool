'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Save, X, Plus } from 'lucide-react';
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
    cellId?: string;
    content: string;
    tagId: string;
    hypothesisTags?: string[];
    plotThumbnail?: string;
    createdAt: string;
  };
  tag?: Tag;
  onUpdate: (insightId: string, content: string, tagId: string, hypothesisTags?: string[]) => void;
  onDelete: (insightId: string) => void;
  onAddTag?: (name: string, color: string) => string;
  onClick?: () => void; // ADD THIS LINE
  isHighlighted?: boolean; // ADD THIS LINE
  allTags: Tag[];
  hypotheses: Array<{ id: string; content: string; createdAt: string }>;
}

const PRESET_COLORS = [
    '#F44336', // Red
    '#E91E63', // Pink
    '#FF9800', // Orange
    '#FFC107', // Amber
    '#FFEB3B', // Yellow
    '#4CAF50', // Green
    '#00BCD4', // Cyan
    '#2196F3', // Blue
    '#3F51B5', // Indigo
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#000000', // Black
  ];

  export default function InsightCard({
    insight,
    tag,
    onUpdate,
    onDelete,
    onAddTag,
    onClick, // ADD THIS LINE
    isHighlighted = false, // ADD THIS LINE
    hypotheses,
    allTags,
  }: InsightCardProps) {
  // Auto-enter edit mode if no tagId (new insight)
  const [isEditing, setIsEditing] = useState(!insight.tagId || !insight.content);
  const [editContent, setEditContent] = useState(insight.content);
  const [editTagId, setEditTagId] = useState(insight.tagId);
  const [editHypothesisTags, setEditHypothesisTags] = useState<string[]>(insight.hypothesisTags || []);
  
  // Tag creation state
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

  // Auto-focus when in new insight mode
  useEffect(() => {
    if (!insight.tagId || !insight.content) {
      setIsEditing(true);
    }
  }, [insight.tagId, insight.content]);

  const handleSave = () => {
    if (editContent.trim() && editTagId) {
      onUpdate(insight.id, editContent.trim(), editTagId, editHypothesisTags);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (!insight.content) {
      // If it's a new insight with no content, delete it
      onDelete(insight.id);
    } else {
      setEditContent(insight.content);
      setEditTagId(insight.tagId);
      setEditHypothesisTags(insight.hypothesisTags || []);
      setIsEditing(false);
    }
  };

  const handleAddNewTag = () => {
    if (newTagName.trim() && onAddTag) {
      const newTagId = onAddTag(newTagName.trim(), newTagColor);
      setEditTagId(newTagId);
      setNewTagName('');
      setNewTagColor(PRESET_COLORS[0]);
      setShowAddTag(false);
    }
  };

  const currentTag = tag || allTags.find(t => t.id === editTagId);
  const borderColor = currentTag?.color || '#gray';
  const bgColor = currentTag?.color ? `${currentTag.color}15` : '#f3f4f6';

  return (
        <div
          className="rounded-lg border-2 p-3 shadow-sm transition-all hover:shadow-md cursor-pointer"
          onClick={(e) => {
            // Only trigger onClick if not clicking on interactive elements
            if (!isEditing && onClick && !(e.target as HTMLElement).closest('button, input, textarea, select')) {
              onClick();
            }
          }}
          style={{
            borderColor: isHighlighted ? '#fbbf24' : borderColor,
            backgroundColor: isHighlighted ? '#fef3c7' : bgColor,
            boxShadow: isHighlighted ? '0 0 0 3px rgba(251, 191, 36, 0.3)' : undefined,
          }}
        >
      {/* Tag Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {currentTag && (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentTag.color }}
            />
          )}
          
          {isEditing ? (
            <div className="flex-1">
              <select
                value={editTagId}
                onChange={(e) => {
                  if (e.target.value === 'add-new') {
                    setShowAddTag(true);
                  } else {
                    setEditTagId(e.target.value);
                  }
                }}
                className="w-full text-xs font-semibold px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2"
                style={{ color: currentTag?.color || '#666' }}
              >
                <option value="">Select Tag...</option>
                {allTags.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
                <option value="add-new">+ Add New Tag</option>
              </select>
            </div>
          ) : (
            <span className="text-xs font-semibold" style={{ color: currentTag?.color }}>
              {currentTag?.name || 'No Tag'}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={!editContent.trim() || !editTagId}
                className="p-1 hover:bg-white/50 rounded disabled:opacity-50"
                title="Save"
              >
                <Save size={12} style={{ color: currentTag?.color || '#666' }} />
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

      {/* Add Tag Form */}
      {showAddTag && isEditing && (
        <div className="mb-3 p-2 bg-white rounded border border-gray-300 space-y-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag name..."
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2"
          />
<div className="space-y-2">
  {/* Preset Colors */}
  <div className="flex gap-1 flex-wrap">
    {PRESET_COLORS.map(color => (
      <button
        key={color}
        onClick={() => setNewTagColor(color)}
        className="w-7 h-7 rounded border-2 transition-all hover:scale-110"
        style={{
          backgroundColor: color,
          borderColor: newTagColor === color ? '#000' : '#ddd',
          boxShadow: newTagColor === color ? '0 0 0 2px rgba(0,0,0,0.1)' : 'none',
        }}
        title={color}
      />
    ))}
  </div>
  
  {/* Custom Color Picker */}
  <div className="flex items-center gap-2">
    <label className="text-xs font-medium text-gray-600">Custom:</label>
    <input
      type="color"
      value={newTagColor}
      onChange={(e) => setNewTagColor(e.target.value)}
      className="w-12 h-7 rounded border border-gray-300 cursor-pointer"
    />
    <span className="text-xs text-gray-500 font-mono">{newTagColor}</span>
  </div>
</div>
          <div className="flex gap-1">
            <button
              onClick={handleAddNewTag}
              disabled={!newTagName.trim()}
              className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowAddTag(false);
                setNewTagName('');
              }}
              className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

{/* Content area with thumbnail and text side by side */}
<div className="flex gap-3 items-start">
  {/* Plot Thumbnail - Left side */}
  {insight.plotThumbnail && (
    <div className="flex-shrink-0">
      <img
        src={insight.plotThumbnail}
        alt="Analysis plot"
        className="w-20 h-20 object-contain rounded border"
        style={{ borderColor: currentTag?.color || '#ccc' }}
      />
    </div>
  )}

  {/* Content - Right side */}
  <div className="flex-1 min-w-0">
    {isEditing ? (
      <textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        placeholder="Write your insight..."
        className="w-full p-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 resize-none bg-white"
        rows={4}
        autoFocus
      />
    ) : (
      <p className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-wrap-anywhere">
        {insight.content}
      </p>
    )}
  </div>
</div>

      {/* Hypothesis Tags */}
      {hypotheses.length > 0 && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: `${currentTag?.color || '#ccc'}40` }}>
          {isEditing ? (
            <HypothesisTagSelector
              hypotheses={hypotheses}
              selectedTags={editHypothesisTags}
              onTagsChange={setEditHypothesisTags}
            />
          ) : (
            insight.hypothesisTags && insight.hypothesisTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {insight.hypothesisTags.map((tagId) => {
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
      )}
    </div>
  );
}