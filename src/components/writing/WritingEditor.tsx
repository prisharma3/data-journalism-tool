'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect, useState } from 'react';
import { WritingToolbar } from './WritingToolbar';
import { WritingStats } from './WritingStats';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Save, Eye, Lightbulb } from 'lucide-react';

interface WritingEditorProps {
  projectId: string;
  initialContent?: string;
}

export default function WritingEditor({ projectId, initialContent = '' }: WritingEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [content, setContent] = useState(initialContent);
  const { token } = useAuthStore();

  // Initialize Tiptap editor with immediatelyRender: false to fix SSR
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 pl-4 italic',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'bg-gray-100 rounded px-1 py-0.5 font-mono text-sm',
          },
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your data journalism article...',
      }),
      CharacterCount,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px] p-12',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  // Debounced content for auto-save (save after 2 seconds of no typing)
  const debouncedContent = useDebounce(content, 2000);

  // Auto-save effect
  useEffect(() => {
    if (debouncedContent && debouncedContent !== initialContent && editor) {
      autoSave(debouncedContent);
    }
  }, [debouncedContent]);

  // Auto-save function
  const autoSave = async (contentToSave: string) => {
    if (!editor || !token) return;
    
    setIsSaving(true);
    try {
      const wordCount = editor.storage.characterCount.words() || 0;
      
      const response = await fetch(`/api/projects/${projectId}/article`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: contentToSave,
          word_count: wordCount,
          auto_save: true,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      } else {
        console.error('Auto-save failed:', await response.text());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save function
  const manualSave = async () => {
    if (!editor || !token) return;
    
    setIsSaving(true);
    try {
      const wordCount = editor.storage.characterCount.words() || 0;
      
      const response = await fetch(`/api/projects/${projectId}/article`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          word_count: wordCount,
          auto_save: false,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      } else {
        console.error('Manual save failed:', await response.text());
      }
    } catch (error) {
      console.error('Manual save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      {/* Top toolbar - Two rows for better space management */}
      <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
        {/* First row - Title and stats */}
        <div className="px-6 py-2 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Writing</h2>
            <WritingStats editor={editor} />
          </div>
          
          {/* Save status */}
          <div className="text-sm text-gray-500">
            {isSaving && 'Saving...'}
            {!isSaving && lastSaved && (
              <span>Saved {formatTimeAgo(lastSaved)}</span>
            )}
            {!isSaving && !lastSaved && content !== initialContent && 'Unsaved changes'}
          </div>
        </div>

        {/* Second row - Action buttons */}
        <div className="px-6 py-2 flex items-center gap-2">
          {/* Manual save button */}
          <Button
            variant="outline"
            size="sm"
            onClick={manualSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Save
          </Button>

          {/* View Relevant Analysis button */}
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              console.log('View Relevant Analysis clicked');
            }}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            View Analysis
          </Button>

          {/* Suggest Alternative Analysis button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Suggest Alternative Analysis clicked');
            }}
          >
            <Lightbulb className="w-4 h-4 mr-1.5" />
            Suggest Analysis
          </Button>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="flex-shrink-0">
        <WritingToolbar editor={editor} />
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="w-full max-w-[1200px] mx-auto py-12 px-8">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 min-h-[600px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 120) return '1 minute ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return '1 hour ago';
  return `${Math.floor(seconds / 3600)} hours ago`;
}