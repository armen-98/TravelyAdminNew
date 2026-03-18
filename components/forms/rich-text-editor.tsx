"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write your content here...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: (props: { editor: { getHTML: () => string } }) => {
      onChange(props.editor.getHTML());
    },
  });

  if (!editor) return null;

  const toolbarButtons = [
    {
      action: () => editor.chain().focus().toggleBold().run(),
      icon: Bold,
      isActive: editor.isActive("bold"),
      title: "Bold",
    },
    {
      action: () => editor.chain().focus().toggleItalic().run(),
      icon: Italic,
      isActive: editor.isActive("italic"),
      title: "Italic",
    },
    {
      action: () => editor.chain().focus().toggleStrike().run(),
      icon: Strikethrough,
      isActive: editor.isActive("strike"),
      title: "Strikethrough",
    },
    {
      action: () => editor.chain().focus().toggleBulletList().run(),
      icon: List,
      isActive: editor.isActive("bulletList"),
      title: "Bullet List",
    },
    {
      action: () => editor.chain().focus().toggleOrderedList().run(),
      icon: ListOrdered,
      isActive: editor.isActive("orderedList"),
      title: "Ordered List",
    },
    {
      action: () => editor.chain().focus().toggleBlockquote().run(),
      icon: Quote,
      isActive: editor.isActive("blockquote"),
      title: "Blockquote",
    },
  ];

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        {toolbarButtons.map(({ action, icon: Icon, isActive, title }) => (
          <Button
            key={title}
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", isActive && "bg-accent")}
            onClick={action}
            title={title}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
