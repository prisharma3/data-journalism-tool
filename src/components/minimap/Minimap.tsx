'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MinimapSection } from './MinimapSection';
import { useProjectStore } from '@/stores/projectStore';
import { MinimapSection as MinimapSectionType } from '@/types';
import { COLORS } from '@/lib/constants';

interface MinimapProps {
  onSectionClick: (sectionId: string) => void;
  currentSection?: string;
}

export function Minimap({ onSectionClick, currentSection }: MinimapProps) {
  const [sections, setSections] = useState<MinimapSectionType[]>([]);
  const { 
    datasets, 
    hypotheses, 
    analyses, 
    insights,
    currentProject 
  } = useProjectStore();

  // Generate minimap sections based on project data
  useEffect(() => {
    if (!currentProject) return;

    const newSections: MinimapSectionType[] = [];

    // Dataset section (always present if project exists)
    newSections.push({
      id: 'dataset-section',
      type: 'dataset',
      title: datasets.length > 0 ? `Dataset: ${datasets[0].fileName}` : 'Upload Dataset',
      color: COLORS.DATASET,
      position: 0,
      isActive: currentSection === 'dataset-section',
    });

    // Hypothesis sections
    hypotheses.forEach((hypothesis, index) => {
      newSections.push({
        id: `hypothesis-${hypothesis.id}`,
        type: 'hypothesis',
        title: `H${index + 1}: ${hypothesis.content.substring(0, 30)}...`,
        color: COLORS.HYPOTHESIS,
        position: newSections.length,
        isActive: currentSection === `hypothesis-${hypothesis.id}`,
      });

      // Analysis sections for this hypothesis
      const hypothesisAnalyses = analyses.filter(a => a.hypothesisId === hypothesis.id);
      hypothesisAnalyses.forEach((analysis, analysisIndex) => {
        newSections.push({
          id: `analysis-${analysis.id}`,
          type: 'analysis',
          title: `A${index + 1}.${analysisIndex + 1}: ${analysis.query.substring(0, 25)}...`,
          color: COLORS.ANALYSIS,
          position: newSections.length,
          isActive: currentSection === `analysis-${analysis.id}`,
        });

        // Output section for this analysis
        newSections.push({
          id: `output-${analysis.id}`,
          type: 'output',
          title: `Output ${index + 1}.${analysisIndex + 1}`,
          color: COLORS.OUTPUT,
          position: newSections.length,
          isActive: currentSection === `output-${analysis.id}`,
        });
      });
    });

    // Insights section (if any insights exist)
    if (insights.length > 0) {
      newSections.push({
        id: 'insights-section',
        type: 'insight',
        title: `Insights (${insights.length})`,
        color: COLORS.INSIGHT,
        position: newSections.length,
        isActive: currentSection === 'insights-section',
      });
    }

    setSections(newSections);
  }, [datasets, hypotheses, analyses, insights, currentProject, currentSection]);

  if (!currentProject) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-sm text-gray-500 text-center">
          No project selected
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Project Navigation</h3>
        <div className="text-xs text-gray-500">
          {currentProject.name}
        </div>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <MinimapSection
              section={section}
              onClick={() => onSectionClick(section.id)}
              isActive={section.isActive}
            />
          </motion.div>
        ))}
      </div>

      {sections.length === 1 && (
        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-xs text-gray-500">
            Start by uploading a dataset, then add hypotheses and analyses
          </div>
        </div>
      )}
    </motion.div>
  );
}