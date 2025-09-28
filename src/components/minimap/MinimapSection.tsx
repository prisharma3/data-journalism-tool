'use client';

import { motion } from 'framer-motion';
import { Database, Lightbulb, BarChart3, FileOutput, Bookmark } from 'lucide-react';
import { MinimapSection as MinimapSectionType } from '@/types';

interface MinimapSectionProps {
  section: MinimapSectionType;
  onClick: () => void;
  isActive: boolean;
}

export function MinimapSection({ section, onClick, isActive }: MinimapSectionProps) {
  const getIcon = () => {
    switch (section.type) {
      case 'dataset':
        return <Database className="w-4 h-4" />;
      case 'hypothesis':
        return <Lightbulb className="w-4 h-4" />;
      case 'analysis':
        return <BarChart3 className="w-4 h-4" />;
      case 'output':
        return <FileOutput className="w-4 h-4" />;
      case 'insight':
        return <Bookmark className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (section.type) {
      case 'dataset':
        return 'Dataset';
      case 'hypothesis':
        return 'Hypothesis';
      case 'analysis':
        return 'Analysis';
      case 'output':
        return 'Output';
      case 'insight':
        return 'Insights';
      default:
        return '';
    }
  };

  return (
    <motion.button
      className={`
        w-full p-3 rounded-lg border text-left transition-all duration-200
        ${isActive 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
      style={{
        backgroundColor: isActive ? undefined : `${section.color}15`, // 15% opacity
        borderLeftColor: section.color,
        borderLeftWidth: '4px',
      }}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start space-x-3">
        <div 
          className="flex-shrink-0 p-1 rounded"
          style={{ color: section.color }}
        >
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span 
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ 
                backgroundColor: `${section.color}20`,
                color: section.color 
              }}
            >
              {getTypeLabel()}
            </span>
          </div>
          
          <div className="text-sm text-gray-900 font-medium leading-tight">
            {section.title}
          </div>
          
          {section.type === 'dataset' && (
            <div className="text-xs text-gray-500 mt-1">
              Click to upload or view data
            </div>
          )}
          
          {section.type === 'hypothesis' && (
            <div className="text-xs text-gray-500 mt-1">
              Research hypothesis
            </div>
          )}
          
          {section.type === 'analysis' && (
            <div className="text-xs text-gray-500 mt-1">
              AI-generated analysis
            </div>
          )}
          
          {section.type === 'output' && (
            <div className="text-xs text-gray-500 mt-1">
              Results and visualizations
            </div>
          )}
          
          {section.type === 'insight' && (
            <div className="text-xs text-gray-500 mt-1">
              Tagged insights collection
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}