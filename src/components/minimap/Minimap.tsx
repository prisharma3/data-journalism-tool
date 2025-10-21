'use client';

import { useState } from 'react';

interface MinimapProps {
  projectId: string;
  sections?: MinimapSection[];
  onSectionClick?: (sectionId: string) => void;
}

export interface MinimapSection {
  id: string;
  type: 'dataset' | 'hypothesis' | 'analysis' | 'insight';
  title: string;
  color: string;
  position: number;
  height: number;
}

export default function Minimap({ projectId, sections = [], onSectionClick }: MinimapProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const getSectionTypeLabel = (type: string) => {
    switch (type) {
      case 'dataset': return 'DATA';
      case 'hypothesis': return 'H';
      case 'analysis': return 'ANALYSIS';
      case 'insight': return 'INSIGHT';
      default: return type.toUpperCase();
    }
  };

  const handleSectionClick = (sectionId: string) => {
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
    // Scroll to section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-2 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
          Map
        </h3>
      </div>

      {/* Scrollable Section List */}
      <div className="flex-1 overflow-y-auto py-2">
        {sections.length === 0 ? (
          <div className="px-2 text-center mt-8">
            <div className="text-[10px] text-gray-400">Empty</div>
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                className="w-full text-left px-2 py-1.5 hover:bg-gray-100 transition-colors flex items-center gap-1.5 group"
                onClick={() => handleSectionClick(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
                title={section.title}
              >
                {/* Colored Indicator */}
                <div 
                  className="w-0.5 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: section.color,
                    height: '16px',
                  }}
                />
                
                {/* Type Label */}
                <div className="flex-1 min-w-0">
                  <div 
                    className={`text-[9px] font-medium truncate transition-colors ${
                      hoveredSection === section.id ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    {getSectionTypeLabel(section.type)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}