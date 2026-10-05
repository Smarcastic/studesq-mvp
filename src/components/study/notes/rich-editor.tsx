"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Code,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Minus,
} from "lucide-react";

interface RichEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
}

export function RichEditor({ content, onUpdate, placeholder = "Start writing..." }: RichEditorProps) {
  const initialContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary-600 underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialContentRef.current,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap w-full min-h-[400px] text-sm leading-relaxed focus:outline-none",
      },
    },
  });

  // Sync content from outside only when editor first loads or content changes externally
  const lastContentRef = useRef(content);
  useEffect(() => {
    if (editor && content !== lastContentRef.current) {
      const currentHTML = editor.getHTML();
      // Only update if content is genuinely different (avoid loops)
      if (content !== currentHTML) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
      lastContentRef.current = content;
    }
  }, [editor, content]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300"
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b" style={{ borderColor: "var(--border-normal)" }}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading">
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Add Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        {/* Word count */}
        <div className="ml-auto text-xs text-gray-400">
          {editor.storage.characterCount?.words?.() ?? editor.getText().split(/\s+/).filter(Boolean).length} words
        </div>
      </div>

      {/* Editor */}
      <div className="p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
