
export const editorStyles = `
.ProseMirror {
  outline: none;
  min-height: 80px;
  cursor: text;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

/* Variable styling */
.editor-variable {
  display: inline;
  background-color: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 0.25rem;
  padding: 0 0.25rem;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  white-space: nowrap; /* Prevent line breaks within variables */
  user-select: all; /* Make variables easier to select all at once */
  position: relative;
  z-index: 1;
  pointer-events: auto;
}

/* Fix for dark mode */
.dark .editor-variable {
  background-color: rgba(99, 102, 241, 0.2);
  color: #818cf8;
}

/* Ensure paragraphs break variables that cross them */
.ProseMirror p {
  position: relative;
  word-break: break-word;
}

/* Explicit prevention of variable marks across nodes */
.ProseMirror p + p .editor-variable,
.ProseMirror br + .editor-variable,
.ProseMirror .editor-variable + br {
  background-color: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
  box-shadow: none !important;
  white-space: normal !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

/* Broken variable styling - applies immediately when content changes */
.editor-variable:has(br),
.editor-variable:has(p),
.editor-variable:has(div),
.editor-variable[style],
.editor-variable[contenteditable] {
  background-color: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
  box-shadow: none !important;
  white-space: normal !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

/* Monitor keystrokes inside variables and immediately break styling */
.prose-variable-aware {
  position: relative;
}

/* Any edits to variable content instantly breaks styling */
.editor-variable:focus-within {
  background-color: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

/* Handle variables with Enter key better */
.editor-variable:has(br) {
  background-color: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
}

/* Prevent variable styling from persisting across line breaks */
.ProseMirror p:has(br) .editor-variable {
  background-color: transparent !important;
  color: inherit !important;
  font-weight: normal !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
}
`;
