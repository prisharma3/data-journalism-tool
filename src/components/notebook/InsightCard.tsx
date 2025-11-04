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
  const [editTagIds, setEditTagIds] = useState<string[]>(
    insight.tagId ? [insight.tagId] : []
  ); // Changed to array
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
    if (editContent.trim() && editTagIds.length > 0) {
      // Use the first tag as the primary tag for backward compatibility
      onUpdate(insight.id, editContent.trim(), editTagIds[0], editHypothesisTags);
      setIsEditing(false);
      sessionStorage.removeItem('editingInsightId');
    }
  };

  const handleCancel = () => {
    // Only delete if it's a NEW insight (no original content AND not saved yet)
    // An insight is "new" if it was just created and never had content
    const isNewUnsavedInsight = !insight.content && !insight.tagId;
    
    if (isNewUnsavedInsight) {
      // This is a brand new insight that was never saved - delete it
      onDelete(insight.id);
    } else {
      // This is an existing insight - just revert changes and exit edit mode
      setEditContent(insight.content);
      setEditTagIds(insight.tagId ? [insight.tagId] : []);
      setEditHypothesisTags(insight.hypothesisTags || []);
      setIsEditing(false);
      // Clear the editing flag
      sessionStorage.removeItem('editingInsightId');
    }
  };

  const handleAddNewTag = () => {
    if (newTagName.trim() && onAddTag) {
      const newTagId = onAddTag(newTagName.trim(), newTagColor);
      // Add to the selected tags array
      setEditTagIds(prev => [...prev, newTagId]);
      setNewTagName('');
      setNewTagColor(PRESET_COLORS[0]);
      setShowAddTag(false);
    }
  };

  const currentTag = tag || allTags.find(t => t.id === insight.tagId);
  const selectedTags = isEditing 
    ? allTags.filter(t => editTagIds.includes(t.id))
    : (tag ? [tag] : []);
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
  <span className="text-xs font-semibold text-gray-600">
    {editTagIds.length} tag{editTagIds.length !== 1 ? 's' : ''} selected
  </span>
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
                disabled={!editContent.trim() || editTagIds.length === 0}
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
  onClick={() => {
    // Store that we're editing this specific insight
    sessionStorage.setItem('editingInsightId', insight.id);
    setIsEditing(true);
  }}
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

      {/* Multi-select Tag Selector - ONLY in edit mode */}
      {isEditing && !showAddTag && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Select Tags (multiple)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">
            {allTags.map(t => {
              const isSelected = editTagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTagIds(prev => 
                      prev.includes(t.id)
                        ? prev.filter(id => id !== t.id) // Remove if selected
                        : [...prev, t.id] // Add if not selected
                    );
                  }}
                  className="flex items-center gap-2 p-2 rounded border-2 transition-all hover:shadow-sm text-left"
                  style={{
                    borderColor: isSelected ? t.color : '#e5e7eb',
                    backgroundColor: isSelected ? `${t.color}15` : 'white',
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {t.name}
                    </span>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add New Tag Button */}
          {onAddTag && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddTag(true);
              }}
              className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-all mt-2"
            >
              <Plus size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-600">
                Create New Tag
              </span>
            </button>
          )}
        </div>
      )}

      {/* Selected Tags Display with Delete Option - ONLY in edit mode */}
      {isEditing && editTagIds.length > 0 && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Selected Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {editTagIds.map(tagId => {
              const tagObj = allTags.find(t => t.id === tagId);
              if (!tagObj) return null;
              return (
                <div
                  key={tagId}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${tagObj.color}20`,
                    color: tagObj.color,
                    border: `1px solid ${tagObj.color}`,
                  }}
                >
                  <span>{tagObj.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditTagIds(prev => prev.filter(id => id !== tagId));
                    }}
                    className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
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