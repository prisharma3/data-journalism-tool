'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HypothesisTagSelector from './HypothesisTagSelector';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface AddInsightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string, tagId: string, hypothesisTags: string[]) => void;
    tags: Tag[];
    hypotheses: Array<{ id: string; content: string; createdAt: Date }>;
    onAddTag?: (name: string, color: string) => string;
  }

const PRESET_COLORS = [
  '#9C27B0', // Purple
  '#4CAF50', // Green
  '#F44336', // Red
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#00BCD4', // Cyan
  '#E91E63', // Pink
  '#795548', // Brown
];

export default function AddInsightModal({
  isOpen,
  onClose,
  onSave,
  tags,
  hypotheses,
  onAddTag,
}: AddInsightModalProps) {
    const [content, setContent] = useState('');
    const [selectedTagId, setSelectedTagId] = useState(tags[0]?.id || '');
    const [showNewTagForm, setShowNewTagForm] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);   
    const [selectedHypothesisTags, setSelectedHypothesisTags] = useState<string[]>([]);


  if (!isOpen) return null;

  const handleSave = () => {
    if (content.trim() && selectedTagId) {
      onSave(content.trim(), selectedTagId, selectedHypothesisTags);
      setContent('');
      setSelectedTagId(tags[0]?.id || '');
      setSelectedHypothesisTags([]);
      onClose();
    }
  };

  const handleAddNewTag = () => {
    if (newTagName.trim() && onAddTag) {
      const newTagId = onAddTag(newTagName.trim(), newTagColor);
      setSelectedTagId(newTagId);
      setNewTagName('');
      setNewTagColor(PRESET_COLORS[0]);
      setShowNewTagForm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Insight</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Insight Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Write your insight
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your insight or observation..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              autoFocus
            />
          </div>

          {/* Tag Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Tag
            </label>
            
            {!showNewTagForm ? (
              <div className="space-y-2">
                {/* Existing Tags */}
                <div className="grid grid-cols-2 gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTagId(tag.id)}
                      className="flex items-center gap-2 p-2 rounded border-2 transition-all hover:shadow-sm"
                      style={{
                        borderColor: selectedTagId === tag.id ? tag.color : '#e5e7eb',
                        backgroundColor: selectedTagId === tag.id ? `${tag.color}15` : 'white',
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {tag.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Add New Tag Button */}
                {onAddTag && (
                  <button
                    onClick={() => setShowNewTagForm(true)}
                    className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Plus size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      Create New Tag
                    </span>
                  </button>
                )}
              </div>
            ) : (
              /* New Tag Form */
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />

                {/* Color Picker */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Choose Color</p>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className="w-8 h-8 rounded border-2 transition-all"
                        style={{
                          backgroundColor: color,
                          borderColor: newTagColor === color ? '#000' : color,
                          transform: newTagColor === color ? 'scale(1.1)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* New Tag Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddNewTag}
                    disabled={!newTagName.trim()}
                    size="sm"
                    className="flex-1"
                  >
                    Add Tag
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewTagForm(false);
                      setNewTagName('');
                      setNewTagColor(PRESET_COLORS[0]);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

                    {/* Hypothesis Tag Selector */}
                    {hypotheses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link to Hypotheses (Optional)
              </label>
              <HypothesisTagSelector
                hypotheses={hypotheses}
                selectedTags={selectedHypothesisTags}
                onTagsChange={setSelectedHypothesisTags}
              />
            </div>
          )}
        </div>

        

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || !selectedTagId}
          >
            Save Insight
          </Button>
        </div>
      </div>
    </div>
  );
}