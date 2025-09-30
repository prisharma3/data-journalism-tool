'use client';

import { useState, useEffect } from 'react';

interface MinimapProps {
  projectId: string;
}

interface MinimapSection {
  id: string;
  type: 'dataset' | 'hypothesis' | 'analysis' | 'insight';
  position: number;
  height: number;
  color?: string;
  title: string;
}

export default function Minimap({ projectId }: MinimapProps) {
  const [sections, setSections] = useState<MinimapSection[]>([]);
  const [currentSection, setCurrentSection] = useState<string>('');

  // Load sections from API or store
  useEffect(() => {
    // TODO: Fetch sections from API based on projectId
    // fetchProjectSections(projectId);
  }, [projectId]);

  const handleSectionClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    // TODO: Scroll to section in notebook
    console.log('Navigate to section:', sectionId);
  };

  const getSectionTypeLabel = (type: string) => {
    switch (type) {
      case 'dataset': return 'Dataset';
      case 'hypothesis': return 'Hypothesis';
      case 'analysis': return 'Analysis';
      case 'insight': return 'Insight';
      default: return type;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Minimap Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Project Overview</h3>
        <p className="text-xs text-gray-500 mt-1">Click to navigate</p>
      </div>

      {/* Minimap Content */}
      <div className="flex-1 p-4">
        {/* Visual minimap representation */}
        <div className="relative h-96 bg-gray-50 rounded-lg border border-gray-200 mb-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`absolute left-2 right-2 cursor-pointer rounded transition-all hover:opacity-80 ${
                currentSection === section.id ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                top: `${(section.position / 500) * 100}%`,
                height: `${(section.height / 500) * 100}%`,
                backgroundColor: section.color
              }}
              onClick={() => handleSectionClick(section.id)}
              title={`${getSectionTypeLabel(section.type)}: ${section.title}`}
            />
          ))}
          
          {/* Empty state */}
          {sections.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              No sections yet
            </div>
          )}
        </div>

        {/* Section List */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Sections
          </h4>
          {sections.length === 0 ? (
            <p className="text-xs text-gray-500">Start adding cells to see sections</p>
          ) : (
            sections.map((section) => (
              <button
                key={section.id}
                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                  currentSection === section.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => handleSectionClick(section.id)}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: section.color }}
                  />
                  <div>
                    <div className="font-medium">{getSectionTypeLabel(section.type)}</div>
                    <div className="text-xs text-gray-500 truncate">{section.title}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}