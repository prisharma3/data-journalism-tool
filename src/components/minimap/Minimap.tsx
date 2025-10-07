'use client';

import { useState } from 'react';

interface MinimapProps {
  sections: MinimapSection[];
  onSectionClick: (sectionId: string) => void;
}

export interface MinimapSection {
  id: string;
  type: 'dataset' | 'hypothesis' | 'analysis' | 'insight';
  title: string;
  color: string;
  position: number;
  height: number;
}

export default function Minimap({ sections, onSectionClick }: MinimapProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const getSectionTypeLabel = (type: string) => {
    switch (type) {
      case 'dataset': return 'DATASET';
      case 'hypothesis': return 'HYPOTHESIS';
      case 'analysis': return 'ANALYSIS';
      case 'insight': return 'INSIGHT';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
          Notebook Overview
        </h3>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Scrollable Section List */}
      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-xs text-gray-400">No sections yet</div>
            <div className="text-[10px] text-gray-400 mt-1">Start adding content</div>
          </div>
        ) : (
          <div className="py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-start gap-2 group"
                onClick={() => onSectionClick(section.id)}
                onMouseEnter={() => setHoveredSection(section.id)}
                onMouseLeave={() => setHoveredSection(null)}
              >
                {/* Colored Line Indicator */}
                <div 
                  className="w-1 rounded-full mt-1 flex-shrink-0"
                  style={{ 
                    backgroundColor: section.color,
                    height: '20px',
                    minHeight: '20px'
                  }}
                />
                
                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                    {getSectionTypeLabel(section.type)}
                  </div>
                  <div 
                    className="text-xs text-gray-700 truncate mt-0.5 group-hover:text-blue-600"
                    title={section.title}
                  >
                    {section.title}
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