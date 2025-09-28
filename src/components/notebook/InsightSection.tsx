'use client';

import { useState } from 'react';
import { Bookmark, Search, Filter, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useProjectStore } from '@/stores/projectStore';

interface InsightSectionProps {
  projectId: string;
  isActive: boolean;
}

export function InsightSection({ projectId, isActive }: InsightSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  
  const { 
    insights, 
    tags, 
    addTag,
    updateInsight,
    removeInsight 
  } = useProjectStore();

  // Filter insights based on search and tag filter
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = insight.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTagFilter === 'all' || insight.tagId === selectedTagFilter;
    return matchesSearch && matchesTag;
  });

  // Group insights by tag
  const insightsByTag = tags.map(tag => ({
    tag,
    insights: filteredInsights.filter(insight => insight.tagId === tag.id),
  })).filter(group => group.insights.length > 0);

  // Handle creating new tag
  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      alert('Please enter a tag name');
      return;
    }

    const newTag = {
      id: `tag-${Date.now()}`,
      projectId,
      name: newTagName.trim(),
      color: newTagColor,
      createdAt: new Date().toISOString(),
    };

    addTag(newTag);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setShowTagManager(false);
    
    console.log('Created new tag:', newTag);
  };

  // Handle insight deletion
  const handleDeleteInsight = (insightId: string) => {
    if (confirm('Are you sure you want to delete this insight?')) {
      removeInsight(insightId);
    }
  };

  // Handle insight editing (basic version)
  const handleEditInsight = (insightId: string) => {
    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;

    const newContent = prompt('Edit insight:', insight.content);
    if (newContent && newContent.trim() !== insight.content) {
      updateInsight(insightId, {
        content: newContent.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Predefined tag colors
  const tagColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  return (
    <Card 
      className={`
        transition-all duration-200 border-l-4 border-l-yellow-400
        ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
      `}
      style={{ backgroundColor: '#FFF9C4' }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-yellow-600" />
            <span>Insights ({insights.length})</span>
          </div>
          
          <Button
            onClick={() => setShowTagManager(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Tag
          </Button>
        </CardTitle>
        
        <CardDescription>
          All insights from your analyses, organized by tags
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white">
                <Filter className="w-4 h-4 mr-1" />
                {selectedTagFilter === 'all' ? 'All Tags' : tags.find(t => t.id === selectedTagFilter)?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedTagFilter('all')}>
                All Tags ({insights.length})
              </DropdownMenuItem>
              {tags.map(tag => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => setSelectedTagFilter(tag.id)}
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name} ({insights.filter(i => i.tagId === tag.id).length})</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tag Manager Modal */}
        {showTagManager && (
          <div className="bg-white p-4 border border-yellow-300 rounded">
            <h3 className="font-medium text-gray-900 mb-4">Create New Tag</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name
                </label>
                <Input
                  placeholder="Enter tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex space-x-2 flex-wrap">
                  {tagColors.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 ${
                        newTagColor === color ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTagManager(false);
                    setNewTagName('');
                    setNewTagColor('#3B82F6');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Create Tag
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Insights Display */}
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <div className="text-lg font-medium mb-2">
              {searchQuery || selectedTagFilter !== 'all' ? 'No matching insights' : 'No insights yet'}
            </div>
            <div className="text-sm">
              {searchQuery || selectedTagFilter !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Create insights from your analysis outputs'
              }
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Group by Tag */}
            {insightsByTag.map(({ tag, insights: tagInsights }) => (
              <div key={tag.id} className="space-y-3">
                {/* Tag Header */}
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium text-gray-900">{tag.name}</span>
                  <Badge variant="secondary">
                    {tagInsights.length}
                  </Badge>
                </div>

                {/* Insights in this tag */}
                <div className="space-y-2 ml-6">
                  {tagInsights.map(insight => (
                    <div 
                      key={insight.id}
                      className="bg-white p-4 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                      style={{ 
                        borderLeft: `4px solid ${tag.color}`,
                        backgroundColor: `${tag.color}05` 
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-gray-800 mb-2">
                            {insight.content}
                          </div>
                          <div className="text-xs text-gray-500">
                            Created {new Date(insight.createdAt).toLocaleDateString()} at{' '}
                            {new Date(insight.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInsight(insight.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInsight(insight.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {insights.length > 0 && (
          <div className="bg-white p-4 rounded border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-3">Project Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{insights.length}</div>
                <div className="text-gray-600">Total Insights</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{tags.length}</div>
                <div className="text-gray-600">Tags Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {new Set(insights.map(i => i.analysisOutputId)).size}
                </div>
                <div className="text-gray-600">Analyses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Math.round(insights.length / Math.max(new Set(insights.map(i => i.analysisOutputId)).size, 1) * 10) / 10}
                </div>
                <div className="text-gray-600">Insights/Analysis</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}