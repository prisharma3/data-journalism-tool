'use client';

import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Code,
} from 'lucide-react';

interface WritingToolbarProps {
  editor: Editor;
}

export function WritingToolbar({ editor }: WritingToolbarProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 px-4 py-2 flex items-center gap-1 bg-white sticky top-0 z-10">
      {/* Text formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleBold().run();
        }}
        className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        type="button"
      >
        <Bold className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleItalic().run();
        }}
        className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        type="button"
      >
        <Italic className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleCode().run();
        }}
        className={editor.isActive('code') ? 'bg-gray-200' : ''}
        type="button"
      >
        <Code className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Headings */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleHeading({ level: 1 }).run();
        }}
        className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
        type="button"
      >
        <Heading1 className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        }}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
        type="button"
      >
        <Heading2 className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleHeading({ level: 3 }).run();
        }}
        className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
        type="button"
      >
        <Heading3 className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleBulletList().run();
        }}
        className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
        type="button"
      >
        <List className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleOrderedList().run();
        }}
        className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
        type="button"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().toggleBlockquote().run();
        }}
        className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
        type="button"
      >
        <Quote className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().undo().run();
        }}
        disabled={!editor.can().undo()}
        type="button"
      >
        <Undo className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          editor.chain().focus().redo().run();
        }}
        disabled={!editor.can().redo()}
        type="button"
      >
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
}