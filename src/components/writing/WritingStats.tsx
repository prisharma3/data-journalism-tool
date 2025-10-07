'use client';

import { Editor } from '@tiptap/react';

interface WritingStatsProps {
  editor: Editor;
}

export function WritingStats({ editor }: WritingStatsProps) {
  const words = editor.storage.characterCount.words();
  const characters = editor.storage.characterCount.characters();

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <span className="font-medium">{words}</span>
        <span>words</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{characters}</span>
        <span>characters</span>
      </div>
    </div>
  );
}