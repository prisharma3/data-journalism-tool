'use client';

import React from 'react';
import { EnhancedWritingEditor } from '@/components/writing/EnhancedWritingEditor';

export default function TestWritingPage() {
  // Mock notebook context
  const notebookContext = {
    hypotheses: [
      {
        id: 'h1',
        content: 'Do tariffs negatively affect farmer income?',
      },
    ],
    cells: [
      {
        id: 'cell-1',
        query: 'Analyze farmer income by tariff level',
        output: {
          text: 'Analysis shows farmers in high-tariff regions have 23% lower income. Correlation = -0.78, p < 0.01',
        },
        hypothesisTags: ['h1'],
      },
      {
        id: 'cell-2',
        query: 'Compare income across age groups',
        output: {
          text: 'Young farmers (under 40) show 35% income decline in high-tariff regions, while older farmers show only 15% decline',
        },
        hypothesisTags: ['h1'],
      },
    ],
    insights: [
      {
        id: 'insight-1',
        content: 'Strong negative correlation between tariffs and farmer income across all regions',
        cellId: 'cell-1',
        tagId: 'tag-1',
        hypothesisTags: ['h1'],
      },
    ],
    dataset: {
      filename: 'farmer_survey.csv',
      summary: {
        columnNames: ['farmer_id', 'age', 'region', 'income', 'tariff_exposure', 'crop_type'],
        rows: 5000,
      },
    },
  };

  const initialContent = `# Impact of Tariffs on American Farmers

## Introduction

Tariffs definitely harm farmers across the United States. My analysis shows a clear negative relationship between tariff levels and agricultural income.

## Findings

Young farmers are more affected by tariffs than older farmers. The data proves that income losses are concentrated among farmers under 40 years old.

All farmers in high-tariff regions experience significant economic hardship. This pattern is consistent across all crop types and geographic regions.

## Conclusion

These findings suggest that trade policy reforms are urgently needed to protect the agricultural sector.`;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Writing Editor - Claim Evaluation Test
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Edit the text to see real-time claim detection, evaluation, and suggestions
        </p>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <EnhancedWritingEditor
          projectId="test-project-123"
          notebookContext={notebookContext}
          activeHypothesis="h1"
          initialContent={initialContent}
          onContentChange={(content) => {
            console.log('Content changed:', content.substring(0, 50) + '...');
          }}
        />
      </div>
    </div>
  );
}