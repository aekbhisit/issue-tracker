"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import "quill/dist/quill.snow.css";
import type Quill from "quill";
import type { RangeStatic } from "quill";
import { useFileManagerPicker } from "@/hooks/useFileManagerPicker";
import { Modal } from "@/components/ui/modal";

interface TextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  placeholder?: string;
  rows?: number;
}

type QuillInstance = Quill;
type EditorRange = RangeStatic;

let imageResizeRegistered = false;

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["link", "image"],
  ["clean"],
];

export default function TextEditor({
  value = "",
  onChange,
  label,
  required = false,
  error,
  helperText,
  className = "",
  placeholder = "",
}: TextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [savedRange, setSavedRange] = useState<EditorRange | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(value ?? "");
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const linkUrlInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const overlayObserverRef = useRef<MutationObserver | null>(null);
  const overlayCleanupFnsRef = useRef<Array<() => void>>([]);
  const isResizingRef = useRef(false);
  const bodyOverflowBackupRef = useRef<string | null>(null);
  const htmlOverflowBackupRef = useRef<string | null>(null);
  const { openPicker, picker } = useFileManagerPicker();
  const { t } = useTranslation();

  const removeExistingToolbars = useCallback(() => {
    const container = editorContainerRef.current;
    if (!container?.parentElement) return;
    const parent = container.parentElement;
    parent.querySelectorAll(':scope > .ql-toolbar').forEach((toolbar) => {
      toolbar.remove();
    });
  }, []);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!isSourceMode) {
      setSourceValue(value ?? "");
    }
  }, [isSourceMode, value]);

  const buildFullUrl = useCallback((path: string) => {
    if (!path) return path;
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const normalized = path.startsWith("/") ? path : `/${path}`;
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

    if (apiBase) {
      return `${apiBase}${normalized}`;
    }

    if (typeof window !== "undefined") {
      const origin = window.location.origin.replace(/\/$/, "");
      return `${origin}${normalized}`;
    }

    return normalized;
  }, []);

  const getQuill = useCallback(() => quillRef.current, []);

  const handleImageInsert = useCallback(async () => {
    try {
      const file = await openPicker();
      if (!file?.url) return;

      const quill = getQuill();
      if (!quill) return;

      const range = quill.getSelection(true);
      const index = range?.index ?? quill.getLength();
      const fullUrl = buildFullUrl(file.url);

      quill.insertEmbed(index, "image", fullUrl, "user");
      quill.setSelection(index + 1, 0, "user");
    } catch (error) {
      console.error("Failed to insert image:", error);
    }
  }, [buildFullUrl, getQuill, openPicker]);

  const handleOpenLinkModal = useCallback(() => {
    const quill = getQuill();
    if (!quill) return;

    const range = quill.getSelection();
    const safeRange: EditorRange = range ?? { index: quill.getLength(), length: 0 };
    const selectedText = safeRange.length > 0 ? quill.getText(safeRange.index, safeRange.length) : "";

    setSavedRange(safeRange);
    setLinkText(selectedText);
    setLinkUrl("");
    setIsLinkModalOpen(true);
  }, [getQuill]);

  const handleConfirmLink = useCallback(() => {
    if (!linkUrl) return;
    const quill = getQuill();
    if (!quill || !savedRange) return;

    const fullUrl = buildFullUrl(linkUrl.trim());
    const { index, length } = savedRange;

    quill.setSelection(index, length, "silent");

    if (length === 0) {
      const displayText = linkText.trim() || fullUrl;
      quill.insertText(index, displayText, "link", fullUrl, "user");
      quill.setSelection(index + displayText.length, 0, "user");
    } else {
      quill.format("link", fullUrl, "user");
      quill.setSelection(index + length, 0, "user");
    }

    setIsLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
    setSavedRange(null);
  }, [buildFullUrl, getQuill, linkText, linkUrl, savedRange]);

  const handleCancelLink = useCallback(() => {
    setIsLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
    setSavedRange(null);
  }, []);

  useEffect(() => {
    if (isLinkModalOpen) {
      const timer = setTimeout(() => {
        linkUrlInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLinkModalOpen]);

  const stopResizing = useCallback(() => {
    if (!isResizingRef.current) return;
    document.body.style.overflow = bodyOverflowBackupRef.current ?? "";
    document.documentElement.style.overflow = htmlOverflowBackupRef.current ?? "";
    bodyOverflowBackupRef.current = null;
    htmlOverflowBackupRef.current = null;
    isResizingRef.current = false;
  }, []);

  const handleOverlayMouseDown = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isHandle =
        target.dataset?.quillImageResizeHandle === "true" ||
        target.style.cursor.includes("resize");

      if (!isHandle) return;

      event.preventDefault();

      if (!isResizingRef.current) {
        isResizingRef.current = true;
        bodyOverflowBackupRef.current = document.body.style.overflow;
        htmlOverflowBackupRef.current = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      }

      const onMouseUp = () => {
        window.removeEventListener("mouseup", onMouseUp, true);
        stopResizing();
      };

      window.addEventListener("mouseup", onMouseUp, true);
    },
    [stopResizing]
  );

  const handleSourceChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      setSourceValue(newValue);
      onChangeRef.current(newValue);
    },
    []
  );

  const toggleSourceMode = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) {
      setIsSourceMode((prev) => !prev);
      return;
    }

    stopResizing();

    if (isSourceMode) {
      quill.enable(true);
      quill.clipboard.dangerouslyPasteHTML(sourceValue ?? "", "silent");
      setIsSourceMode(false);
      onChangeRef.current(sourceValue ?? "");
      quill.focus();
    } else {
      const currentHtml = quill.root.innerHTML;
      setSourceValue(currentHtml);
      quill.enable(false);
      setIsFocused(false);
      setIsSourceMode(true);
    }
  }, [isSourceMode, sourceValue, stopResizing]);

  useEffect(() => {
    let quill: QuillInstance | null = null;
    let mounted = true;
    let cleanupHandlers: (() => void) | null = null;

    const init = async () => {
      removeExistingToolbars();
      const { default: Quill } = await import("quill");
      if (typeof window !== "undefined") {
        const win = window as any;
        win.Quill = Quill;
        if (!win.Quill.imports) {
          win.Quill.imports = {};
        }
        if (!win.Quill.imports.parchment) {
          win.Quill.imports.parchment = Quill.import("parchment");
        }
      }
      if (!imageResizeRegistered) {
        const imageResizeModule = await import("quill-image-resize-module");
        const ImageResize = (imageResizeModule as any).default ?? imageResizeModule;
        (Quill as any).register("modules/imageResize", ImageResize);
        imageResizeRegistered = true;
      }
      if (!mounted || !editorContainerRef.current) return;

      quill = new Quill(editorContainerRef.current, {
        theme: "snow",
        modules: {
          toolbar: TOOLBAR_OPTIONS,
          history: {
            delay: 1000,
            maxStack: 100,
            userOnly: true,
          },
          imageResize: {
            modules: ["Resize", "DisplaySize", "Toolbar"],
          },
        },
        placeholder,
      });

      const toolbarModule = quill.getModule("toolbar") as {
        addHandler: (name: string, handler: () => void) => void;
      } | undefined;

      toolbarModule?.addHandler("image", () => {
        void handleImageInsert();
      });
      toolbarModule?.addHandler("link", () => {
        handleOpenLinkModal();
      });

      quill.clipboard.dangerouslyPasteHTML(value ?? "", "silent");
      quillRef.current = quill;
      setIsQuillReady(true);

      const handleTextChange = () => {
        if (isResizingRef.current || isSourceMode) {
          return;
        }
        const html = quill?.root.innerHTML ?? "";
        onChangeRef.current(html);
      };

      const handleSelectionChange = (range: RangeStatic | null) => {
        if (isResizingRef.current) {
          return;
        }
        setIsFocused(Boolean(range));
      };

      quill.on("text-change", handleTextChange);
      quill.on("selection-change", handleSelectionChange);

      cleanupHandlers = () => {
        quill?.off("text-change", handleTextChange);
        quill?.off("selection-change", handleSelectionChange);
      };
    };

    init().catch((error) => {
      console.error("Failed to initialize Quill editor:", error);
    });

    return () => {
      mounted = false;
      if (cleanupHandlers) {
        cleanupHandlers();
      }
      quillRef.current = null;
      setIsQuillReady(false);
      removeExistingToolbars();
      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = "";
      }
    };
  }, [handleImageInsert, handleOpenLinkModal, removeExistingToolbars]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const placeholderValue = placeholder ?? "";
    quill.root.dataset.placeholder = placeholderValue;
    quill.root.setAttribute("data-placeholder", placeholderValue);
  }, [placeholder]);

  useEffect(() => {
    if (!isQuillReady || isSourceMode) return;
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml = quill.root.innerHTML;
    if ((value || "") === currentHtml) {
      return;
    }

    quill.clipboard.dangerouslyPasteHTML(value ?? "", "silent");
  }, [isQuillReady, isSourceMode, value]);

  useEffect(() => {
    return () => {
      stopResizing();
    };
  }, [stopResizing]);

  useEffect(() => {
    if (!isQuillReady || isSourceMode) return;
    const quill = quillRef.current;
    if (!quill) return;

    const parent = quill.root.parentElement;
    if (!parent) return;

    const cleanupOverlayListeners = () => {
      overlayCleanupFnsRef.current.forEach((fn) => fn());
      overlayCleanupFnsRef.current = [];
    };

    const markHandles = (overlay: HTMLElement) => {
      overlay.setAttribute("data-quill-image-overlay", "true");
      const annotateHandles = () => {
        overlay.querySelectorAll("div").forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.style.cursor.includes("resize")) {
            node.dataset.quillImageResizeHandle = "true";
          }
        });
      };

      annotateHandles();

      const overlayMutation = new MutationObserver(annotateHandles);
      overlayMutation.observe(overlay, { childList: true, subtree: true });
      overlayCleanupFnsRef.current.push(() => overlayMutation.disconnect());

      overlay.addEventListener("mousedown", handleOverlayMouseDown, true);
      overlayCleanupFnsRef.current.push(() =>
        overlay.removeEventListener("mousedown", handleOverlayMouseDown, true)
      );
  };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.dataset.quillImageOverlay === "true") return;
          if (node.style.border?.includes("dashed") && node.style.position === "absolute") {
            markHandles(node);
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.dataset.quillImageOverlay === "true") {
            cleanupOverlayListeners();
            stopResizing();
    }
        });
      });
    });

    observer.observe(parent, { childList: true });
    overlayObserverRef.current = observer;

    parent.querySelectorAll(":scope > div").forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.style.border?.includes("dashed") && node.style.position === "absolute") {
        markHandles(node);
      }
    });

    return () => {
      observer.disconnect();
      overlayObserverRef.current = null;
      cleanupOverlayListeners();
      stopResizing();
    };
  }, [handleOverlayMouseDown, isQuillReady, isSourceMode, stopResizing]);

  const wrapperClassName = useMemo(
    () =>
      `text-editor-wrapper rounded-lg border border-gray-300 dark:border-gray-600 ${
        isFocused ? "ring-2 ring-brand-500 border-brand-500" : ""
      } ${error ? "border-red-500 ring-2 ring-red-500/40" : ""}`,
    [error, isFocused]
  );

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 pr-24">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {error && (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
        
        <button
          type="button"
        onClick={toggleSourceMode}
        disabled={!isQuillReady}
        className="absolute right-0 top-[-1rem] inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        {isSourceMode ? t('admin.textEditor.buttons.exitSource') : t('admin.textEditor.buttons.viewSource')}
        </button>
        
      <div className={wrapperClassName}>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .text-editor-wrapper .ql-toolbar {
                border-top-left-radius: 0.5rem;
                border-top-right-radius: 0.5rem;
                background: rgba(249, 250, 251, 1);
                border-color: #d1d5db;
              }
              .text-editor-wrapper .ql-toolbar button,
              .text-editor-wrapper .ql-toolbar .ql-picker-label,
              .text-editor-wrapper .ql-toolbar .ql-picker-item {
                color: #4b5563;
              }
              .text-editor-wrapper .ql-toolbar .ql-stroke {
                stroke: #4b5563;
              }
              .text-editor-wrapper .ql-toolbar .ql-fill {
                fill: #4b5563;
              }
              .dark .text-editor-wrapper .ql-toolbar {
                background: #374151;
                border-color: #4b5563;
              }
              .dark .text-editor-wrapper .ql-toolbar button,
              .dark .text-editor-wrapper .ql-toolbar .ql-picker-label,
              .dark .text-editor-wrapper .ql-toolbar .ql-picker-item {
                color: var(--color-gray-300);
              }
              .dark .text-editor-wrapper .ql-toolbar .ql-stroke {
                stroke: var(--color-gray-300);
              }
              .dark .text-editor-wrapper .ql-toolbar .ql-fill {
                fill: var(--color-gray-300);
              }
              .text-editor-wrapper .ql-container {
                border-bottom-left-radius: 0.5rem;
                border-bottom-right-radius: 0.5rem;
                border-color: #d1d5db;
                overflow: hidden;
              }
              .dark .text-editor-wrapper .ql-container {
                border-color: #4b5563;
                background: #1f2937;
              }
              .text-editor-wrapper .ql-editor {
                min-height: 12rem;
                max-height: none;
                color: #111827;
                font-size: 0.95rem;
                line-height: 1.6;
                padding: 0.75rem 1rem;
                overflow-y: visible;
              }
              .dark .text-editor-wrapper .ql-editor {
                color: #f9fafb;
              }
              .text-editor-wrapper .ql-editor p {
                margin: 1em 0;
              }
              .text-editor-wrapper .ql-editor h1 {
                font-size: 1.875rem;
                line-height: 2.25rem;
                font-weight: 700;
                margin-top: 1.75em;
                margin-bottom: 0.75em;
              }
              .text-editor-wrapper .ql-editor h2 {
                font-size: 1.5rem;
                line-height: 2rem;
                font-weight: 600;
                margin-top: 1.5em;
                margin-bottom: 0.75em;
              }
              .text-editor-wrapper .ql-editor blockquote {
                border-left: 4px solid #e5e7eb;
                padding-left: 1rem;
                color: #6b7280;
                font-style: italic;
                margin: 1.25em 0;
              }
              .dark .text-editor-wrapper .ql-editor blockquote {
                border-color: #4b5563;
                color: #9ca3af;
              }
              .text-editor-wrapper .ql-editor pre {
                background: #111827;
                color: #e5e7eb;
                padding: 1rem;
                border-radius: 0.75rem;
                overflow-x: auto;
                margin: 1.25em 0;
              }
              .text-editor-wrapper .ql-editor code {
                background: #f3f4f6;
                color: #1f2937;
                padding: 0.125rem 0.375rem;
                border-radius: 0.375rem;
                font-size: 0.9em;
              }
              .dark .text-editor-wrapper .ql-editor code {
                background: #1f2937;
                color: #f3f4f6;
              }
              .text-editor-wrapper .ql-editor a {
                color: #2563eb;
                text-decoration: underline;
              }
              .dark .text-editor-wrapper .ql-editor a {
                color: #60a5fa;
              }
              .text-editor-wrapper .ql-editor::before {
                color: #d1d5db;
              }
              .dark .text-editor-wrapper .ql-editor::before {
                color: #6b7280;
              }
            `,
          }}
        />
        <div
          ref={editorContainerRef}
          className="ql-snow"
          style={isSourceMode ? { display: "none" } : undefined}
        />
        {isSourceMode && (
          <textarea
            value={sourceValue}
            onChange={handleSourceChange}
            className="min-h-[12rem] w-full rounded-b-lg border border-gray-300 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900"
            spellCheck={false}
          />
        )}
      </div>

      {picker}

      <Modal
        isOpen={isLinkModalOpen}
        onClose={handleCancelLink}
        showBackdrop={false}
        contentClassName="inline-block bg-transparent"
      >
        <div className="min-w-[24rem] rounded-xl bg-white p-4 shadow-lg dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('admin.textEditor.linkModal.title')}</h3>
          <div className="mt-4 grid gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.textEditor.linkModal.urlLabel')}</label>
              <input
                ref={linkUrlInputRef}
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder={t('admin.textEditor.linkModal.urlPlaceholder')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.textEditor.linkModal.textLabel')}</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder={linkUrl || t('admin.textEditor.linkModal.textPlaceholder')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
              onClick={handleCancelLink}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
              {t('admin.textEditor.linkModal.cancel')}
        </button>
        <button
          type="button"
              onClick={handleConfirmLink}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
              {t('admin.textEditor.linkModal.insert')}
        </button>
      </div>
        </div>
      </Modal>
    </div>
  );
}
