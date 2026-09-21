"use client"

import * as React from "react"
import { Button } from "../../../_components/ui/button"

// Dependency-free class name utility
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

function ToolbarButton({
  label,
  title,
  onClick,
  className,
}: {
  label: React.ReactNode
  title: string
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[13px] font-medium transition-all duration-200",
        "text-neutral-600 hover:bg-neutral-200 hover:text-(--color-text)",
        className
      )}
    >
      {label}
    </Button>
  )
}

function Divider() {
  return (
    <span className="mx-1.5 h-4 w-[1.5px] flex-none rounded-full bg-(--color-divider) opacity-60" />
  )
}

/**
 * A small, custom rich-text editor built on `contentEditable` +
 * `execCommand` — plain HTML in, plain HTML out (matching `insights.content`,
 * which the public site renders with `dangerouslySetInnerHTML`). No
 * Editor.js/JSON block format, no ProseMirror — just enough formatting for
 * a firm's articles: headings, paragraphs, quotes, lists, links.
 *
 * Uncontrolled by design: the DOM is the source of truth once mounted, so
 * typing never fights a React re-render. Pass a `key` from the caller
 * (e.g. the article id) to force a remount when switching articles.
 */
export function RichEditor({
  defaultValue,
  onChange,
  placeholder,
}: {
  defaultValue: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (ref.current) ref.current.innerHTML = defaultValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exec(command: string, value?: string) {
    ref.current?.focus()
    document.execCommand(command, false, value)
    onChange(ref.current?.innerHTML ?? "")
  }

  function handleLink() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      window.alert("Select some text first, then add the link.")
      return
    }
    const url = window.prompt("Link URL (https://…)")
    if (url) exec("createLink", url)
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-(--color-divider) bg-(--color-bg) shadow-sm transition-all duration-300 focus-within:border-neutral-400 focus-within:shadow-md focus-within:ring-1 focus-within:ring-neutral-400">
      {/* Editorial Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-(--color-divider) bg-neutral-50 px-3 py-2">
        <ToolbarButton
          label={<span className="font-bold">B</span>}
          title="Bold"
          onClick={() => exec("bold")}
        />
        <ToolbarButton
          label={<span className="font-serif italic">I</span>}
          title="Italic"
          onClick={() => exec("italic")}
        />
        <ToolbarButton
          label={<span className="underline underline-offset-2">U</span>}
          title="Underline"
          onClick={() => exec("underline")}
        />

        <Divider />

        <ToolbarButton
          label={<span className="font-semibold tracking-tight">H2</span>}
          title="Heading"
          onClick={() => exec("formatBlock", "H2")}
        />
        <ToolbarButton
          label={<span className="font-medium tracking-tight">H3</span>}
          title="Subheading"
          onClick={() => exec("formatBlock", "H3")}
        />
        <ToolbarButton
          label={<span className="font-serif text-[14px]">¶</span>}
          title="Paragraph"
          onClick={() => exec("formatBlock", "P")}
        />
        <ToolbarButton
          label={
            <span className="font-serif text-[16px] leading-none tracking-tighter">
              “ ”
            </span>
          }
          title="Quote"
          onClick={() => exec("formatBlock", "BLOCKQUOTE")}
        />

        <Divider />

        <ToolbarButton
          label="• List"
          title="Bullet list"
          onClick={() => exec("insertUnorderedList")}
        />
        <ToolbarButton
          label="1. List"
          title="Numbered list"
          onClick={() => exec("insertOrderedList")}
        />

        <Divider />

        <ToolbarButton label="Link" title="Link" onClick={handleLink} />
        <ToolbarButton
          label="Unlink"
          title="Remove link"
          onClick={() => exec("unlink")}
        />
        <ToolbarButton
          label="Clear"
          title="Clear formatting"
          onClick={() => exec("removeFormat")}
        />

        <Divider />

        <ToolbarButton
          label="Undo"
          title="Undo"
          onClick={() => exec("undo")}
          className="ml-auto"
        />
        <ToolbarButton label="Redo" title="Redo" onClick={() => exec("redo")} />
      </div>

      {/* Writing Canvas */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onBlur={() => onChange(ref.current?.innerHTML ?? "")}
        data-placeholder={placeholder}
        className={cn(
          "cl-body min-h-100 px-5 py-6 text-[15px] leading-[1.75] text-(--color-text) outline-none md:px-8 md:py-8",
          "empty:before:text-neutral-400 empty:before:italic empty:before:content-[attr(data-placeholder)]",
          // Base typography enhancements for the editable area so it looks elegant while typing
          "[&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-(--color-text)",
          "[&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-[18px] [&_h3]:font-medium [&_h3]:tracking-tight [&_h3]:text-(--color-text)",
          "[&_p]:mb-4",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-neutral-300 [&_blockquote]:pl-4 [&_blockquote]:text-neutral-600 [&_blockquote]:italic"
        )}
      />
    </div>
  )
}
