'use client';

import { useState, useEffect } from 'react';
import { Database, Lightbulb, Code, FileText } from 'lucide-react';

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
  tagName?: string; // For insights - the tag name
  cellId?: string; // For insights - which cell it belongs to
}

export default function Minimap({ projectId, sections = [], onSectionClick }: MinimapProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Listen for scroll events to update active section
  useEffect(() => {
    const handleScroll = () => {
      // This would ideally detect which section is in view
      // For now, we'll update it on click
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'dataset': return <Database size={14} className="flex-shrink-0" />;
      case 'hypothesis': return <Lightbulb size={14} className="flex-shrink-0" />;
      case 'analysis': return <Code size={14} className="flex-shrink-0" />;
      case 'insight': return <FileText size={14} className="flex-shrink-0" />;
      default: return null;
    }
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

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
  };

// Group sections by type for better organization
const datasetSections = sections.filter(s => s.type === 'dataset');
const hypothesisSections = sections.filter(s => s.type === 'hypothesis');
const analysisSections = sections.filter(s => s.type === 'analysis');

  return (
    // <div className="h-full flex flex-col bg-white">
    //   {/* Header */}
    //   <div className="px-3 py-3 border-b border-gray-200 flex-shrink-0">
    //     <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
    //       Navigation
    //     </h3>
    //     <p className="text-[10px] text-gray-500 mt-0.5">
    //       {sections.length} {sections.length === 1 ? 'item' : 'items'}
    //     </p>
    //   </div>
    <div className="h-full flex flex-col bg-gray-50">
    {/* Header*/}
    <div className="px-3 py-5 border-b border-gray-200 flex-shrink-0 bg-white">
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
      Navigation
      </h3>
    </div>

      {/* Scrollable Section List */}
      <div className="flex-1 overflow-y-auto">
        {sections.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <div className="text-xs text-gray-400">No sections yet</div>
            <div className="text-[10px] text-gray-400 mt-1">
              Add data or create cells
            </div>
          </div>
        ) : (
          <div className="py-2">
            {/* Dataset Section */}
            {datasetSections.length > 0 && (
              <div className="mb-3">
                <div className="px-3 py-1">
                  <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                    Data
                  </div>
                </div>
                {datasetSections.map((section) => (
                  <button
                    key={section.id}
                    className={`w-full text-left px-3 py-2 transition-all flex items-start gap-2 group relative ${
                      activeSection === section.id
                        ? 'bg-blue-50 border-l-2 border-blue-500'
                        : hoveredSection === section.id
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSectionClick(section.id)}
                    onMouseEnter={() => setHoveredSection(section.id)}
                    onMouseLeave={() => setHoveredSection(null)}
                  >
                    {/* Left border indicator */}
                    {activeSection !== section.id && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-0.5 transition-all"
                        style={{ 
                          backgroundColor: section.color,
                          opacity: hoveredSection === section.id ? 1 : 0.3
                        }}
                      />
                    )}
                    
                    {/* Icon */}
                    <div style={{ color: section.color }}>
                      {getSectionIcon(section.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-gray-900 truncate">
                        {section.title}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        {getSectionTypeLabel(section.type)}
                      </div>
                    </div>

                    {/* Hover indicator */}
                    {hoveredSection === section.id && (
                      <div className="text-[9px] text-gray-400">→</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Hypotheses Section */}
            {hypothesisSections.length > 0 && (
              <div className="mb-3">
                <div className="px-3 py-1">
                  <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                    Hypotheses
                  </div>
                </div>
                {hypothesisSections.map((section, index) => (
                  <button
                    key={section.id}
                    className={`w-full text-left px-3 py-2 transition-all flex items-start gap-2 group relative ${
                      activeSection === section.id
                        ? 'bg-purple-50 border-l-2 border-purple-500'
                        : hoveredSection === section.id
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSectionClick(section.id)}
                    onMouseEnter={() => setHoveredSection(section.id)}
                    onMouseLeave={() => setHoveredSection(null)}
                  >
                    {/* Left border indicator */}
                    {activeSection !== section.id && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-0.5 transition-all"
                        style={{ 
                          backgroundColor: section.color,
                          opacity: hoveredSection === section.id ? 1 : 0.3
                        }}
                      />
                    )}
                    
                    {/* Icon with number */}
                    <div style={{ color: section.color }} className="flex items-center gap-1">
                      {getSectionIcon(section.type)}
                      <span className="text-[9px] font-bold">H{index + 1}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-gray-900 line-clamp-2">
                        {section.title.replace(/^H\d+:\s*/, '')}
                      </div>
                    </div>

                    {/* Hover indicator */}
                    {hoveredSection === section.id && (
                      <div className="text-[9px] text-gray-400">→</div>
                    )}
                  </button>
                ))}
              </div>
            )}

{/* Analysis/Cells Section */}
{analysisSections.length > 0 && (
              <div className="mb-3">
                <div className="px-3 py-1">
                  <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                    Analyses ({analysisSections.length})
                  </div>
                </div>
                {analysisSections.map((section, index) => {
                  // Find insights for this cell
                  const cellInsights = sections.filter(
                    s => s.type === 'insight' && (s as any).cellId === section.id
                  );
                  
                  return (
                    <div key={section.id}>
                      {/* Analysis Cell */}
                      <button
                        className={`w-full text-left px-3 py-2 transition-all flex items-start gap-2 group relative ${
                          activeSection === section.id
                            ? 'bg-blue-50 border-l-2 border-blue-500'
                            : hoveredSection === section.id
                            ? 'bg-gray-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleSectionClick(section.id)}
                        onMouseEnter={() => setHoveredSection(section.id)}
                        onMouseLeave={() => setHoveredSection(null)}
                        title={section.title}
                      >
                        {/* Left border indicator */}
                        {activeSection !== section.id && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-0.5 transition-all"
                            style={{ 
                              backgroundColor: section.color,
                              opacity: hoveredSection === section.id ? 1 : 0.3
                            }}
                          />
                        )}
                        
                        {/* Icon with number */}
                        <div style={{ color: section.color }} className="flex items-center gap-1">
                          {getSectionIcon(section.type)}
                          <span className="text-[9px] font-medium">#{index + 1}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-medium text-gray-900 line-clamp-2">
                            {section.title || `Analysis ${index + 1}`}
                          </div>
                          {cellInsights.length > 0 && (
                            <div className="text-[9px] text-gray-500 mt-0.5">
                              {cellInsights.length} {cellInsights.length === 1 ? 'insight' : 'insights'}
                            </div>
                          )}
                        </div>

                        {/* Hover indicator */}
                        {hoveredSection === section.id && (
                          <div className="text-[9px] text-gray-400">→</div>
                        )}
                      </button>
                      
                      {/* Nested Insights */}
                      {cellInsights.length > 0 && (
                        <div className="ml-4 border-l border-gray-200">
                          {cellInsights.map((insightSection, insightIndex) => (
                            <button
                              key={insightSection.id}
                              className={`w-full text-left px-3 py-1.5 transition-all flex items-start gap-2 group relative ${
                                activeSection === insightSection.id
                                  ? 'bg-green-50 border-l-2 border-green-500'
                                  : hoveredSection === insightSection.id
                                  ? 'bg-gray-50'
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleSectionClick(insightSection.id)}
                              onMouseEnter={() => setHoveredSection(insightSection.id)}
                              onMouseLeave={() => setHoveredSection(null)}
                              title={insightSection.title}
                            >
                              {/* Left border indicator */}
                              {activeSection !== insightSection.id && (
                                <div 
                                  className="absolute left-0 top-0 bottom-0 w-0.5 transition-all"
                                  style={{ 
                                    backgroundColor: insightSection.color,
                                    opacity: hoveredSection === insightSection.id ? 1 : 0.3
                                  }}
                                />
                              )}
                              
                              {/* Icon */}
                              <div style={{ color: insightSection.color }} className="flex-shrink-0">
                                {getSectionIcon(insightSection.type)}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="text-[9px] font-medium text-gray-900 line-clamp-2">
                                  {insightSection.title}
                                </div>
                                {(insightSection as any).tagName && (
                                  <div className="text-[8px] text-gray-500 mt-0.5">
                                    {(insightSection as any).tagName}
                                  </div>
                                )}
                              </div>

                              {/* Hover indicator */}
                              {hoveredSection === insightSection.id && (
                                <div className="text-[9px] text-gray-400">→</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        )}
      </div>
    </div>
  );
}